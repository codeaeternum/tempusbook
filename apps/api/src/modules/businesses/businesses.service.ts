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
                include: {
                    category: true,
                    galleryItems: { where: { isPublic: true }, take: 4, orderBy: { sortOrder: 'asc' } },
                    reviews: { take: 1, orderBy: { createdAt: 'desc' }, include: { client: { select: { firstName: true, avatarUrl: true } } } }
                },
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

    async findBySlug(slugOrId: string) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
        const whereClause = isUuid ? { id: slugOrId } : { slug: slugOrId };

        const business = await this.prisma.business.findUnique({
            where: whereClause,
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

    async getClients(businessId: string) {
        // Obtenemos a los usuarios que hayan interactuado con el negocio (Books/Sales/CRM)
        const clients = await this.prisma.user.findMany({
            where: {
                OR: [
                    { bookings: { some: { businessId } } },
                    { sales: { some: { businessId } } },
                    { businessClients: { some: { businessId } } }
                ]
            },
            include: {
                bookings: {
                    where: { businessId },
                    orderBy: { startTime: 'desc' }
                },
                sales: {
                    where: { businessId }
                },
                businessClients: {
                    where: { businessId }
                }
            }
        });

        // Formateamos como requiere el Frontend (Client Type)
        return clients.map(user => {
            const completedBookings = user.bookings.filter(b => b.status === 'COMPLETED');
            const totalSpent = user.sales.reduce((sum, sale) => sum + Number(sale.total), 0);
            const bClient = user.businessClients[0];

            return {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                avatarColor: user.avatarUrl || `hsl(${Math.random() * 360}, 60%, 50%)`,
                totalVisits: completedBookings.length,
                totalSpent: totalSpent,
                lastVisit: user.bookings[0]?.startTime || null,
                loyaltyPoints: 0,
                status: bClient?.status?.toLowerCase() || 'active',
                notes: bClient?.notes || '',
                clientSince: bClient?.createdAt || user.bookings[user.bookings.length - 1]?.createdAt || user.createdAt,
                tags: []
            };
        });
    }

    async createClient(businessId: string, data: any) {
        let user;
        if (data.email) {
            user = await this.prisma.user.findUnique({ where: { email: data.email } });
        }
        if (!user && data.phone) {
            const users = await this.prisma.user.findMany({ where: { phone: data.phone } });
            if (users.length > 0) user = users[0];
        }

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    firebaseUid: `offline-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                    firstName: data.firstName || 'Client',
                    lastName: data.lastName || '',
                    email: data.email || null,
                    phone: data.phone || null,
                    role: 'CLIENT'
                }
            });
        }

        const bClient = await this.prisma.businessClient.upsert({
            where: {
                businessId_userId: {
                    businessId,
                    userId: user.id
                }
            },
            update: {
                status: (data.status?.toUpperCase() as any) || 'ACTIVE',
                notes: data.notes || null,
            },
            create: {
                businessId,
                userId: user.id,
                status: (data.status?.toUpperCase() as any) || 'ACTIVE',
                notes: data.notes || null,
            }
        });

        return { ...user, status: bClient.status, notes: bClient.notes };
    }

    async updateClient(businessId: string, clientId: string, data: any) {
        await this.prisma.user.update({
            where: { id: clientId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone
            }
        });

        await this.prisma.businessClient.upsert({
            where: {
                businessId_userId: {
                    businessId,
                    userId: clientId
                }
            },
            update: {
                status: data.status?.toUpperCase() as any,
                notes: data.notes
            },
            create: {
                businessId,
                userId: clientId,
                status: (data.status?.toUpperCase() as any) || 'ACTIVE',
                notes: data.notes
            }
        });
        return { success: true };
    }

    async deleteClient(businessId: string, clientId: string) {
        await this.prisma.businessClient.deleteMany({
            where: {
                businessId,
                userId: clientId
            }
        });
        return { success: true };
    }
}
