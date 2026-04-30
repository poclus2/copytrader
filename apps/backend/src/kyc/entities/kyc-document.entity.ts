import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum KycDocumentType {
    ID_CARD = 'ID_CARD',
    PASSPORT = 'PASSPORT',
    PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
}

export enum KycStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

@Entity('kyc_documents')
export class KycDocument {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column({
        type: 'enum',
        enum: KycDocumentType,
    })
    type: KycDocumentType;

    @Column({
        type: 'enum',
        enum: KycStatus,
        default: KycStatus.PENDING,
    })
    status: KycStatus;

    @Column()
    fileUrl: string;

    @Column({ nullable: true })
    rejectionReason: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
