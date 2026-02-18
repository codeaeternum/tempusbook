import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BusinessesService {
    constructor(private prisma: PrismaService) { }

    async findAll(params: {
        categorySlug?: string;
        city?: string;
        search?: string;
        page?: number;
        perPage?: number;
    }) {
        const { categorySlug, city, search, page = 1, perPage = 20 } = params;

        const where: any = { status: 'ACTIVE' };

        if (categorySlug) {
            where.category = { slug: categorySlug };
        }
        if (city) {
            where.city = { contains: city, mode: 'insensitive' };
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.business.findMany({
                where,
                include: { category: true },
                skip: (page - 1) * perPage,
                take: perPage,
                orderBy: { avgRating: 'desc' },
            }),
            this.prisma.business.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                perPage,
                totalPages: Math.ceil(total / perPage),
            },
        };
    }

    async findBySlug(slug: string) {
        const business = await this.prisma.business.findUnique({
            where: { slug },
            include: {
                category: true,
                services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
                businessHours: { orderBy: { dayOfWeek: 'asc' } },
                reviews: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: { client: { select: { firstName: true, lastName: true, avatarUrl: true } } },
                },
                galleryItems: { where: { isPublic: true }, orderBy: { sortOrder: 'asc' }, take: 20 },
                members: {
                    where: { isActive: true },
                    include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
                },
            },
        });

        if (!business) throw new NotFoundException('Business not found');
        return business;
    }

    async create(data: any, userId: string) {
        return this.prisma.$transaction(async (tx) => {
            // Create business
            const business = await tx.business.create({ data });

            // Add creator as owner
            await tx.businessMember.create({
                data: {
                    businessId: business.id,
                    userId,
                    role: 'OWNER',
                },
            });

            // Create trial subscription
            const now = new Date();
            const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

            await tx.subscription.create({
                data: {
                    businessId: business.id,
                    plan: 'PRO', // Trial starts with Pro features
                    status: 'TRIAL',
                    trialEndsAt: trialEnd,
                    currentPeriodStart: now,
                    currentPeriodEnd: trialEnd,
                },
            });

            return business;
        });
    }

    async update(id: string, data: any) {
        return this.prisma.business.update({ where: { id }, data });
    }
}
