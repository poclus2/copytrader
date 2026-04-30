import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MT5Account, MT5AccountStatus } from './entities/mt5-account.entity';
import { MT5BridgeService } from './mt5-bridge.service';
import { VerifyConnectionDto } from './metatrader-connection.service';

@Injectable()
export class MT5AccountService {
    constructor(
        @InjectRepository(MT5Account)
        private mt5AccountRepository: Repository<MT5Account>,
        private mt5Bridge: MT5BridgeService,
    ) { }

    async verifyAndSaveAccount(userId: string, dto: VerifyConnectionDto, brokerName: string): Promise<any> {
        // Verify the connection using the MT5 Bridge (TCP connection to EA)
        const verifyResult = await this.mt5Bridge.verify(dto);

        if (!verifyResult.success) {
            // Connection failed
            return {
                success: false,
                error: verifyResult.error || 'Failed to connect to MT5 account',
            };
        }

        // Connection successful - save or update the account
        let account = await this.mt5AccountRepository.findOne({
            where: {
                userId,
                login: dto.login,
                server: dto.server,
            },
        });

        if (account) {
            // Update existing account
            account.status = MT5AccountStatus.CONNECTED;
            account.lastConnectedAt = new Date();
            account.errorMessage = null;
            account.balance = verifyResult.balance || account.balance;
            account.currency = verifyResult.currency || account.currency;
            account.accountName = verifyResult.name || account.accountName;
        } else {
            // Create new account
            account = this.mt5AccountRepository.create({
                userId,
                login: dto.login,
                server: dto.server,
                brokerName,
                status: MT5AccountStatus.CONNECTED,
                lastConnectedAt: new Date(),
                balance: verifyResult.balance,
                currency: verifyResult.currency,
                accountName: verifyResult.name,
            });
        }

        await this.mt5AccountRepository.save(account);

        return {
            success: true,
            account: {
                id: account.id,
                login: account.login,
                server: account.server,
                brokerName: account.brokerName,
                status: account.status,
                balance: account.balance,
                currency: account.currency,
            },
        };
    }

    async getUserAccounts(userId: string): Promise<MT5Account[]> {
        return await this.mt5AccountRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async updateAccountStatus(accountId: string, status: MT5AccountStatus, errorMessage?: string): Promise<MT5Account> {
        const account = await this.mt5AccountRepository.findOne({ where: { id: accountId } });
        if (!account) {
            throw new NotFoundException('MT5 account not found');
        }

        account.status = status;
        if (errorMessage) {
            account.errorMessage = errorMessage;
        }

        return await this.mt5AccountRepository.save(account);
    }

    async deleteAccount(userId: string, accountId: string): Promise<void> {
        const account = await this.mt5AccountRepository.findOne({
            where: { id: accountId, userId },
        });

        if (!account) {
            throw new NotFoundException('MT5 account not found');
        }

        await this.mt5AccountRepository.remove(account);
    }
}
