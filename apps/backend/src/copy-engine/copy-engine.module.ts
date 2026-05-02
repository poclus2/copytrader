import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CopyEngineService } from './copy-engine.service';
import { CopyEngineController } from './copy-engine.controller';
import { SlavesModule } from '../slaves/slaves.module';
import { AdaptersModule } from '../adapters/adapters.module';
import { MastersModule } from '../masters/masters.module';
import { MetaTraderConnectionModule } from '../metatrader-connection/metatrader-connection.module';
import { TradesModule } from '../trades/trades.module';
import { PropFirmShieldModule } from '../prop-firm-shield/prop-firm-shield.module';
import { SymbolMapperService } from './symbol-mapper.service';
import { SymbolMapping } from './entities/symbol-mapping.entity';

@Global()
@Module({
  imports: [
      TypeOrmModule.forFeature([SymbolMapping]),
      SlavesModule, 
      AdaptersModule, 
      MastersModule, 
      MetaTraderConnectionModule, 
      TradesModule, 
      PropFirmShieldModule
  ],
  controllers: [CopyEngineController],
  providers: [CopyEngineService, SymbolMapperService],
  exports: [CopyEngineService, SymbolMapperService],
})
export class CopyEngineModule { }
