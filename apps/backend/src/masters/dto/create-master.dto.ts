import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateMasterDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    broker: string;

    @IsNotEmpty()
    credentials: any;

    @IsEnum(['HUMAN', 'BOT'])
    @IsOptional()
    type?: 'HUMAN' | 'BOT';

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    avatar?: string;

    @IsNumber()
    @IsOptional()
    monthlyFee?: number;

    @IsOptional()
    aiConfig?: {
        detailedStrategy?: string;
        processingSteps?: string[];
        internalParameters?: Record<string, string>;
    };

    @IsString()
    @IsOptional()
    strategy?: string;

    @IsNumber()
    @Min(1)
    @Max(10)
    @IsOptional()
    riskScore?: number;
}
