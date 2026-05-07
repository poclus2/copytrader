import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropFirmConfig } from './entities/prop-firm-config.entity';
import { ShieldLog } from './entities/shield-log.entity';



export interface ShieldedTradePayload {
    volume: number;
    jitterMs: number;
    magicNumber: number;
    comment: string;
    blockedByEquityGuard: boolean;
    blockReason?: string;
    /** Obfuscated Stop Loss price to send to the slave broker (0 = not set) */
    decoySl: number;
    /** Obfuscated Take Profit price to send to the slave broker (0 = not set) */
    decoyTp: number;
}

@Injectable()
export class PropFirmShieldService {
    private readonly logger = new Logger(PropFirmShieldService.name);

    constructor(
        @InjectRepository(PropFirmConfig)
        private readonly configRepo: Repository<PropFirmConfig>,
        @InjectRepository(ShieldLog)
        private readonly logRepo: Repository<ShieldLog>,
    ) {}

    // ─────────────────────────────────────────────────────────────────────────
    // Public API — called by CopyEngineService
    // ─────────────────────────────────────────────────────────────────────────

    /** Retrieve the PropFirmConfig for a given slave, or null if not set up. */
    async getConfig(slaveId: string): Promise<PropFirmConfig | null> {
        return this.configRepo.findOne({ where: { slaveId } });
    }

    /** Create or fully replace a PropFirmConfig for a slave. */
    async upsertConfig(slaveId: string, dto: Partial<PropFirmConfig>): Promise<PropFirmConfig> {
        let config = await this.configRepo.findOne({ where: { slaveId } });
        if (!config) {
            config = this.configRepo.create({ slaveId, ...dto });
        } else {
            Object.assign(config, dto);
        }
        return this.configRepo.save(config);
    }

    /** Toggle the shield on/off for a slave without resetting other settings. */
    async toggleShield(slaveId: string, enabled: boolean): Promise<PropFirmConfig> {
        return this.upsertConfig(slaveId, { isEnabled: enabled });
    }

    /**
     * Main interception point.
     * Returns a ShieldedTradePayload that the CopyEngine should use
     * instead of the raw values when placing or closing an order.
     *
     * Steps:
     *   1. Apply temporal jitter (async delay)
     *   2. Apply lot variation (statistical noise)
     *   3. Generate magic number + comment metadata
     *   4. Run equity guard check
     *   5. Fire-and-forget log to ShieldLog table
     */
    async applyShield(
        config: PropFirmConfig,
        originalVolume: number,
        slaveEquity: number,
        initialDailyEquity: number,
        totalStartEquity: number,
        slaveId: string,
        masterTradeId: string,
        symbol: string,
        side: string,
        action: 'OPEN' | 'CLOSE',
        brokerName?: string,
        masterSl = 0,
        masterTp = 0,
    ): Promise<ShieldedTradePayload> {

        // ── A. Temporal jitter ────────────────────────────────────────────────
        const jitterMs = this.applyJitter(config.minJitter, config.maxJitter);
        await this.delay(jitterMs);

        // ── B. Volume variation ───────────────────────────────────────────────
        const shieldedVolume = this.calculateShieldedVolume(originalVolume, config.lotVariation);

        // ── C. Metadata ───────────────────────────────────────────────────────
        const magicNumber = this.generateMagicNumber(slaveId);
        const comment = this.generateComment(config.customCommentPrefix);

        // ── D. Equity guard ───────────────────────────────────────────────────
        const { blocked, reason } = this.checkEquityGuard(
            slaveEquity,
            initialDailyEquity,
            totalStartEquity,
            config.dailyLossLimit,
            config.totalLossLimit,
        );

        // ── E. Decoy SL/TP obfuscation ────────────────────────────────────
        const { decoySl, decoyTp } = config.useDecoySlTp
            ? this.obfuscatePriceLevels(side as 'BUY' | 'SELL', symbol, masterSl, masterTp, config.decoyOffsetPips)
            : { decoySl: masterSl, decoyTp: masterTp };

        const payload: ShieldedTradePayload = {
            volume: shieldedVolume,
            jitterMs,
            magicNumber,
            comment,
            blockedByEquityGuard: blocked,
            blockReason: reason,
            decoySl,
            decoyTp,
        };

        // ── E. Async log (fire-and-forget — does NOT block the trade pipeline) ─
        this.saveLog({
            slaveId,
            masterTradeId,
            symbol,
            side,
            originalVolume,
            shieldedVolume,
            jitterMs,
            magicNumber,
            comment,
            action,
            blockedByEquityGuard: blocked,
            blockReason: reason,
        }).catch(err => this.logger.error('ShieldLog save failed (non-blocking)', err));

        return payload;
    }

    /** Paginated log retrieval for the monitoring dashboard. */
    async getLogs(slaveId: string, limit = 50): Promise<ShieldLog[]> {
        return this.logRepo.find({
            where: { slaveId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    /** Aggregate stats for the monitoring widget. */
    async getStats(slaveId: string): Promise<{
        totalOrders: number;
        blockedOrders: number;
        avgJitterMs: number;
    }> {
        const logs = await this.logRepo
            .createQueryBuilder('l')
            .select('COUNT(*)', 'total')
            .addSelect('SUM(CASE WHEN l.blockedByEquityGuard = true THEN 1 ELSE 0 END)', 'blocked')
            .addSelect('AVG(l.jitterMs)', 'avgJitter')
            .where('l.slaveId = :slaveId', { slaveId })
            .getRawOne();

        return {
            totalOrders: parseInt(logs.total, 10) || 0,
            blockedOrders: parseInt(logs.blocked, 10) || 0,
            avgJitterMs: parseFloat(logs.avgJitter) || 0,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // A. Temporal Jitter
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns a random integer in [min, max] to be used as delay in ms.
     * Using crypto-grade randomness is not available without Node 18 crypto,
     * but Math.random() is sufficient here since the goal is statistical
     * unpredictability at the broker level, not cryptographic security.
     */
    private applyJitter(minMs: number, maxMs: number): number {
        return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // B. Statistical Volume Variation
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Applies a random ± lotVariation% noise to the volume.
     * Result is always rounded to 0.01 (MT5 minimum step) and never < 0.01.
     *
     * Example: volume=1.0, lotVariation=1.5
     *   → random factor in [-0.015, +0.015]
     *   → adjusted = 1.0 * (1 ± factor) → rounded to 0.01
     */
    calculateShieldedVolume(volume: number, lotVariationPct: number): number {
        const variationFactor = lotVariationPct / 100;
        // Random value in [-variationFactor, +variationFactor]
        const noise = (Math.random() * 2 - 1) * variationFactor;
        const adjusted = volume * (1 + noise);
        const rounded = Math.round(adjusted * 100) / 100;
        return Math.max(0.01, rounded);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // C. Signature Metadata Generation
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generates a stable uint32 magic number from the slaveId.
     * Same slaveId → always same magic number (deterministic hash).
     * Different slaveIds → different magic numbers (statistical uniqueness).
     *
     * Algorithm: simple DJB2-like hash of the UUID string, clamped to uint32.
     */
    generateMagicNumber(slaveId: string): number {
        let hash = 5381;
        for (let i = 0; i < slaveId.length; i++) {
            hash = ((hash << 5) + hash) ^ slaveId.charCodeAt(i);
            hash = hash >>> 0; // Clamp to uint32 at each step to avoid overflow
        }
        return hash >>> 0; // Final uint32 clamp
    }

    /**
     * Generates a comment that looks like a manual entry.
     * Format: "{prefix}{4-digit random number}" → e.g. "MNL_4829"
     * The 4-digit suffix varies on every order to simulate human input.
     */
    generateComment(prefix: string): string {
        const suffix = Math.floor(Math.random() * 9000 + 1000); // 1000–9999
        return `${prefix}${suffix}`;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // D. Equity Guard
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Checks whether the current slave equity has breached either the
     * daily loss limit or the total loss limit.
     *
     * @param currentEquity     Current equity of the slave account.
     * @param initialDailyEquity  Equity at the start of today's trading session.
     * @param totalStartEquity  Equity at the start of the challenge (day 1).
     * @param dailyLossLimit    Max monetary loss allowed in a single day.
     * @param totalLossLimit    Max monetary loss allowed over the full challenge.
     * @returns { blocked: boolean; reason?: string }
     */
    private checkEquityGuard(
        currentEquity: number,
        initialDailyEquity: number,
        totalStartEquity: number,
        dailyLossLimitPct: number,
        totalLossLimitPct: number,
    ): { blocked: boolean; reason?: string } {
        if (dailyLossLimitPct > 0 && initialDailyEquity > 0) {
            const dailyDrawdownPct = ((initialDailyEquity - currentEquity) / initialDailyEquity) * 100;
            if (dailyDrawdownPct >= dailyLossLimitPct) {
                return {
                    blocked: true,
                    reason: `Daily loss limit reached: drawdown ${dailyDrawdownPct.toFixed(2)}% >= limit ${dailyLossLimitPct}%`,
                };
            }
        }

        if (totalLossLimitPct > 0 && totalStartEquity > 0) {
            const totalDrawdownPct = ((totalStartEquity - currentEquity) / totalStartEquity) * 100;
            if (totalDrawdownPct >= totalLossLimitPct) {
                return {
                    blocked: true,
                    reason: `Total loss limit reached: drawdown ${totalDrawdownPct.toFixed(2)}% >= limit ${totalLossLimitPct}%`,
                };
            }
        }

        return { blocked: false };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // E. Decoy SL/TP Obfuscation
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns obfuscated SL and TP prices that are slightly farther from the
     * entry price than the Master's original levels.
     *
     * Pip-to-price conversion:
     *   - Most forex pairs (5-digit): 1 pip = 0.00010
     *   - JPY pairs (3-digit):        1 pip = 0.010
     *   - XAUUSD / indices (2-digit): 1 pip = 0.10
     *
     * The offset is randomised in [decoyOffsetPips / 2, decoyOffsetPips] to
     * ensure no two slaves receive the same exact levels.
     *
     * Strict rule: if the Master did not set a SL or TP (value = 0), this
     * method returns 0 — it will never fabricate a level that didn't exist.
     */
    obfuscatePriceLevels(
        side: 'BUY' | 'SELL',
        symbol: string,
        masterSl: number,
        masterTp: number,
        maxOffsetPips: number,
    ): { decoySl: number; decoyTp: number } {
        // Determine pip size based on symbol
        const pipSize = this.getPipSize(symbol);

        // Determine digits for rounding
        const digits = this.getDigits(symbol);

        // Random offset in [maxOffsetPips / 2 … maxOffsetPips]
        const halfMax = maxOffsetPips / 2;
        const offsetPips = halfMax + Math.random() * halfMax;
        const offsetPrice = parseFloat((offsetPips * pipSize).toFixed(digits));

        const round = (val: number) => parseFloat(val.toFixed(digits));

        let decoySl = masterSl;
        let decoyTp = masterTp;

        if (side === 'BUY') {
            // SL is below entry → push it further down
            if (masterSl > 0) decoySl = round(masterSl - offsetPrice);
            // TP is above entry → push it further up
            if (masterTp > 0) decoyTp = round(masterTp + offsetPrice);
        } else {
            // SL is above entry → push it further up
            if (masterSl > 0) decoySl = round(masterSl + offsetPrice);
            // TP is below entry → push it further down
            if (masterTp > 0) decoyTp = round(masterTp - offsetPrice);
        }

        return { decoySl, decoyTp };
    }

    /**
     * Returns the pip size (in price units) for a given symbol.
     * Handles the most common cases: JPY pairs, XAU/indices, and standard forex.
     */
    private getPipSize(symbol: string): number {
        const s = symbol.toUpperCase();
        // Gold (XAUUSD / GOLD) and most indices: 1 pip = 0.10
        if (s.includes('XAU') || s.includes('GOLD') || s.includes('SPX') ||
            s.includes('NAS') || s.includes('GER') || s.includes('US30') ||
            s.includes('OIL') || s.includes('WTI')) {
            return 0.10;
        }
        // JPY pairs: 1 pip = 0.010
        if (s.includes('JPY')) return 0.010;
        // Standard 5-digit forex: 1 pip = 0.00010
        return 0.00010;
    }

    /**
     * Returns the number of decimal places used to round prices for a symbol.
     */
    private getDigits(symbol: string): number {
        const s = symbol.toUpperCase();
        if (s.includes('XAU') || s.includes('GOLD') || s.includes('SPX') ||
            s.includes('NAS') || s.includes('GER') || s.includes('US30') ||
            s.includes('OIL') || s.includes('WTI')) {
            return 2;
        }
        if (s.includes('JPY')) return 3;
        return 5;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    private async saveLog(data: Partial<ShieldLog>): Promise<void> {
        const log = this.logRepo.create(data);
        await this.logRepo.save(log);
    }
}
