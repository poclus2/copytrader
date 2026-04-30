import {
    Controller, Get, Post, Patch, Body, Param,
    UseGuards, HttpCode, HttpStatus, Query,
} from '@nestjs/common';
import { PropFirmShieldService } from './prop-firm-shield.service';
import { PropFirmConfig } from './entities/prop-firm-config.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('prop-firm-shield')
@UseGuards(JwtAuthGuard)
export class PropFirmShieldController {
    constructor(private readonly shieldService: PropFirmShieldService) {}

    /** GET /prop-firm-shield/:slaveId — Get config for a slave */
    @Get(':slaveId')
    async getConfig(@Param('slaveId') slaveId: string) {
        const config = await this.shieldService.getConfig(slaveId);
        return config ?? { slaveId, isEnabled: false };
    }

    /** POST /prop-firm-shield/:slaveId — Create or update config */
    @Post(':slaveId')
    @HttpCode(HttpStatus.OK)
    async upsertConfig(
        @Param('slaveId') slaveId: string,
        @Body() dto: Partial<PropFirmConfig>,
    ) {
        return this.shieldService.upsertConfig(slaveId, dto);
    }

    /** PATCH /prop-firm-shield/:slaveId/toggle — Enable or disable the shield */
    @Patch(':slaveId/toggle')
    @HttpCode(HttpStatus.OK)
    async toggleShield(
        @Param('slaveId') slaveId: string,
        @Body('enabled') enabled: boolean,
    ) {
        return this.shieldService.toggleShield(slaveId, enabled);
    }

    /** GET /prop-firm-shield/:slaveId/logs — Monitoring logs */
    @Get(':slaveId/logs')
    async getLogs(
        @Param('slaveId') slaveId: string,
        @Query('limit') limit?: string,
    ) {
        return this.shieldService.getLogs(slaveId, limit ? parseInt(limit) : 50);
    }

    /** GET /prop-firm-shield/:slaveId/stats — Aggregated monitoring stats */
    @Get(':slaveId/stats')
    async getStats(@Param('slaveId') slaveId: string) {
        return this.shieldService.getStats(slaveId);
    }
}
