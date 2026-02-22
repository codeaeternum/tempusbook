import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findByFirebaseUid(firebaseUid: string) {
        return this.prisma.user.findUnique({
            where: { firebaseUid },
            include: {
                businessMembers: {
                    include: { business: true }
                }
            }
        });
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                favorites: { include: { business: true } },
            },
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async createOrUpdate(data: {
        firebaseUid: string;
        email?: string;
        phone?: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
    }) {
        // 1. Prioridad Absoluta: Buscar por Firebase UID
        let user = await this.prisma.user.findUnique({
            where: { firebaseUid: data.firebaseUid }
        });

        if (user) {
            // Actualizar usuario existente normal
            return this.prisma.user.update({
                where: { id: user.id },
                data: {
                    email: data.email,
                    phone: data.phone,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    avatarUrl: data.avatarUrl,
                }
            });
        }

        // 2. Identity Merge B2C: Buscar usuario fantasma por Email
        if (data.email) {
            const ghostUser = await this.prisma.user.findUnique({
                where: { email: data.email }
            });

            if (ghostUser) {
                // Fusión de Identidades: Reclamar la cuenta y sobrescribir el ID de Firebase fantasma
                return this.prisma.user.update({
                    where: { id: ghostUser.id },
                    data: {
                        firebaseUid: data.firebaseUid, // <-- OVERWRITE MAGIC
                        phone: data.phone || ghostUser.phone,
                        firstName: data.firstName || ghostUser.firstName,
                        lastName: data.lastName || ghostUser.lastName,
                        avatarUrl: data.avatarUrl || ghostUser.avatarUrl,
                    }
                });
            }
        }

        // 3. Usuario totalmente virgen.
        return this.prisma.user.create({
            data: {
                firebaseUid: data.firebaseUid,
                email: data.email,
                phone: data.phone,
                firstName: data.firstName,
                lastName: data.lastName,
                avatarUrl: data.avatarUrl,
            }
        });
    }

    async updatePreferences(id: string, data: { preferredLang?: string }) {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }

    async toggleFavorite(userId: string, businessId: string) {
        const existing = await this.prisma.favorite.findUnique({
            where: { userId_businessId: { userId, businessId } },
        });

        if (existing) {
            await this.prisma.favorite.delete({ where: { id: existing.id } });
            return { favorited: false };
        }

        await this.prisma.favorite.create({
            data: { userId, businessId },
        });
        return { favorited: true };
    }

    async getFavorites(userId: string) {
        return this.prisma.favorite.findMany({
            where: { userId },
            include: {
                business: {
                    include: { category: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // --- B2C HUB DATA (PORTAL DEL CLIENTE) --- //
    async getB2CHubData(userId: string) {
        const now = new Date();

        const upcomingBookings = await this.prisma.booking.findMany({
            where: {
                clientId: userId,
                startTime: { gte: now },
                status: { not: 'CANCELLED' }
            },
            include: {
                business: { select: { id: true, name: true, slug: true, logoUrl: true } },
                service: { select: { id: true, name: true, durationMinutes: true, price: true } },
                staff: { select: { id: true, user: { select: { firstName: true, lastName: true, avatarUrl: true } } } }
            },
            orderBy: { startTime: 'asc' }
        });

        const pastBookings = await this.prisma.booking.findMany({
            where: {
                clientId: userId,
                OR: [
                    { startTime: { lt: now } },
                    { status: 'CANCELLED' }
                ]
            },
            include: {
                business: { select: { id: true, name: true, slug: true } },
                service: { select: { name: true } }
            },
            orderBy: { startTime: 'desc' },
            take: 10
        });

        const loyaltyCards = await this.prisma.loyaltyCard.findMany({
            where: { clientId: userId },
            include: {
                program: {
                    select: {
                        name: true,
                        config: true,
                        business: { select: { id: true, name: true, logoUrl: true } }
                    }
                }
            }
        });

        return {
            upcomingBookings,
            pastBookings,
            loyaltyCards
        };
    }

    // --- CONTEXTUAL B2C HUB DATA (AISLADO POR EMPRESA) --- //
    async getContextualB2CHubData(userId: string, businessId: string) {
        const now = new Date();

        const upcomingBookings = await this.prisma.booking.findMany({
            where: {
                clientId: userId,
                businessId: businessId,
                startTime: { gte: now },
                status: { not: 'CANCELLED' }
            },
            include: {
                service: { select: { id: true, name: true, durationMinutes: true, price: true } },
                staff: { select: { id: true, user: { select: { firstName: true, lastName: true, avatarUrl: true } } } }
            },
            orderBy: { startTime: 'asc' }
        });

        const pastBookings = await this.prisma.booking.findMany({
            where: {
                clientId: userId,
                businessId: businessId,
                OR: [
                    { startTime: { lt: now } },
                    { status: 'CANCELLED' }
                ]
            },
            include: {
                service: { select: { name: true } }
            },
            orderBy: { startTime: 'desc' },
            take: 10
        });

        const loyaltyCards = await this.prisma.loyaltyCard.findMany({
            where: { clientId: userId, program: { businessId: businessId } },
            include: {
                program: {
                    select: {
                        id: true,
                        name: true,
                        config: true,
                    }
                }
            }
        });

        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
            select: { name: true, slug: true, logoUrl: true, coverUrl: true, settings: true }
        });

        return {
            business,
            upcomingBookings,
            pastBookings,
            loyaltyCards
        };
    }
}
