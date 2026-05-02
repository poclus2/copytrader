import { Controller, Post, Body, HttpCode, HttpStatus, Get, Request, UseGuards, Delete, Param } from '@nestjs/common';
import { MetaTraderConnectionService } from './metatrader-connection.service';
import { MT5AccountService } from './mt5-account.service';
import type { VerifyConnectionDto } from './metatrader-connection.service';
import { BROKERS } from './brokers.config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('brokers/metatrader')
export class MetaTraderConnectionController {
    constructor(
        private readonly connectionService: MetaTraderConnectionService,
        private readonly mt5AccountService: MT5AccountService,
    ) { }

    @Post('verify-connection')
    @HttpCode(HttpStatus.OK)
    async verifyConnection(@Body() dto: VerifyConnectionDto, @Request() req) {
        // Find broker name from server
        const broker = BROKERS.find(b =>
            b.servers.some(s => s.address === dto.server)
        );
        const brokerName = broker?.name || 'Unknown';

        // Use a valid UUID fallback if not authenticated to prevent Postgres 22P02 error
        const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

        // Verify and save the account
        return this.mt5AccountService.verifyAndSaveAccount(userId, dto, brokerName);
    }

    // Route specifically for testing connection without saving to DB
    @Post('test-connection')
    @HttpCode(HttpStatus.OK)
    async testConnection(@Body() dto: VerifyConnectionDto) {
        return this.connectionService.verifyConnection(dto);
    }

    @Get('list')
    @HttpCode(HttpStatus.OK)
    async getBrokersList() {
        return { brokers: BROKERS };
    }

    @Get('accounts')
    @HttpCode(HttpStatus.OK)
    async getUserAccounts(@Request() req) {
        const userId = req.user?.id || 'admin-dev-id';
        const accounts = await this.mt5AccountService.getUserAccounts(userId);
        return { accounts };
    }

    @Delete('accounts/:id')
    @HttpCode(HttpStatus.OK)
    async deleteAccount(@Request() req, @Param('id') accountId: string) {
        const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
        await this.mt5AccountService.deleteAccount(userId, accountId);
        return { success: true };
    }
}
