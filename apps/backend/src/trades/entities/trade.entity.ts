import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Master } from '../../masters/entities/master.entity';
import { Slave } from '../../slaves/entities/slave.entity';

@Entity('trades')
export class Trade {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Trade details from MT5
    @Column({ nullable: true })
    ticket: string; // MT5 deal ticket number

    @Column()
    symbol: string;

    @Column()
    type: string; // 'BUY' or 'SELL'

    @Column('decimal', { precision: 10, scale: 2 })
    volume: number; // Lot size

    @Column('decimal', { precision: 10, scale: 5, nullable: true })
    openPrice: number;

    @Column('decimal', { precision: 10, scale: 5, nullable: true })
    closePrice: number;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    profit: number;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    commission: number;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    swap: number;

    @Column({ default: 'OPEN' }) // 'OPEN', 'CLOSED'
    status: string;

    @Column({ type: 'timestamp', nullable: true })
    openTime: Date;

    @Column({ type: 'timestamp', nullable: true })
    closeTime: Date;

    // Account references
    @ManyToOne(() => Master, (master) => master.trades, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'masterId' })
    master?: Master;

    @Column({ nullable: true })
    masterId?: string;

    @ManyToOne(() => Slave, (slave) => slave.trades, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'slaveId' })
    slave?: Slave;

    @Column({ nullable: true })
    slaveId?: string;

    // For slave trades: reference to the master trade that triggered this
    @ManyToOne(() => Trade, { nullable: true })
    @JoinColumn({ name: 'sourceTradeId' })
    sourceTrade?: Trade;

    @Column({ nullable: true })
    sourceTradeId?: string;

    @Column({ nullable: true })
    errorMessage?: string;

    @CreateDateColumn()
    createdAt: Date;
}
