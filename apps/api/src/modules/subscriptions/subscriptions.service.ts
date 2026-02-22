import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/subscription.dto';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

@Injectable()
export class SubscriptionsService {
    private readonly logger = new Logger(SubscriptionsService.name);
    private mpClient: MercadoPagoConfig;

    constructor(private prisma: PrismaService) {
        // Initialize MercadoPago SDK with AeternaSuite Platform Credentials
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!accessToken) {
            this.logger.warn('MERCADOPAGO_ACCESS_TOKEN is missing in environment variables. Subscriptions checkout will fail.');
            this.mpClient = new MercadoPagoConfig({ accessToken: 'missing_token' });
        } else {
            this.mpClient = new MercadoPagoConfig({ accessToken });
        }
    }

    private getPlanPrice(plan: string): number {
        switch (plan) {
            case 'STARTER': return 299.00;
            case 'PRO': return 699.00;
            case 'BUSINESS': return 1499.00;
            default: return 0;
        }
    }

    async getCurrentSubscription(businessId: string) {
        const sub = await this.prisma.subscription.findUnique({
            where: { businessId }
        });

        if (!sub) {
            throw new NotFoundException('Subscription not found for this business.');
        }

        return sub;
    }

    async createCheckoutSession(dto: CreateCheckoutDto) {
        const price = this.getPlanPrice(dto.plan);
        if (price === 0) {
            throw new BadRequestException('El plan seleccionado no es válido para checkout.');
        }

        const business = await this.prisma.business.findUnique({
            where: { id: dto.businessId },
            include: { subscription: true }
        });

        if (!business) {
            throw new NotFoundException('Business not found.');
        }

        try {
            const preference = new Preference(this.mpClient);
            const response = await preference.create({
                body: {
                    items: [
                        {
                            id: `plan_${dto.plan.toLowerCase()}`,
                            title: `AeternaSuite ${dto.plan} Plan - Suscripción Mensual`,
                            quantity: 1,
                            unit_price: price,
                            currency_id: 'MXN',
                        }
                    ],
                    // We embed the businessId and intended plan so the webhook knows what to update
                    external_reference: `${dto.businessId}||${dto.plan}`,
                    back_urls: {
                        success: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/settings/billing?status=success`,
                        failure: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/settings/billing?status=failure`,
                        pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/settings/billing?status=pending`
                    },
                    auto_return: 'approved',
                    statement_descriptor: 'AETERNASUITE SAAS'
                }
            });

            return {
                init_point: response.init_point, // URL to redirect user to MP Checkout
                sandbox_init_point: response.sandbox_init_point
            };

        } catch (error) {
            this.logger.error('Error creating MercadoPago preference', error);
            throw new BadRequestException('Error al contactar con el proveedor de pagos.');
        }
    }

    async handleWebhook(body: any) {
        // MercadoPago Webhooks trigger 'payment' events
        if (body.type === 'payment' || body.topic === 'payment') {
            try {
                const paymentId = body.data?.id;
                if (!paymentId) return { status: 'ignored' };

                const paymentClient = new Payment(this.mpClient);
                const paymentInfo = await paymentClient.get({ id: paymentId });

                if (paymentInfo.status === 'approved') {
                    const extRef = paymentInfo.external_reference; // Format: businessId||PLAN
                    if (!extRef) return { status: 'ignored, no external_reference' };

                    const [businessId, planKey] = extRef.split('||');

                    if (businessId && planKey) {
                        // 1. Calculate new end date (30 days from now)
                        const now = new Date();
                        const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

                        // 2. Update the Subscription in Prisma
                        await this.prisma.subscription.update({
                            where: { businessId: businessId },
                            data: {
                                plan: planKey as any,
                                status: 'ACTIVE',
                                currentPeriodStart: now,
                                currentPeriodEnd: nextMonth,
                                mpSubscriptionId: paymentId.toString(), // Store MP ID as reference
                            }
                        });

                        this.logger.log(`Subscription upgraded for Business ${businessId} to ${planKey}`);
                    }
                }

                return { status: 'success' };
            } catch (error) {
                this.logger.error('Error handling MercadoPago webhook', error);
                throw new BadRequestException('Webhook processing failed');
            }
        }

        return { status: 'ignored, not a payment event' };
    }
}
