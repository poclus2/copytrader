import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, OneToMany } from 'typeorm';
import { Slave } from '../../slaves/entities/slave.entity';
import { Trade } from '../../trades/entities/trade.entity';

@Entity('masters')
export class Master {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    broker: string;

    @Column('jsonb')
    credentials: any;

    @Column({
        type: 'enum',
        enum: ['HUMAN', 'BOT'],
        default: 'HUMAN'
    })
    type: 'HUMAN' | 'BOT';

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    avatar: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    monthlyFee: number;

    @Column('jsonb', { nullable: true })
    aiConfig: {
        detailedStrategy?: string;
        processingSteps?: string[];
        internalParameters?: Record<string, string>;
    };

    @Column({ nullable: true })
    strategy: string;

    @Column({ type: 'int', default: 0 })
    riskScore: number;

    @Column({ default: true })
    isActive: boolean;

    @ManyToMany(() => Slave, (slave) => slave.masters)
    slaves: Slave[];

    @OneToMany(() => Trade, (trade) => trade.master)
    trades: Trade[];

    @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
    balance: number;

    @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
    equity: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
