import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MastersService } from './masters.service';
import { MastersController } from './masters.controller';
import { Master } from './entities/master.entity';
import { TradesModule } from '../trades/trades.module';
import { DockerModule } from '../docker/docker.module';

@Module({
  imports: [TypeOrmModule.forFeature([Master]), TradesModule, DockerModule],
  controllers: [MastersController],
  providers: [MastersService],
  exports: [MastersService],
})
export class MastersModule { }
