import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliationService } from './affiliation.service';
import { AffiliationController } from './affiliation.controller';
import { Referral } from './entities/referral.entity';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Referral, User])],
    controllers: [AffiliationController],
    providers: [AffiliationService],
    exports: [AffiliationService],
})
export class AffiliationModule { }
