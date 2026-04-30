import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum MT5AccountStatus {
    CONNECTED = 'CONNECTED',
    DISCONNECTED = 'DISCONNECTED',
    ERROR = 'ERROR',
}

@Entity('mt5_accounts')
export class MT5Account {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column()
    login: string;

    @Column()
    server: string;

    @Column()
    brokerName: string;

    @Column({ type: 'enum', enum: MT5AccountStatus, default: MT5AccountStatus.DISCONNECTED })
    status: MT5AccountStatus;

    @Column({ nullable: true })
    accountName: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    balance: number;

    @Column({ nullable: true })
    currency: string;

    @Column({ type: 'timestamp', nullable: true })
    lastConnectedAt: Date;

    @Column({ nullable: true, type: 'text' })
    errorMessage: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
