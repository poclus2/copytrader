import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SymbolMapping } from './entities/symbol-mapping.entity';

@Injectable()
export class SymbolMapperService implements OnModuleInit {
    private readonly logger = new Logger(SymbolMapperService.name);
    // Cache: key is `${masterSymbol}_${brokerName || 'default'}`.toUpperCase()
    private mappingCache = new Map<string, string>();

    constructor(
        @InjectRepository(SymbolMapping)
        private symbolMappingRepo: Repository<SymbolMapping>,
    ) {}

    async onModuleInit() {
        await this.refreshCache();
    }

    async refreshCache() {
        const mappings = await this.symbolMappingRepo.find({ where: { isActive: true } });
        this.mappingCache.clear();
        for (const mapping of mappings) {
            const key = this.getCacheKey(mapping.masterSymbol, mapping.brokerName);
            this.mappingCache.set(key, mapping.slaveSymbol.toUpperCase());
        }
        this.logger.log(`Loaded ${this.mappingCache.size} symbol mappings into cache.`);
    }

    private getCacheKey(symbol: string, brokerName?: string): string {
        return `${symbol}_${brokerName || 'default'}`.toUpperCase();
    }

    /**
     * Get the compatible symbol for the slave broker.
     */
    getCompatibleSymbol(masterSymbol: string, brokerName?: string): string {
        if (!masterSymbol) return '';

        // 1. Try exact match in DB (cached)
        const specificKey = this.getCacheKey(masterSymbol, brokerName);
        if (this.mappingCache.has(specificKey)) {
            return this.mappingCache.get(specificKey)!;
        }

        const defaultKey = this.getCacheKey(masterSymbol);
        if (this.mappingCache.has(defaultKey)) {
            return this.mappingCache.get(defaultKey)!;
        }

        // 2. Auto-Clean
        const cleanedSymbol = this.autoClean(masterSymbol);

        // 3. Hardcoded Fallback
        return this.applyFallback(cleanedSymbol);
    }

    private autoClean(symbol: string): string {
        let clean = symbol.toUpperCase();
        // Remove known suffixes
        const suffixes = ['+', '.PRO', '.RAW', '.ECN', '.M', '_SB'];
        for (const suffix of suffixes) {
            if (clean.endsWith(suffix)) {
                clean = clean.slice(0, -suffix.length);
                break; // Only remove one suffix
            }
        }
        return clean;
    }

    private applyFallback(symbol: string): string {
        // Handle common variations and indices
        const fallbacks: Record<string, string> = {
            'GOLD': 'XAUUSD',
            'XAU': 'XAUUSD',
            'SILVER': 'XAGUSD',
            'XAG': 'XAGUSD',
            'BTC': 'BTCUSD',
            'US30': 'US30', // Just examples, you can add more or rely on DB
            'DJI': 'US30',
            'WS30': 'US30',
            'CASH_IND_US30': 'US30',
            'UK100': 'UK100',
            'FTSE': 'UK100',
            'GER30': 'DE30',
            'GER40': 'DE40',
            'DAX': 'DE40',
        };

        return fallbacks[symbol] || symbol;
    }

    // CRUD Methods for Admin
    async findAll() {
        return this.symbolMappingRepo.find();
    }

    async create(data: Partial<SymbolMapping>) {
        const mapping = this.symbolMappingRepo.create(data);
        const saved = await this.symbolMappingRepo.save(mapping);
        await this.refreshCache();
        return saved;
    }

    async update(id: string, data: Partial<SymbolMapping>) {
        await this.symbolMappingRepo.update(id, data);
        await this.refreshCache();
        return this.findOne(id);
    }

    async remove(id: string) {
        await this.symbolMappingRepo.delete(id);
        await this.refreshCache();
    }

    async findOne(id: string) {
        return this.symbolMappingRepo.findOneBy({ id });
    }
}
