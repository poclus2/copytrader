import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

/**
 * ShieldLog — Monitoring table for every trade intercepted by PropFirmShield.
 * Saved asynchronously (fire-and-forget) to avoid impacting polling performance.
 */
@Entity('shield_logs')
@Index(['slaveId', 'createdAt'])      // For fast dashboard queries per slave
@Index(['masterTradeId'])              // For linking back to the source trade
export class ShieldLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    slaveId: string;

    @Column({ nullable: true })
    masterTradeId: string;

    @Column()
    symbol: string;

    @Column()
    side: string; // 'BUY' | 'SELL'

    /** Original volume calculated by the CopyEngine before shielding */
    @Column({ type: 'float' })
    originalVolume: number;

    /** Shielded volume after ± lot variation has been applied */
    @Column({ type: 'float' })
    shieldedVolume: number;

    /** Actual jitter delay applied in milliseconds */
    @Column({ type: 'int' })
    jitterMs: number;

    /** Magic number injected into the MT5 order */
    @Column({ type: 'bigint' })
    magicNumber: number;

    /** Comment injected into the MT5 order (e.g. "MNL_4829") */
    @Column()
    comment: string;

    /**
     * Action type: 'OPEN' or 'CLOSE'.
     * Lets the dashboard distinguish open vs close shielded events.
     */
    @Column({ default: 'OPEN' })
    action: string;

    /**
     * Whether the order was blocked by the equity guard instead of being sent.
     */
    @Column({ default: false })
    blockedByEquityGuard: boolean;

    @Column({ nullable: true })
    blockReason: string;

    @CreateDateColumn()
    createdAt: Date;
}
