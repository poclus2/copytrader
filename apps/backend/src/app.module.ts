import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MastersModule } from './masters/masters.module';
import { SlavesModule } from './slaves/slaves.module';
import { CopyEngineModule } from './copy-engine/copy-engine.module';
import { AdaptersModule } from './adapters/adapters.module';
import { MetaTraderConnectionModule } from './metatrader-connection/metatrader-connection.module';
import { TradesModule } from './trades/trades.module';
import { UsersModule } from './users/users.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { MastersPublicModule } from './masters-public/masters-public.module';
import { WalletModule } from './wallet/wallet.module';
import { AffiliationModule } from './affiliation/affiliation.module';
import { KycModule } from './kyc/kyc.module';
import { DockerModule } from './docker/docker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgres://user:password@127.0.0.1:5432/copytrading',
      autoLoadEntities: true,
      synchronize: true, // Disable in production
    }),
    AuthModule,
    MastersModule,
    SlavesModule,
    CopyEngineModule,
    AdaptersModule,
    MetaTraderConnectionModule,
    TradesModule,
    UsersModule,
    SubscriptionsModule,
    MastersPublicModule,
    WalletModule,
    AffiliationModule,
    KycModule,
    DockerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
