import {
    Controller, Get, Post, Patch, Body, Param, Delete,
    UseGuards, HttpCode, HttpStatus, Query,
} from '@nestjs/common';
import { PropFirmShieldService } from './prop-firm-shield.service';
import { SymbolMapperService } from '../copy-engine/symbol-mapper.service';
import { PropFirmConfig } from './entities/prop-firm-config.entity';
import { SymbolMapping } from '../copy-engine/entities/symbol-mapping.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('prop-firm-shield')
@UseGuards(JwtAuthGuard)
export class PropFirmShieldController {
    constructor(
        private readonly shieldService: PropFirmShieldService,
        private readonly symbolMapper: SymbolMapperService
    ) {}

    // ── Symbol Mapping Routes ───────────────────────────────────────────

    @Get('symbols/mappings')
    async getMappings() {
        return this.symbolMapper.findAll();
    }

    @Post('symbols/mappings')
    async createMapping(@Body() dto: Partial<SymbolMapping>) {
        return this.symbolMapper.create(dto);
    }

    @Patch('symbols/mappings/:id')
    async updateMapping(@Param('id') id: string, @Body() dto: Partial<SymbolMapping>) {
        return this.symbolMapper.update(id, dto);
    }

    @Delete('symbols/mappings/:id')
    async deleteMapping(@Param('id') id: string) {
        return this.symbolMapper.remove(id);
    }

    @Get('symbols/simulate')
    async simulateMapping(@Query('masterSymbol') masterSymbol: string, @Query('brokerName') brokerName?: string) {
        if (!masterSymbol) return { result: '' };
        const result = this.symbolMapper.getCompatibleSymbol(masterSymbol, brokerName);
        return { result };
    }

    // ── Slave Config Routes ─────────────────────────────────────────────

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

