import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { PLAN_KEY } from './decorators/plan.decorator';
import { PLAN_HIERARCHY } from './config/plan-limits';

const prisma = new PrismaClient();

@Injectable()
export class PlanGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPlan = this.reflector.getAllAndOverride<string>(PLAN_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPlan) {
            return true; // No plan required for this route
        }

        const request = context.switchToHttp().getRequest();

        // We need the businessId. Usually in a multi-tenant B2B, frontend sends it via Headers or Body.
        // For standard REST endpoints, let's look for x-business-id header.
        const businessId = request.headers['x-business-id'] || request.body?.businessId || request.query?.businessId;

        if (!businessId) {
            // If the route expects a plan but no business is specified to check against, deny.
            throw new HttpException('Missing business context (x-business-id) to verify Plan limits', HttpStatus.BAD_REQUEST);
        }

        // Fetch Business Subscription
        const subscription = await prisma.subscription.findUnique({
            where: { businessId: businessId }
        });

        // Default to FREE if no subscription record exists or if trial expired
        const currentPlan = subscription?.plan || 'FREE';
        const isTrialActive = subscription?.status === 'TRIAL' && new Date(subscription.currentPeriodEnd) > new Date();
        const isActive = subscription?.status === 'ACTIVE' && new Date(subscription.currentPeriodEnd) > new Date();

        // If trial is active, grant BUSINESS level permissions
        const effectivePlan = (isTrialActive) ? 'BUSINESS' : (isActive ? currentPlan : 'FREE');

        const requiredHierarchy = PLAN_HIERARCHY[requiredPlan] || 0;
        const currentHierarchy = PLAN_HIERARCHY[effectivePlan] || 0;

        if (currentHierarchy < requiredHierarchy) {
            // Paywall Error (402 Payment Required)
            throw new HttpException({
                statusCode: 402,
                message: `Paywall: Se requiere plan ${requiredPlan} o superior para acceder a esta función. Tu plan actual es ${effectivePlan}.`,
                requiredPlan,
                currentPlan: effectivePlan
            }, 402);
        }

        return true;
    }
}
