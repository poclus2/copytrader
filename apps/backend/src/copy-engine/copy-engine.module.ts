import { Module } from '@nestjs/common';
import { CopyEngineService } from './copy-engine.service';
import { CopyEngineController } from './copy-engine.controller';
import { SlavesModule } from '../slaves/slaves.module';
import { AdaptersModule } from '../adapters/adapters.module';
import { MastersModule } from '../masters/masters.module';
import { MetaTraderConnectionModule } from '../metatrader-connection/metatrader-connection.module';
import { TradesModule } from '../trades/trades.module';
import { PropFirmShieldModule } from '../prop-firm-shield/prop-firm-shield.module';

@Module({
  imports: [SlavesModule, AdaptersModule, MastersModule, MetaTraderConnectionModule, TradesModule, PropFirmShieldModule],
  controllers: [CopyEngineController],
  providers: [CopyEngineService],
  exports: [CopyEngineService],
})
export class CopyEngineModule { }
