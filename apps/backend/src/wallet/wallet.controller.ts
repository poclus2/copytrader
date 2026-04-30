import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Get('balance')
    getBalance(@Request() req) {
        return this.walletService.getBalance(req.user.id);
    }

    @Get('transactions')
    getTransactions(@Request() req) {
        return this.walletService.getTransactions(req.user.id);
    }

    @Post('deposit')
    deposit(@Request() req, @Body() body: { amount: number; method: string }) {
        return this.walletService.deposit(req.user.id, body.amount, body.method);
    }

    @Post('withdraw')
    withdraw(@Request() req, @Body() body: { amount: number; method: string; details: any }) {
        return this.walletService.withdraw(req.user.id, body.amount, body.method, body.details);
    }
}
