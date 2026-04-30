import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
    constructor(private subscriptionsService: SubscriptionsService) { }

    @Get()
    async getMySubscriptions(@Request() req) {
        return this.subscriptionsService.findByUserId(req.user.id);
    }

    @Get(':id')
    async getSubscription(@Param('id') id: string) {
        return this.subscriptionsService.findOne(id);
    }

    @Post()
    async createSubscription(@Request() req, @Body() body: {
        masterId: string;
        copySettings: any;
    }) {
        return this.subscriptionsService.create(req.user.id, body);
    }

    @Put(':id/pause')
    async pauseSubscription(@Param('id') id: string) {
        return this.subscriptionsService.pause(id);
    }

    @Put(':id/resume')
    async resumeSubscription(@Param('id') id: string) {
        return this.subscriptionsService.resume(id);
    }

    @Delete(':id')
    async cancelSubscription(@Param('id') id: string) {
        return this.subscriptionsService.cancel(id);
    }
}
