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

        const payload: ShieldedTradePayload = {
            volume: shieldedVolume,
            jitterMs,
            magicNumber,
            comment,
            blockedByEquityGuard: blocked,
            blockReason: reason,
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
        dailyLossLimit: number,
        totalLossLimit: number,
    ): { blocked: boolean; reason?: string } {
        if (dailyLossLimit > 0) {
            const dailyDrawdown = initialDailyEquity - currentEquity;
            if (dailyDrawdown >= dailyLossLimit) {
                return {
                    blocked: true,
                    reason: `Daily loss limit reached: drawdown ${dailyDrawdown.toFixed(2)} >= limit ${dailyLossLimit}`,
                };
            }
        }

        if (totalLossLimit > 0) {
            const totalDrawdown = totalStartEquity - currentEquity;
            if (totalDrawdown >= totalLossLimit) {
                return {
                    blocked: true,
                    reason: `Total loss limit reached: drawdown ${totalDrawdown.toFixed(2)} >= limit ${totalLossLimit}`,
                };
            }
        }

        return { blocked: false };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    private async saveLog(data: Partial<ShieldLog>): Promise<void> {
        const log = this.logRepo.create(data);
        await this.logRepo.save(log);
    }
}
