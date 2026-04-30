import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Master } from '../../masters/entities/master.entity';
import { Trade } from '../../trades/entities/trade.entity';
import { User } from '../../users/entities/user.entity';

@Entity('slaves')
export class Slave {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    broker: string;

    @Column('jsonb')
    credentials: any;

    @Column({ default: true })
    isActive: boolean;

    @Column('jsonb', { nullable: true })
    config: any;

    @ManyToOne(() => Master, (master) => master.slaves, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'masterId' })
    master: Master;

    @Column()
    masterId: string;

    @Column({
        type: 'enum',
        enum: ['EXTERNAL', 'VIRTUAL'],
        default: 'EXTERNAL'
    })
    type: 'EXTERNAL' | 'VIRTUAL';

    @ManyToOne(() => User, (user) => user.slaves, { nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ nullable: true })
    userId: string;

    @OneToMany(() => Trade, (trade) => trade.slave)
    trades: Trade[];

    @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
    balance: number; // For EXTERNAL mode sync

    @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
    equity: number; // For EXTERNAL mode sync

    @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
    virtualBalance: number; // For VIRTUAL mode internal ledger

    @Column({ default: false })
    isFundingLocked: boolean;

    @Column({
        type: 'enum',
        enum: ['PENDING', 'ACTIVE', 'PAUSED', 'STOPPED'],
        default: 'PENDING'
    })
    status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'STOPPED';

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
