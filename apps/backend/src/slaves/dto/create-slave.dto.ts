import { IsString, IsNotEmpty, IsObject, IsUUID, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class CreateSlaveDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    @IsNotEmpty()
    type: 'EXTERNAL' | 'VIRTUAL' = 'EXTERNAL';

    @IsString()
    @IsNotEmpty()
    broker: string;

    @IsObject()
    @IsOptional()
    credentials: any;

    // ── Multi-Master : tableau d'UUIDs ────────────────────────────────
    @IsArray()
    @IsUUID('4', { each: true })
    @IsNotEmpty()
    masterIds: string[]; // Remplace l'ancien masterId singulier
    // ─────────────────────────────────────────────────────────────────

    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsNumber()
    @IsOptional()
    initialBalance?: number;

    @IsObject()
    @IsOptional()
    config?: any;

    @IsBoolean()
    @IsOptional()
    isPropFirm?: boolean;
}
