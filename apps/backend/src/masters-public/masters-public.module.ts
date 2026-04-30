import { Module } from '@nestjs/common';
import { MastersPublicController } from './masters-public.controller';
import { MastersModule } from '../masters/masters.module';
import { TradesModule } from '../trades/trades.module';

@Module({
    imports: [MastersModule, TradesModule],
    controllers: [MastersPublicController],
})
export class MastersPublicModule { }
