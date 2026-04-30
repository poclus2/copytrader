import { Injectable, BadRequestException } from '@nestjs/common';
import { MT4ConnectionAdapter } from './mt4-adapter.service';
import { MT5ConnectionAdapter } from './mt5-adapter.service';
import { MT5BridgeService } from './mt5-bridge.service';

export interface VerifyConnectionDto {
    platform: 'mt4' | 'mt5';
    login: string;
    password?: string;
    server?: string;
    host?: string;
    port?: number;
    bridgeIp?: string;
    bridgePort?: number;
    connectionMode?: 'real' | 'demo';
}

@Injectable()
export class MetaTraderConnectionService {
    constructor(
        private readonly mt4Adapter: MT4ConnectionAdapter,
        private readonly mt5Adapter: MT5ConnectionAdapter,
        private readonly mt5Bridge: MT5BridgeService,
    ) { }

    async verifyConnection(dto: VerifyConnectionDto) {
        if (dto.platform === 'mt5') {
            if (!dto.login) {
                throw new BadRequestException('Login is required for MT5');
            }
            // Use the new Bridge Service instead of Python
            return this.mt5Bridge.verify(dto);
        } else if (dto.platform === 'mt4') {
            if (!dto.host || !dto.port) {
                throw new BadRequestException('Host and port are required for MT4');
            }
            return this.mt4Adapter.verify(dto);
        } else {
            throw new BadRequestException('Invalid platform');
        }
    }
}
