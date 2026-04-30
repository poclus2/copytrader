import { Controller, Post, Body } from '@nestjs/common';
import { CopyEngineService } from './copy-engine.service';

@Controller('copy')
export class CopyEngineController {
    constructor(private readonly copyEngineService: CopyEngineService) { }

    @Post('test')
    async testCopy(@Body() body: any) {
        // Simulate a trade from master
        const { masterId, ...trade } = body;
        await this.copyEngineService.executeTrade(masterId, trade);
        return { status: 'Trade dispatched' };
    }
}
