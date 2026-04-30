import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Master } from '../../masters/entities/master.entity';

@Entity('subscriptions')
export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Master)
    @JoinColumn({ name: 'masterId' })
    master: Master;

    @Column()
    masterId: string;

    @Column({ type: 'varchar', default: 'active' })
    status: 'active' | 'paused' | 'cancelled' | 'expired';

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    monthlyFee: number;

    @Column({ type: 'jsonb' })
    copySettings: {
        mt5AccountId: string;
        mode: 'FIXED_RATIO' | 'BALANCE_RATIO' | 'EQUITY_RATIO' | 'FIXED_LOT';
        ratio?: number;
        fixedLotSize?: number;
        maxDailyLoss?: number;
        maxOpenTrades?: number;
    };

    @Column({ type: 'date' })
    startDate: Date;

    @Column({ type: 'date', nullable: true })
    nextBillingDate: Date;

    @Column({ type: 'date', nullable: true })
    endDate: Date;

    @Column({ nullable: true })
    stripeSubscriptionId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
