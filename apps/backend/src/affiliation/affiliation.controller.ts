import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AffiliationService } from './affiliation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('affiliation')
@UseGuards(JwtAuthGuard)
export class AffiliationController {
    constructor(private readonly affiliationService: AffiliationService) { }

    @Post('generate-code')
    generateCode(@Request() req) {
        return this.affiliationService.generateReferralCode(req.user.id);
    }

    @Get('stats')
    getStats(@Request() req) {
        return this.affiliationService.getStats(req.user.id);
    }
}
