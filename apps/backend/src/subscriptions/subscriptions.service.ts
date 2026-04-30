import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';

@Injectable()
export class SubscriptionsService {
    constructor(
        @InjectRepository(Subscription)
        private subscriptionsRepository: Repository<Subscription>,
    ) { }

    async create(userId: string, data: {
        masterId: string;
        copySettings: any;
    }): Promise<Subscription> {
        const subscription = this.subscriptionsRepository.create({
            userId,
            masterId: data.masterId,
            copySettings: data.copySettings,
            status: 'active',
            monthlyFee: 50, // TODO: Get from master
            startDate: new Date(),
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        return this.subscriptionsRepository.save(subscription);
    }

    async findByUserId(userId: string): Promise<Subscription[]> {
        return this.subscriptionsRepository.find({
            where: { userId },
            relations: ['master'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Subscription | null> {
        return this.subscriptionsRepository.findOne({
            where: { id },
            relations: ['master', 'user'],
        });
    }

    async updateStatus(id: string, status: 'active' | 'paused' | 'cancelled' | 'expired'): Promise<Subscription | null> {
        await this.subscriptionsRepository.update(id, { status });
        return this.findOne(id);
    }

    async cancel(id: string): Promise<Subscription | null> {
        await this.subscriptionsRepository.update(id, {
            status: 'cancelled',
            endDate: new Date(),
        });
        return this.findOne(id);
    }

    async pause(id: string): Promise<Subscription | null> {
        await this.subscriptionsRepository.update(id, { status: 'paused' });
        return this.findOne(id);
    }

    async resume(id: string): Promise<Subscription | null> {
        await this.subscriptionsRepository.update(id, { status: 'active' });
        return this.findOne(id);
    }

    async findByMasterId(masterId: string): Promise<Subscription[]> {
        return this.subscriptionsRepository.find({
            where: { masterId, status: 'active' },
        });
    }
}
