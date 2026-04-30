import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';
import { VerifyConnectionDto } from './metatrader-connection.service';

@Injectable()
export class MT5BridgeService {
    private readonly logger = new Logger(MT5BridgeService.name);
    private readonly DEFAULT_BRIDGE_PORT = 5000;
    private readonly DEFAULT_BRIDGE_HOST = '127.0.0.1';

    async verify(dto: VerifyConnectionDto): Promise<any> {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            let responseData = '';

            const host = dto.bridgeIp || this.DEFAULT_BRIDGE_HOST;
            const port = dto.bridgePort || this.DEFAULT_BRIDGE_PORT;

            // Timeout after 5 seconds
            client.setTimeout(5000);

            client.connect(port, host, () => {
                this.logger.debug(`Connected to MT5 Bridge at ${host}:${port}`);

                // Construct request
                // For now, we just send a VERIFY command. 
                // The EA runs on a specific account, so we are verifying if that account is active 
                // and matches the provided login (optional check).
                const request = {
                    command: 'VERIFY',
                    login: dto.login
                };

                client.write(JSON.stringify(request));
            });

            client.on('data', (data) => {
                responseData += data.toString();
            });


            client.on('end', () => {
                try {
                    this.logger.debug(`Received response from Bridge: ${responseData}`);
                    const result = JSON.parse(responseData);

                    // Log the full parsed result for debugging
                    this.logger.log(`Parsed VERIFY response: ${JSON.stringify(result)}`);

                    // Logic to verify if the connected account matches the requested login
                    // Note: The EA returns info about the *active* account in MT5.
                    if (result.success) {
                        // Extract login from response - support multiple field names
                        let actualLogin = result.login || result.account;

                        // If actualLogin is still undefined, try to extract from other fields
                        if (!actualLogin) {
                            this.logger.warn(`No login/account field in response. Full response: ${JSON.stringify(result)}`);
                        }

                        this.logger.log(`Comparing logins - EA: ${actualLogin}, Requested: ${dto.login}`);

                        if (String(actualLogin) === String(dto.login)) {
                            // Ensure the response has a 'login' field for consistency
                            result.login = actualLogin;
                            resolve(result);
                        } else {
                            // If logins don't match, it means MT5 is logged into a different account
                            resolve({
                                success: false,
                                error: `MT5 Terminal is logged into account ${actualLogin}, but you requested ${dto.login}. Please switch accounts in MT5.`
                            });
                        }
                    } else {
                        resolve(result);
                    }

                } catch (e) {
                    this.logger.error('Failed to parse bridge response', e);
                    resolve({
                        success: false,
                        error: 'Invalid response from MT5 Bridge'
                    });
                }
            });

            client.on('error', (err) => {
                this.logger.error('Bridge connection error', err);
                resolve({
                    success: false,
                    error: 'Could not connect to MT5 Bridge. Is the EA running in MetaTrader 5?'
                });
            });

            client.on('timeout', () => {
                this.logger.error('Bridge connection timed out');
                client.destroy();
                resolve({
                    success: false,
                    error: 'Connection to MT5 Bridge timed out'
                });
            });
        });
    }

    async placeTrade(
        connection: { host?: string; port?: number },
        trade: {
            symbol: string;
            type: 'BUY' | 'SELL';
            volume: number;
            sl?: number;
            tp?: number;
        }
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            let responseData = '';

            const host = connection.host || this.DEFAULT_BRIDGE_HOST;
            const port = connection.port || this.DEFAULT_BRIDGE_PORT;

            client.setTimeout(5000);

            client.connect(port, host, () => {
                this.logger.debug(`Sending TRADE command to Bridge at ${host}:${port}: ${JSON.stringify(trade)}`);

                const request = {
                    command: 'TRADE',
                    symbol: trade.symbol,
                    type: trade.type,
                    volume: trade.volume,
                    sl: trade.sl || 0,
                    tp: trade.tp || 0
                };

                client.write(JSON.stringify(request));
            });

            client.on('data', (data) => {
                responseData += data.toString();
            });

            client.on('end', () => {
                try {
                    this.logger.debug(`Received trade response from Bridge: ${responseData}`);
                    const result = JSON.parse(responseData);
                    resolve(result);
                } catch (e) {
                    this.logger.error('Failed to parse bridge response', e);
                    resolve({
                        success: false,
                        error: 'Invalid response from MT5 Bridge'
                    });
                }
            });

            client.on('error', (err) => {
                this.logger.error('Bridge connection error', err);
                resolve({
                    success: false,
                    error: 'Could not connect to MT5 Bridge'
                });
            });

            client.on('timeout', () => {
                client.destroy();
                resolve({
                    success: false,
                    error: 'Connection to MT5 Bridge timed out'
                });
            });
        });
    }

    async getRecentTrades(
        connection: { host?: string; port?: number },
        fromTime: number
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            let responseData = '';

            const host = connection.host || this.DEFAULT_BRIDGE_HOST;
            const port = connection.port || this.DEFAULT_BRIDGE_PORT;

            client.setTimeout(5000);

            client.connect(port, host, () => {
                // this.logger.debug(`Requesting recent trades from Bridge at ${host}:${port} since ${fromTime}`);

                const request = {
                    command: 'GET_RECENT_TRADES',
                    fromTime: fromTime
                };

                client.write(JSON.stringify(request));
            });

            client.on('data', (data) => {
                responseData += data.toString();
            });

            client.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    resolve(result);
                } catch (e) {
                    this.logger.error('Failed to parse bridge response', e);
                    resolve({
                        success: false,
                        error: 'Invalid response from MT5 Bridge'
                    });
                }
            });

            client.on('error', (err) => {
                // Silent error for polling to avoid log spam
                // this.logger.error('Bridge connection error', err);
                resolve({
                    success: false,
                    error: 'Could not connect to MT5 Bridge'
                });
            });

            client.on('timeout', () => {
                client.destroy();
                resolve({
                    success: false,
                    error: 'Connection to MT5 Bridge timed out'
                });
            });
        });
    }

    async closeTrade(
        connection: { host?: string; port?: number },
        ticket: string
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            let responseData = '';

            const host = connection.host || this.DEFAULT_BRIDGE_HOST;
            const port = connection.port || this.DEFAULT_BRIDGE_PORT;

            client.setTimeout(5000);

            client.connect(port, host, () => {
                this.logger.debug(`Sending CLOSE command to Bridge at ${host}:${port} for ticket ${ticket}`);

                const request = {
                    command: 'CLOSE',
                    ticket: Number(ticket)
                };

                client.write(JSON.stringify(request));
            });

            client.on('data', (data) => {
                responseData += data.toString();
            });

            client.on('end', () => {
                try {
                    this.logger.debug(`Received close response from Bridge: ${responseData}`);
                    const result = JSON.parse(responseData);
                    resolve(result);
                } catch (e) {
                    this.logger.error('Failed to parse bridge response', e);
                    resolve({
                        success: false,
                        error: 'Invalid response from MT5 Bridge'
                    });
                }
            });

            client.on('error', (err) => {
                this.logger.error('Bridge connection error', err);
                resolve({
                    success: false,
                    error: 'Could not connect to MT5 Bridge'
                });
            });

            client.on('timeout', () => {
                client.destroy();
                resolve({
                    success: false,
                    error: 'Connection to MT5 Bridge timed out'
                });
            });
        });
    }
}
