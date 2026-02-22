import { Controller, Get, Post, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateCheckoutDto } from './dto/subscription.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) { }

    @Get('current')
    @UseGuards(FirebaseAuthGuard)
    async getCurrentSubscription(@Query('businessId') businessId: string) {
        return this.subscriptionsService.getCurrentSubscription(businessId);
    }

    @Post('checkout')
    @UseGuards(FirebaseAuthGuard)
    async createCheckoutSession(@Body() dto: CreateCheckoutDto) {
        return this.subscriptionsService.createCheckoutSession(dto);
    }

    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(@Body() body: any) {
        // This is a public endpoint called by MercadoPago servers
        // MercadoPago expects a 200 OK immediately
        return this.subscriptionsService.handleWebhook(body);
    }
}
