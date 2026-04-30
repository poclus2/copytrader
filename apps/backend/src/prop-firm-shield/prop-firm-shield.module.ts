import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropFirmConfig } from './entities/prop-firm-config.entity';
import { ShieldLog } from './entities/shield-log.entity';
import { PropFirmShieldService } from './prop-firm-shield.service';
import { PropFirmShieldController } from './prop-firm-shield.controller';

@Module({
    imports: [TypeOrmModule.forFeature([PropFirmConfig, ShieldLog])],
    controllers: [PropFirmShieldController],
    providers: [PropFirmShieldService],
    exports: [PropFirmShieldService], // Exported so CopyEngineModule can inject it
})
export class PropFirmShieldModule {}
