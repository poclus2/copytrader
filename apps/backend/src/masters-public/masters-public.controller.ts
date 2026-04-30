import { Controller, Get, Param, Query } from '@nestjs/common';
import { MastersService } from '../masters/masters.service';
import { TradesService } from '../trades/trades.service';

@Controller('public/masters')
export class MastersPublicController {
    constructor(
        private mastersService: MastersService,
        private tradesService: TradesService,
    ) { }

    @Get()
    async getAvailableMasters(@Query() query: {
        search?: string;
        minPerformance?: number;
        maxDrawdown?: number;
        sortBy?: 'performance' | 'subscribers';
    }) {
        const masters = await this.mastersService.findAll();

        // Filter and transform for public display
        return masters
            .filter(m => m.isActive)
            .map(m => ({
                id: m.id,
                name: m.name,
                description: 'Expert trader with proven track record',
                avatar: null,
                stats: {
                    roi30d: 15.5, // TODO: Calculate from trades
                    totalReturn: 45.2,
                    drawdown: 8.3,
                    subscribers: 0, // TODO: Count from subscriptions
                    winRate: 68.5,
                },
                monthlyFee: 50,
                riskLevel: 'medium',
            }));
    }

    @Get(':id')
    async getMasterDetails(@Param('id') id: string) {
        const master = await this.mastersService.findOne(id);

        if (!master) {
            throw new Error('Master not found');
        }

        return {
            id: master.id,
            name: master.name,
            description: 'Expert trader with proven track record',
            stats: {
                roi30d: 15.5,
                totalReturn: 45.2,
                drawdown: 8.3,
                subscribers: 0,
                totalTrades: 0,
                winRate: 68.5,
                avgWin: 120.5,
                avgLoss: 65.3,
            },
            monthlyFee: 50,
            riskLevel: 'medium',
        };
    }

    @Get(':id/performance')
    async getMasterPerformance(@Param('id') id: string) {
        // TODO: Calculate real performance from trades
        const monthlyData: Array<{ month: string; return: number }> = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            monthlyData.push({
                month: date.toISOString().substring(0, 7),
                return: Math.random() * 20 - 5, // Random for now
            });
        }

        return {
            monthlyReturns: monthlyData,
            totalProfit: 2500,
        };
    }

    @Get(':id/trades')
    async getMasterTrades(
        @Param('id') id: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        return this.tradesService.findByMasterId(id, page, limit);
    }
}
