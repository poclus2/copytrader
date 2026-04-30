import { PartialType } from '@nestjs/mapped-types';
import { CreateSlaveDto } from './create-slave.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateSlaveDto extends PartialType(CreateSlaveDto) {
    @IsOptional()
    @IsNumber()
    balance?: number;

    @IsOptional()
    @IsNumber()
    equity?: number;
}
