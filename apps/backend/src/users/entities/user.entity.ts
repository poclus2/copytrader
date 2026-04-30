import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Slave } from '../../slaves/entities/slave.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    passwordHash: string;

    @Column({ default: 'client' })
    role: 'admin' | 'master_trader' | 'client';

    @Column({ nullable: true })
    firstName: string;

    @Column({ nullable: true })
    lastName: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ type: 'jsonb', nullable: true })
    kycData: {
        level: number;
        status: 'pending' | 'verified' | 'rejected';
        documents: string[];
    };

    @Column({ type: 'jsonb', nullable: true })
    mt5Accounts: Array<{
        id: string;
        platform: 'mt4' | 'mt5';
        login: string;
        server: string;
        balance: number;
        equity: number;
    }>;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    walletBalance: number;

    @Column({ nullable: true, unique: true })
    referralCode: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'referredById' })
    referredBy: User;

    @Column({ nullable: true })
    referredById: string;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => Slave, (slave) => slave.user)
    slaves: Slave[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
