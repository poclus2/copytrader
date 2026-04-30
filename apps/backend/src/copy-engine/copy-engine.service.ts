import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { SlavesService } from '../slaves/slaves.service';
import { MockAdapter } from '../adapters/mock.adapter';
import { MastersService } from '../masters/masters.service';
import { MT5BridgeService } from '../metatrader-connection/mt5-bridge.service';
import { TradesService } from '../trades/trades.service';

@Injectable()
export class CopyEngineService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(CopyEngineService.name);
    private pollingInterval: NodeJS.Timeout;
    private lastCheckMap = new Map<string, number>(); // masterId -> timestamp
    private isPolling = false; // Guard: prevents concurrent polling cycles

    constructor(
        private slavesService: SlavesService,
        private brokerAdapter: MockAdapter,
        private mastersService: MastersService,
        private mt5BridgeService: MT5BridgeService,
        private tradesService: TradesService,
    ) { }

    onModuleInit() {
        this.logger.log('Starting Copy Engine...');
        this.pollingInterval = setInterval(() => this.pollMasters(), 1000); // Poll every 1 second
    }

    onModuleDestroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
    }

    async pollMasters() {
        // If a previous cycle is still running, skip this tick to avoid concurrency issues
        if (this.isPolling) {
            this.logger.debug('Previous polling cycle still running, skipping this tick.');
            return;
        }

        this.isPolling = true;
        try {
            const masters = await this.mastersService.findAll();
            // this.logger.debug(`Polling ${masters.length} masters`);

            for (const master of masters) {
                if (!master.isActive) {
                    // this.logger.debug(`Master ${master.name} is inactive, skipping`);
                    continue;
                }
                // Check if master has bridge credentials configured
                if (!master.credentials?.bridgeIp || !master.credentials?.bridgePort) {
                    this.logger.warn(`Master ${master.name} missing bridge credentials`);
                    continue;
                }

                const lastCheck = this.lastCheckMap.get(master.id) || 0;
                // On first check, look back 24 hours to populate history
                const fromTime = lastCheck === 0 ? Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000) : lastCheck;
                const checkTime = Math.floor(Date.now() / 1000);

                const connection = {
                    host: master.credentials.bridgeIp,
                    port: master.credentials.bridgePort
                };

                // this.logger.debug(`Checking master ${master.name} at ${connection.host}:${connection.port} since ${fromTime}`);

                const result = await this.mt5BridgeService.getRecentTrades(connection, fromTime);

                if (result.success && Array.isArray(result.trades) && result.trades.length > 0) {
                    this.logger.log(`Found ${result.trades.length} trades for master ${master.name}`);

                    for (const trade of result.trades) {
                        // We rely on database deduplication (findByTicket) instead of time filtering
                        // to avoid issues with broker vs local timezone differences.

                        this.logger.log(`Processing trade ticket ${trade.ticket} for master ${master.name}`);
                        await this.processTrade(master.id, trade);
                    }
                } else if (!result.success) {
                    this.logger.warn(`Failed to get trades for master ${master.name}: ${result.error}`);
                }

                this.lastCheckMap.set(master.id, checkTime);
            }
        } catch (error) {
            this.logger.error('Error polling masters', error);
        } finally {
            // Always release the lock, even if an error occurred
            this.isPolling = false;
        }
    }

    async processTrade(masterId: string, trade: any) {
        // Map MT5 trade to internal format
        // trade: { ticket, order, time, type, entry, symbol, volume, price, profit, commission, swap ... }
        // type: 0=BUY, 1=SELL
        // entry: 0=IN, 1=OUT

        const side = trade.type === 0 ? 'BUY' : 'SELL';
        const isOpen = trade.entry === 0;

        if (isOpen) {
            // Check if trade already exists to avoid duplicates
            const existingTrade = await this.tradesService.findByTicket(masterId, String(trade.ticket));
            if (existingTrade) {
                // Trade already processed, skip
                return;
            }

            // Save master trade to database
            const masterTrade = await this.tradesService.create({
                masterId,
                ticket: String(trade.ticket),
                symbol: trade.symbol,
                type: side,
                volume: trade.volume,
                openPrice: trade.price,
                profit: trade.profit || 0,
                commission: trade.commission || 0,
                swap: trade.swap || 0,
                status: 'OPEN',
                openTime: new Date(trade.time * 1000), // Unix timestamp to Date
            });

            this.logger.log(`Saved master trade ${masterTrade.id} (ticket: ${trade.ticket})`);

            // Propagate to slaves
            await this.executeTrade(masterId, {
                symbol: trade.symbol,
                side: side,
                quantity: trade.volume,
                price: trade.price,
                originalTicket: trade.ticket,
                masterTradeId: masterTrade.id, // Pass master trade ID for linking
            });
        } else {
            // Handle Close
            this.logger.log(`Close trade detected: ${trade.ticket} (${side} ${trade.symbol})`);

            // Find the existing open trade
            const existingTrade = await this.tradesService.findByTicket(masterId, String(trade.ticket));

            this.logger.log(`[DEBUG] Found existing trade for ticket ${trade.ticket}: ${existingTrade ? existingTrade.id : 'null'} (Status: ${existingTrade?.status})`);

            if (existingTrade && existingTrade.status === 'OPEN') {
                // Update trade details
                await this.tradesService.update(existingTrade.id, {
                    closePrice: trade.price,
                    closeTime: new Date(trade.time * 1000),
                    profit: trade.profit,
                    commission: trade.commission,
                    swap: trade.swap,
                    status: 'CLOSED',
                });

                this.logger.log(`Updated trade ${existingTrade.id} to CLOSED (Profit: ${trade.profit})`);

                // Propagate close to slaves
                await this.closeSlaveTrades(existingTrade.id);
            } else if (existingTrade && existingTrade.status === 'CLOSED') {
                this.logger.log(`Trade ${existingTrade.id} already CLOSED, retrying slave closes if needed`);
                await this.closeSlaveTrades(existingTrade.id);
            } else if (!existingTrade) {
                // Import historical closed trade
                await this.tradesService.create({
                    masterId,
                    ticket: String(trade.ticket),
                    symbol: trade.symbol,
                    type: side === 'BUY' ? 'SELL' : 'BUY', // Invert for original type
                    volume: trade.volume,
                    openPrice: 0, // Unknown from close deal alone
                    closePrice: trade.price,
                    profit: trade.profit || 0,
                    commission: trade.commission || 0,
                    swap: trade.swap || 0,
                    status: 'CLOSED',
                    closeTime: new Date(trade.time * 1000),
                    openTime: new Date(trade.time * 1000), // Approximate
                });
                this.logger.log(`Imported historical closed trade ${trade.ticket}`);
            }
        }
    }

    async executeTrade(masterId: string, trade: any) {
        this.logger.log(`Received trade from master ${masterId}: ${JSON.stringify(trade)}`);

        // 1. Get subscriptions/slaves for this master
        const slaves = await this.slavesService.findByMasterId(masterId);

        // Fetch master account to get balance and equity for ratio calculations
        const master = await this.mastersService.findOne(masterId);

        for (const slave of slaves) {
            if (!slave.isActive) continue;

            this.logger.log(`Copying to slave ${slave.id}`);

            // 2. Calculate quantity with balance/equity if available
            const quantity = this.calculateQuantity(
                trade.quantity,
                slave.config,
                master?.balance,
                master?.equity,
                slave.balance,
                slave.equity
            );

            if (quantity <= 0) {
                this.logger.warn(`Calculated quantity is ${quantity} for slave ${slave.id}, skipping order.`);
                continue;
            }

            // 3. Place order and save to database
            try {
                // Check if it's a MetaTrader connection (either explicitly 'metatrader' or has bridge credentials)
                // This ensures that specific brokers (like 'ic-markets') that use the bridge are handled correctly
                const isMetaTrader = slave.broker === 'metatrader' ||
                    (slave.credentials?.bridgeIp && slave.credentials?.bridgePort);

                if (isMetaTrader) {
                    // Place MT5 trade
                    const result = await this.mt5BridgeService.placeTrade(
                        {
                            host: slave.credentials.bridgeIp,
                            port: slave.credentials.bridgePort
                        },
                        {
                            symbol: trade.symbol,
                            type: trade.side,
                            volume: quantity,
                        }
                    );

                    if (!result.success) {
                        this.logger.error(`Failed to place trade on slave ${slave.id}: ${result.error}`);
                        // Save as FAILED so user knows it was attempted but failed
                        await this.tradesService.create({
                            slaveId: slave.id,
                            sourceTradeId: trade.masterTradeId,
                            symbol: trade.symbol,
                            type: trade.side,
                            volume: quantity,
                            openPrice: trade.price,
                            status: 'FAILED',
                            errorMessage: result.error || 'Unknown error',
                            openTime: new Date(),
                        });
                        continue;
                    }

                    // Save slave trade to database as OPEN
                    // IMPORTANT: Store the ticket returned by MT5 so we can close it later
                    await this.tradesService.create({
                        slaveId: slave.id,
                        sourceTradeId: trade.masterTradeId, // Link to master trade
                        ticket: result.ticket ? String(result.ticket) : undefined, // Store MT5 ticket
                        symbol: trade.symbol,
                        type: trade.side,
                        volume: quantity,
                        openPrice: result.price || trade.price, // Use actual execution price if available
                        status: 'OPEN',
                        openTime: new Date(),
                    });

                    this.logger.log(`Successfully placed and saved trade for slave ${slave.id} (ticket: ${result.ticket})`);
                } else {
                    // Place trade via mock adapter (for other brokers)
                    await this.brokerAdapter.placeOrder({
                        symbol: trade.symbol,
                        side: trade.side,
                        type: 'MARKET',
                        quantity: quantity,
                    });

                    // Save slave trade to database
                    await this.tradesService.create({
                        slaveId: slave.id,
                        sourceTradeId: trade.masterTradeId,
                        symbol: trade.symbol,
                        type: trade.side,
                        volume: quantity,
                        openPrice: trade.price,
                        status: 'OPEN',
                        openTime: new Date(),
                    });

                    this.logger.log(`Successfully copied trade to slave ${slave.id}`);
                }
            } catch (error: any) {
                this.logger.error(`Failed to copy to slave ${slave.id}`, error);
                // Also save as FAILED on exception
                await this.tradesService.create({
                    slaveId: slave.id,
                    sourceTradeId: trade.masterTradeId,
                    symbol: trade.symbol,
                    type: trade.side,
                    volume: quantity,
                    openPrice: trade.price,
                    status: 'FAILED',
                    errorMessage: error.message || 'Internal error',
                    openTime: new Date(),
                });
            }
        }
    }

    private calculateQuantity(masterQuantity: number, slaveConfig: any, masterBalance?: number, masterEquity?: number, slaveBalance?: number, slaveEquity?: number): number {
        const mode = slaveConfig?.mode || 'FIXED_RATIO';
        let quantity = 0;

        switch (mode) {
            case 'FIXED_LOT':
                quantity = Number(slaveConfig.fixedLotSize) || 0.01; // Default safe fallback
                break;
            case 'BALANCE_RATIO':
                // Calculate based on balance ratio: (Slave Balance / Master Balance) * Master Volume * Ratio
                if (masterBalance && masterBalance > 0 && slaveBalance && slaveBalance > 0) {
                    const balanceRatio = slaveBalance / masterBalance;
                    const ratio = Number(slaveConfig?.ratio) || 1.0;
                    quantity = masterQuantity * balanceRatio * ratio;
                } else {
                    this.logger.warn('BALANCE_RATIO mode requires valid master and slave balance. Falling back to FIXED_RATIO.');
                    const ratio = Number(slaveConfig?.ratio) || 1.0;
                    quantity = masterQuantity * ratio;
                }
                break;
            case 'EQUITY_RATIO':
                // Calculate based on equity ratio: (Slave Equity / Master Equity) * Master Volume * Ratio
                if (masterEquity && masterEquity > 0 && slaveEquity && slaveEquity > 0) {
                    const equityRatio = slaveEquity / masterEquity;
                    const ratio = Number(slaveConfig?.ratio) || 1.0;
                    quantity = masterQuantity * equityRatio * ratio;
                } else {
                    this.logger.warn('EQUITY_RATIO mode requires valid master and slave equity. Falling back to FIXED_RATIO.');
                    const ratio = Number(slaveConfig?.ratio) || 1.0;
                    quantity = masterQuantity * ratio;
                }
                break;
            case 'FIXED_RATIO':
            default:
                const ratio = Number(slaveConfig?.ratio) || 1.0;
                quantity = masterQuantity * ratio;
                break;
        }

        // Round to 2 decimal places to avoid floating point artifacts (e.g. 0.12000000001)
        quantity = Math.round(quantity * 100) / 100;

        // --- Lot size boundary validation ---
        // MT5 universal minimum is 0.01. Sending less will be rejected by the broker.
        const MIN_LOT = 0.01;
        // Maximum lot is configurable per slave; default to 100.0 as a safe upper bound.
        const MAX_LOT = Number(slaveConfig?.maxLotSize) || 100.0;

        if (quantity < MIN_LOT) {
            this.logger.warn(
                `Calculated quantity ${quantity} is below minimum lot size (${MIN_LOT}). ` +
                `This order will be skipped. Check slave ratio/config.`
            );
            return 0; // Caller already skips quantity <= 0
        }

        if (quantity > MAX_LOT) {
            this.logger.warn(
                `Calculated quantity ${quantity} exceeds max lot size (${MAX_LOT}). ` +
                `Capping to ${MAX_LOT} to protect the slave account.`
            );
            quantity = MAX_LOT;
        }

        return quantity;
    }

    async closeSlaveTrades(masterTradeId: string) {
        try {
            // Find all slave trades linked to this master trade
            const slaveTrades = await this.tradesService.findBySourceTradeId(masterTradeId);

            this.logger.log(`[DEBUG] Found ${slaveTrades.length} slave trades for master trade ${masterTradeId}`);

            if (slaveTrades.length === 0) {
                this.logger.debug(`No slave trades found for master trade ${masterTradeId}`);
                return;
            }

            // --- Correctif 4: Batch SQL ---
            // Collect all unique slave IDs from trades that need closing, then load them
            // in a single SQL query instead of N individual findOne() calls inside the loop.
            const pendingTrades = slaveTrades.filter(
                t => t.status !== 'CLOSED' && t.status !== 'CLOSE_FAILED' && t.slaveId
            );

            const uniqueSlaveIds = [...new Set(pendingTrades.map(t => t.slaveId as string))];
            const slavesMap = await this.slavesService.findByIds(uniqueSlaveIds);

            for (const slaveTrade of slaveTrades) {
                // Skip if already definitively closed or already marked as failed
                if (slaveTrade.status === 'CLOSED' || slaveTrade.status === 'CLOSE_FAILED') continue;

                if (!slaveTrade.slaveId) continue;
                // O(1) lookup from the pre-loaded Map — no extra SQL query
                const slave = slavesMap.get(slaveTrade.slaveId);
                if (!slave) continue;

                this.logger.log(`Closing trade for slave ${slave.name} (Ticket: ${slaveTrade.ticket})`);

                try {
                    const isMetaTrader = slave.broker === 'metatrader' ||
                        (slave.credentials?.bridgeIp && slave.credentials?.bridgePort);

                    if (isMetaTrader && slaveTrade.ticket) {
                        // Close via MT5 Bridge
                        const result = await this.mt5BridgeService.closeTrade(
                            {
                                host: slave.credentials.bridgeIp,
                                port: slave.credentials.bridgePort
                            },
                            slaveTrade.ticket as string
                        );

                        if (result.success) {
                            await this.tradesService.update(slaveTrade.id, {
                                status: 'CLOSED',
                                closePrice: result.closePrice || 0,
                                closeTime: new Date(),
                                profit: result.profit || 0
                            });
                            this.logger.log(`Successfully closed slave trade ${slaveTrade.id}`);
                        } else {
                            // Mark as CLOSE_FAILED so it is visible in dashboard and can be retried manually
                            this.logger.error(`Failed to close slave trade ${slaveTrade.id}: ${result.error}`);
                            await this.tradesService.update(slaveTrade.id, {
                                status: 'CLOSE_FAILED',
                                errorMessage: result.error || 'MT5 Bridge returned failure on close',
                            });
                        }
                    } else {
                        // Mock close
                        await this.brokerAdapter.cancelOrder(slaveTrade.ticket || 'mock-id');
                        await this.tradesService.update(slaveTrade.id, {
                            status: 'CLOSED',
                            closeTime: new Date()
                        });
                        this.logger.log(`Successfully closed slave trade ${slaveTrade.id} (Mock)`);
                    }
                } catch (e: any) {
                    this.logger.error(`Error closing slave trade ${slaveTrade.id}`, e);
                    // Persist the exception so it does not remain silently OPEN
                    await this.tradesService.update(slaveTrade.id, {
                        status: 'CLOSE_FAILED',
                        errorMessage: e?.message || 'Unexpected error during close',
                    });
                }
            }
        } catch (error) {
            this.logger.error(`Error in closeSlaveTrades for master trade ${masterTradeId}`, error);
        }
    }
}
