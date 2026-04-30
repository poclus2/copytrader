import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetaTraderConnectionService } from './metatrader-connection.service';
import { MetaTraderConnectionController } from './metatrader-connection.controller';
import { MT4ConnectionAdapter } from './mt4-adapter.service';
import { MT5ConnectionAdapter } from './mt5-adapter.service';
import { MT5BridgeService } from './mt5-bridge.service';
import { MT5AccountService } from './mt5-account.service';
import { MT5Account } from './entities/mt5-account.entity';

@Module({
    imports: [TypeOrmModule.forFeature([MT5Account])],
    providers: [
        MetaTraderConnectionService,
        MT4ConnectionAdapter,
        MT5ConnectionAdapter,
        MT5BridgeService,
        MT5AccountService,
    ],
    controllers: [MetaTraderConnectionController],
    exports: [MetaTraderConnectionService, MT5BridgeService, MT5AccountService],
})
export class MetaTraderConnectionModule { }
