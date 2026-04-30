import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral } from './entities/referral.entity';
import { User } from '../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AffiliationService {
    constructor(
        @InjectRepository(Referral)
        private referralRepository: Repository<Referral>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async generateReferralCode(userId: string): Promise<Referral> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const existingReferral = await this.referralRepository.findOne({ where: { ownerId: userId } });
        if (existingReferral) return existingReferral;

        // Generate a simple 8-char code
        const code = 'REF-' + uuidv4().substring(0, 8).toUpperCase();

        const referral = this.referralRepository.create({
            code,
            owner: user,
            ownerId: userId,
        });

        const savedReferral = await this.referralRepository.save(referral);

        // Update user with their own referral code
        user.referralCode = code;
        await this.userRepository.save(user);

        return savedReferral;
    }

    async getStats(userId: string) {
        const referral = await this.referralRepository.findOne({ where: { ownerId: userId } });
        if (!referral) {
            return {
                code: null,
                usageCount: 0,
                totalEarnings: 0,
                recentReferrals: []
            };
        }

        const recentReferrals = await this.userRepository.find({
            where: { referredById: userId },
            order: { createdAt: 'DESC' },
            take: 10,
            select: ['id', 'firstName', 'lastName', 'createdAt']
        });

        return {
            code: referral.code,
            usageCount: referral.usageCount,
            totalEarnings: referral.totalEarnings,
            recentReferrals
        };
    }

    async trackReferral(code: string, newUserId: string): Promise<void> {
        const referral = await this.referralRepository.findOne({ where: { code }, relations: ['owner'] });
        if (!referral) throw new BadRequestException('Invalid referral code');

        const newUser = await this.userRepository.findOne({ where: { id: newUserId } });
        if (!newUser) throw new NotFoundException('User not found');

        if (newUser.referredById) return; // Already referred

        newUser.referredBy = referral.owner;
        newUser.referredById = referral.owner.id;
        await this.userRepository.save(newUser);

        referral.usageCount += 1;
        await this.referralRepository.save(referral);
    }
}
