import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
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

    // ── Multi-Master Relationship ─────────────────────────────────────
    // Un slave peut copier plusieurs Masters simultanément.
    // La table de jonction est 'slave_masters'.
    @ManyToMany(() => Master, (master) => master.slaves, { eager: true, onDelete: 'CASCADE' })
    @JoinTable({
        name: 'slave_masters',
        joinColumn: { name: 'slaveId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'masterId', referencedColumnName: 'id' }
    })
    masters: Master[];
    // ─────────────────────────────────────────────────────────────────

    @Column({
        type: 'enum',
        enum: ['EXTERNAL', 'VIRTUAL'],
        default: 'EXTERNAL'
    })
    type: 'EXTERNAL' | 'VIRTUAL';

    @ManyToMany(() => Master)
    @JoinTable()
    mastersList: Master[];

    @OneToMany(() => Trade, (trade) => trade.slave)
    trades: Trade[];

    @Column({ nullable: true })
    userId: string;

    @ManyToOne(() => User, user => user.slaves)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
    balance: number;

    @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
    equity: number;

    @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
    virtualBalance: number;

    @Column({ default: false })
    isFundingLocked: boolean;

    @Column({ default: false })
    isPropFirm: boolean;

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
