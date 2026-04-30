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
    @UseGuards(JwtAuthGuard)
    async verifyConnection(@Body() dto: VerifyConnectionDto, @Request() req) {
        // Find broker name from server
        const broker = BROKERS.find(b =>
            b.servers.some(s => s.address === dto.server)
        );
        const brokerName = broker?.name || 'Unknown';

        // Verify and save the account
        return this.mt5AccountService.verifyAndSaveAccount(req.user.id, dto, brokerName);
    }

    // Alias route for compatibility with the spec
    @Post('/api/metatrader/test-connection')
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
    @UseGuards(JwtAuthGuard)
    async getUserAccounts(@Request() req) {
        const accounts = await this.mt5AccountService.getUserAccounts(req.user.id);
        return { accounts };
    }

    @Delete('accounts/:id')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    async deleteAccount(@Request() req, @Param('id') accountId: string) {
        await this.mt5AccountService.deleteAccount(req.user.id, accountId);
        return { success: true };
    }
}
