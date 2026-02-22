import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdPlacement } from '@prisma/client';

@Injectable()
export class SuperAdminService {
    constructor(private prisma: PrismaService) { }

    // ==========================================
    // Feature Flags
    // ==========================================

    async listFlags() {
        return this.prisma.featureFlag.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async createFlag(data: {
        key: string;
        name: string;
        description?: string;
        enabled?: boolean;
        environment?: string;
        targetPlans?: string[];
        targetCategories?: string[];
    }) {
        return this.prisma.featureFlag.create({
            data: {
                key: data.key,
                name: data.name,
                description: data.description,
                enabled: data.enabled ?? false,
                environment: data.environment ?? 'production',
                targetPlans: data.targetPlans ?? [],
                targetCategories: data.targetCategories ?? [],
            },
        });
    }

    async toggleFlag(id: string, enabled: boolean) {
        const flag = await this.prisma.featureFlag.findUnique({ where: { id } });
        if (!flag) throw new NotFoundException('Feature flag not found');

        return this.prisma.featureFlag.update({
            where: { id },
            data: { enabled },
        });
    }

    // ==========================================
    // Platform Ads
    // ==========================================

    async listAds() {
        return this.prisma.platformAd.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async createAd(data: {
        title: string;
        body?: string;
        imageUrl?: string;
        linkUrl?: string;
        placement?: string;
        targetPlans?: string[];
        targetCategories?: string[];
        startsAt?: Date;
        endsAt?: Date;
    }) {
        return this.prisma.platformAd.create({
            data: {
                title: data.title,
                body: data.body,
                imageUrl: data.imageUrl,
                linkUrl: data.linkUrl,
                placement: (data.placement as AdPlacement) ?? 'DASHBOARD_BANNER',
                targetPlans: data.targetPlans ?? ['FREE', 'STARTER'],
                targetCategories: data.targetCategories ?? [],
                startsAt: data.startsAt ? new Date(data.startsAt) : null,
                endsAt: data.endsAt ? new Date(data.endsAt) : null,
            },
        });
    }

    async toggleAd(id: string, isActive: boolean) {
        const ad = await this.prisma.platformAd.findUnique({ where: { id } });
        if (!ad) throw new NotFoundException('Platform ad not found');

        return this.prisma.platformAd.update({
            where: { id },
            data: { isActive },
        });
    }

    // ==========================================
    // Platform Overview (Code Aeternum Dashboard)
    // ==========================================

    async getPlatformOverview() {
        const [
            totalBusinesses,
            activeBusinesses,
            totalUsers,
            totalBookings,
            flagsEnabled,
            flagsTotal,
            activeAds,
            planDistribution,
        ] = await Promise.all([
            this.prisma.business.count(),
            this.prisma.business.count({ where: { status: 'ACTIVE' } }),
            this.prisma.user.count(),
            this.prisma.booking.count(),
            this.prisma.featureFlag.count({ where: { enabled: true } }),
            this.prisma.featureFlag.count(),
            this.prisma.platformAd.count({ where: { isActive: true } }),
            this.prisma.subscription.groupBy({
                by: ['plan'],
                _count: { plan: true },
            }),
        ]);

        return {
            totalBusinesses,
            activeBusinesses,
            totalUsers,
            totalBookings,
            featureFlags: { enabled: flagsEnabled, total: flagsTotal },
            activeAds,
            planDistribution: planDistribution.map((p: { plan: string; _count: { plan: number } }) => ({
                plan: p.plan,
                count: p._count.plan,
            })),
        };
    }

    async listBusinesses() {
        return this.prisma.business.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                createdAt: true,
                subscription: {
                    select: {
                        plan: true,
                        status: true,
                        trialEndsAt: true,
                    },
                },
                _count: {
                    select: {
                        bookings: true,
                        members: true,
                        services: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }

    async listUsers() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                avatarUrl: true,
                phone: true,
                createdAt: true,
                businessMembers: {
                    select: {
                        role: true,
                        business: { select: { id: true, name: true, slug: true } },
                    },
                },
                _count: {
                    select: {
                        bookings: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
    }

    async getAuditLog() {
        return this.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    // ==========================================
    // Business Management
    // ==========================================

    async changeBusinessStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
        const business = await this.prisma.business.findUnique({ where: { id } });
        if (!business) throw new NotFoundException('Business not found');

        const updated = await this.prisma.business.update({
            where: { id },
            data: { status },
        });

        // Create audit log entry
        await this.prisma.auditLog.create({
            data: {
                actorId: 'SUPERADMIN',
                action: status === 'SUSPENDED' ? 'SUSPEND_BUSINESS' : 'REACTIVATE_BUSINESS',
                targetType: 'Business',
                targetId: id,
                details: { businessName: business.name, newStatus: status },
            },
        });

        return updated;
    }

    async changeSubscriptionPlan(businessId: string, plan: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS') {
        const subscription = await this.prisma.subscription.findUnique({
            where: { businessId },
        });
        if (!subscription) throw new NotFoundException('Subscription not found for this business');

        const updated = await this.prisma.subscription.update({
            where: { businessId },
            data: {
                plan,
                status: 'ACTIVE',
            },
        });

        // Create audit log entry
        await this.prisma.auditLog.create({
            data: {
                actorId: 'SUPERADMIN',
                action: 'CHANGE_PLAN',
                targetType: 'Subscription',
                targetId: subscription.id,
                details: { businessId, oldPlan: subscription.plan, newPlan: plan },
            },
        });

        return updated;
    }

    // ==========================================
    // Subscriptions
    // ==========================================

    async listSubscriptions() {
        return this.prisma.subscription.findMany({
            include: {
                business: {
                    select: { id: true, name: true, slug: true, status: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ==========================================
    // Platform Feedback
    // ==========================================

    async listFeedback() {
        return this.prisma.platformFeedback.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }

    async createFeedback(data: {
        title: string;
        description: string;
        type?: string;
        priority?: string;
        businessId?: string;
    }) {
        return this.prisma.platformFeedback.create({
            data: {
                title: data.title,
                description: data.description,
                type: (data.type as 'BUG_REPORT' | 'FEATURE_REQUEST' | 'GENERAL' | 'COMPLAINT' | 'PRAISE') ?? 'GENERAL',
                priority: (data.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') ?? 'MEDIUM',
                businessId: data.businessId || null,
            },
        });
    }

    async updateFeedbackStatus(id: string, status: string, adminNotes?: string) {
        const fb = await this.prisma.platformFeedback.findUnique({ where: { id } });
        if (!fb) throw new NotFoundException('Feedback not found');

        return this.prisma.platformFeedback.update({
            where: { id },
            data: {
                status: status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'WONT_FIX' | 'DUPLICATE',
                adminNotes: adminNotes || fb.adminNotes,
                resolvedAt: status === 'RESOLVED' ? new Date() : fb.resolvedAt,
            },
        });
    }
}
