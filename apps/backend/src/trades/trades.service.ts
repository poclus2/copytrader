import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trade } from './entities/trade.entity';

@Injectable()
export class TradesService {
    constructor(
        @InjectRepository(Trade)
        private tradesRepository: Repository<Trade>,
    ) { }

    async create(tradeData: Partial<Trade>): Promise<Trade> {
        const trade = this.tradesRepository.create(tradeData);
        return this.tradesRepository.save(trade);
    }

    async findByMasterId(masterId: string, page: number = 1, limit: number = 20): Promise<{ data: Trade[], total: number }> {
        const [data, total] = await this.tradesRepository.findAndCount({
            where: { masterId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: (page - 1) * limit,
        });
        return { data, total };
    }

    async findBySlaveId(slaveId: string, page: number = 1, limit: number = 20): Promise<{ data: Trade[], total: number }> {
        const [data, total] = await this.tradesRepository.findAndCount({
            where: { slaveId },
            relations: ['sourceTrade', 'sourceTrade.master'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: (page - 1) * limit,
        });
        return { data, total };
    }

    async findOne(id: string): Promise<Trade | null> {
        return this.tradesRepository.findOne({ where: { id } });
    }

    async findByTicket(masterId: string, ticket: string): Promise<Trade | null> {
        return this.tradesRepository.findOne({ where: { masterId, ticket } });
    }

    async update(id: string, updates: Partial<Trade>): Promise<Trade | null> {
        await this.tradesRepository.update(id, updates);
        return this.findOne(id);
    }

    async findBySourceTradeId(sourceTradeId: string): Promise<Trade[]> {
        return this.tradesRepository.find({
            where: { sourceTradeId },
            relations: ['slave'],
            order: { createdAt: 'DESC' },
        });
    }
}
