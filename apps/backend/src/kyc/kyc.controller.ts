import {
    Controller,
    Post,
    Get,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFile,
    Body,
    Param,
    Put,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KycService } from './kyc.service';
import { KycDocumentType, KycStatus } from './entities/kyc-document.entity';

@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
    constructor(private readonly kycService: KycService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadDocument(
        @Request() req,
        @UploadedFile() file: any,
        @Body('type') type: KycDocumentType,
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        if (!Object.values(KycDocumentType).includes(type)) {
            throw new BadRequestException('Invalid document type');
        }

        return await this.kycService.submitDocument(req.user.id, file, type);
    }

    @Get('status')
    async getStatus(@Request() req) {
        return await this.kycService.getStatus(req.user.id);
    }

    @Get('documents')
    async getDocuments(@Request() req) {
        return await this.kycService.getDocuments(req.user.id);
    }

    // Admin endpoint
    @Put('review/:id')
    async reviewDocument(
        @Param('id') id: string,
        @Body() body: { status: KycStatus; rejectionReason?: string },
    ) {
        return await this.kycService.reviewDocument(
            id,
            body.status,
            body.rejectionReason,
        );
    }
}
