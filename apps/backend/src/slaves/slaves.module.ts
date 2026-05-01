import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlavesService } from './slaves.service';
import { SlavesController } from './slaves.controller';
import { Slave } from './entities/slave.entity';
import { TradesModule } from '../trades/trades.module';
import { WalletModule } from '../wallet/wallet.module';
import { UsersModule } from '../users/users.module';
import { DockerModule } from '../docker/docker.module';
import { MastersModule } from '../masters/masters.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Slave]),
    TradesModule,
    UsersModule,
    WalletModule,
    DockerModule,
    forwardRef(() => MastersModule), // forwardRef pour éviter la dépendance circulaire Masters ↔ Slaves
  ],
  controllers: [SlavesController],
  providers: [SlavesService],
  exports: [SlavesService],
})
export class SlavesModule { }
