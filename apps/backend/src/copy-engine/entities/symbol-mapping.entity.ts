import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('symbol_mappings')
export class SymbolMapping {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    masterSymbol: string;

    @Column()
    slaveSymbol: string;

    @Column({ nullable: true })
    brokerName?: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
