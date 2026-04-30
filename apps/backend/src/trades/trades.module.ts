import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from './entities/trade.entity';
import { TradesService } from './trades.service';

@Module({
    imports: [TypeOrmModule.forFeature([Trade])],
    providers: [TradesService],
    exports: [TradesService, TypeOrmModule],
})
export class TradesModule { }
