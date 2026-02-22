import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('billing')
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    @UseGuards(FirebaseAuthGuard)
    @Post(':businessId/subscribe')
    async createSubscription(
        @Param('businessId') businessId: string,
        @Body('plan') plan: 'STARTER' | 'PRO' | 'BUSINESS',
    ) {
        return this.billingService.generateSubscriptionCheckout(businessId, plan);
    }

    // --- UNPROTECTED B2B SAAS WEBHOOK (MERCADOPAGO) --- //
    @Post('webhook')
    async handleWebhook(@Body() payload: any) {
        return this.billingService.handleSubscriptionWebhook(payload);
    }
}
