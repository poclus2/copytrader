import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycDocument, KycDocumentType, KycStatus } from './entities/kyc-document.entity';
import { User } from '../users/entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class KycService {
    private readonly uploadDir = path.join(process.cwd(), 'uploads', 'kyc');

    constructor(
        @InjectRepository(KycDocument)
        private kycRepository: Repository<KycDocument>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {
        // Ensure upload directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async submitDocument(
        userId: string,
        file: any,
        type: KycDocumentType,
    ): Promise<KycDocument> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        const fileName = `${userId}_${type}_${Date.now()}${fileExtension}`;
        const filePath = path.join(this.uploadDir, fileName);

        // Save file
        fs.writeFileSync(filePath, file.buffer);

        // Create document record
        const document = this.kycRepository.create({
            user,
            userId,
            type,
            fileUrl: `/uploads/kyc/${fileName}`,
            status: KycStatus.PENDING,
        });

        return await this.kycRepository.save(document);
    }

    async getDocuments(userId: string): Promise<KycDocument[]> {
        return await this.kycRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async getStatus(userId: string) {
        const documents = await this.getDocuments(userId);

        const statusByType: Record<KycDocumentType, KycDocument | null> = {
            [KycDocumentType.ID_CARD]: null,
            [KycDocumentType.PASSPORT]: null,
            [KycDocumentType.PROOF_OF_ADDRESS]: null,
        };

        documents.forEach(doc => {
            const current = statusByType[doc.type];
            if (!current || doc.createdAt > current.createdAt) {
                statusByType[doc.type] = doc;
            }
        });

        const allApproved = Object.values(statusByType).every(
            doc => doc !== null && doc.status === KycStatus.APPROVED
        );

        return {
            documents: statusByType,
            overallStatus: allApproved ? 'VERIFIED' : 'PENDING',
            level: allApproved ? 2 : 1,
        };
    }

    async reviewDocument(
        id: string,
        status: KycStatus,
        rejectionReason?: string,
    ): Promise<KycDocument> {
        const document = await this.kycRepository.findOne({ where: { id } });
        if (!document) throw new NotFoundException('Document not found');

        document.status = status;
        if (rejectionReason) {
            document.rejectionReason = rejectionReason;
        }

        return await this.kycRepository.save(document);
    }
}
