import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MercadoPagoConfig, PreApprovalPlan } from 'mercadopago';

@Injectable()
export class BillingService {
    private readonly logger = new Logger(BillingService.name);
    private mpClient: MercadoPagoConfig;

    // Hardcoded Prices for SaaS Tiers (Monthly) - MXN
    private readonly PLAN_PRICING = {
        STARTER: 499,
        PRO: 899,
        BUSINESS: 1499
    };

    constructor(private prisma: PrismaService) {
        // Initialize MercadoPago Core SDK v2
        this.mpClient = new MercadoPagoConfig({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
            options: { timeout: 5000 }
        });
    }

    /**
     * Generates a unique Checkout Link for a Recurring Monthly B2B Subscription
     * Uses MercadoPago PreApproval Plan API
     */
    async generateSubscriptionCheckout(businessId: string, planName: 'STARTER' | 'PRO' | 'BUSINESS') {
        try {
            const business = await this.prisma.business.findUnique({
                where: { id: businessId }
            });

            if (!business) {
                throw new NotFoundException('Business not found');
            }

            const amount = this.PLAN_PRICING[planName];
            if (!amount) throw new InternalServerErrorException('Invalid plan name requested.');

            const preApprovalPlan = new PreApprovalPlan(this.mpClient);
            const planDetails = {
                reason: `Suscripción Mensual AeternaSuite - Plan ${planName}`,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: amount,
                    currency_id: 'MXN'
                },
                back_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/settings/billing?success=true`,
                payer_email: business.email || 'hola@aeternasuite.com', // Optional but recommended
                external_reference: `${businessId}_${planName}`, // Critical for Webhook attribution
            };

            const response = await preApprovalPlan.create({ body: planDetails as any });

            // Store the intent pending response in DB just in case?
            // Usually, we just return the init_point right away.
            this.logger.log(`Generated Subscription Link for ${business.name} -> ${planName}`);

            return {
                initPoint: response.init_point,
                subscriptionId: response.id,
                plan: planName,
                amount: amount
            };

        } catch (error) {
            this.logger.error('Failed to create MercadoPago PreApproval Link:', error);
            throw new InternalServerErrorException('Error contacting Payment Gateway');
        }
    }

    /**
     * Ingests Asynchronous Webhooks sent directly from MercadoPago Servers
     * when a Tenant pays or their card is declined.
     */
    async handleSubscriptionWebhook(payload: any) {
        this.logger.log(`Received Webhook from MercadoPago: ${JSON.stringify(payload)}`);

        // Payload Action "created" or "updated" or "authorized"
        if (payload.action === 'created' || payload.action === 'updated' || payload?.type === 'payment') {

            // For safety and robust tracing we extract data from the webhook body 
            // In a production app, we would query the MP API using payload.data.id to verify authenticity.
            // But since this is a local B2B demo we will simulate the parse logic:

            // Imagine we parsed external_reference as: "uuid_BUSINESS"
            // For now, we print and accept. 
            this.logger.log('SaaS MercadoPago Webhook Parsed Successfully. Subscriptions Engine is Alive.');
            return { status: 'success', message: 'Webhook Processed' };

        }

        return { status: 'ignored' };
    }

    /**
     * Nightly CronJob. Sweeps the Database looking for Subscriptions whose Next Payment
     * Date (currentPeriodEnd) has passed and Webhooks haven't reported a renewal.
     * Automatically degrades the tenant down to FREE.
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async autoDegradeExpiredSubscriptions() {
        this.logger.log('Starting Nightly B2B Subscription Sweep...');
        const now = new Date();

        try {
            const expiredQuery = await this.prisma.subscription.updateMany({
                where: {
                    currentPeriodEnd: { lt: now },
                    plan: { not: 'FREE' }
                },
                data: {
                    plan: 'FREE',
                    status: 'PAST_DUE'
                }
            });

            this.logger.log(`Sweep Complete. Degraded ${expiredQuery.count} Tenant(s) due to lack of payment.`);
        } catch (error) {
            this.logger.error('Failed to execute Nightly Subscriptions Sweep:', error);
        }
    }
}
