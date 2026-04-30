import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, OneToOne, JoinColumn,
} from 'typeorm';
import { Slave } from '../../slaves/entities/slave.entity';

@Entity('prop_firm_configs')
export class PropFirmConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // OneToOne relation with Slave
    @OneToOne(() => Slave, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'slaveId' })
    slave: Slave;

    @Column({ unique: true })
    slaveId: string;

    /** Master switch — trades only flow through the Shield when true */
    @Column({ default: false })
    isEnabled: boolean;

    /** Minimum random delay in milliseconds before order execution */
    @Column({ type: 'int', default: 1000 })
    minJitter: number;

    /** Maximum random delay in milliseconds before order execution */
    @Column({ type: 'int', default: 5000 })
    maxJitter: number;

    /**
     * Lot size variation applied as ± percentage (e.g. 1.5 means ± 1.5%).
     * Stored as a decimal so that 1.5% is stored as 1.5.
     */
    @Column({ type: 'float', default: 1.5 })
    lotVariation: number;

    /**
     * Maximum allowed daily equity drawdown in account currency.
     * Example: 4500 for a 100k account with a 4.5% daily limit.
     */
    @Column({ type: 'float', default: 0 })
    dailyLossLimit: number;

    /**
     * Maximum allowed total (overall) equity drawdown in account currency.
     */
    @Column({ type: 'float', default: 0 })
    totalLossLimit: number;

    /**
     * Prefix prepended to the MT5 order comment to simulate manual entries.
     * Example: "MNL_" → comment becomes "MNL_4829"
     */
    @Column({ default: 'MNL_' })
    customCommentPrefix: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
