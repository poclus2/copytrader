import { IsString, IsNotEmpty, IsObject, IsUUID, IsOptional, IsNumber, IsBoolean } from 'class-validator';

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
    @IsOptional() // Credentials optional for Virtual or initial setup
    credentials: any;

    @IsUUID()
    @IsNotEmpty()
    masterId: string;

    @IsUUID()
    @IsNotEmpty()
    userId: string; // The owner of this slave account

    @IsNumber()
    @IsOptional()
    initialBalance?: number; // Amount to allocate for VIRTUAL mode

    @IsObject()
    @IsOptional()
    config?: any;

    @IsBoolean()
    @IsOptional()
    isPropFirm?: boolean; // Whether this account is a Prop Firm account (enables shield)
}
