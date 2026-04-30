import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL',
    SUBSCRIPTION_FEE = 'SUBSCRIPTION_FEE',
    COMMISSION = 'COMMISSION',
    REFUND = 'REFUND',
    TRADE_PROFIT = 'TRADE_PROFIT',
    TRADE_LOSS = 'TRADE_LOSS',
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
}

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ default: 'USD' })
    currency: string;

    @Column({
        type: 'enum',
        enum: TransactionType,
    })
    type: TransactionType;

    @Column({
        type: 'enum',
        enum: TransactionStatus,
        default: TransactionStatus.PENDING,
    })
    status: TransactionStatus;

    @Column({ nullable: true })
    method: string; // 'stripe', 'crypto', 'mt5', 'binance'

    @Column({ nullable: true })
    externalId: string; // Stripe PaymentIntent ID, TxHash, Ticket MT5

    @Column({ nullable: true })
    accountId: string; // ID du compte de trading concerné (si applicable)

    @Column({ type: 'jsonb', nullable: true })
    metadata: any; // Détails du trade (Symbol, Lots, etc.)

    @CreateDateColumn()
    createdAt: Date;
}
