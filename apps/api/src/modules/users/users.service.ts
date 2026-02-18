import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findByFirebaseUid(firebaseUid: string) {
        return this.prisma.user.findUnique({
            where: { firebaseUid },
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
        return this.prisma.user.upsert({
            where: { firebaseUid: data.firebaseUid },
            update: {
                email: data.email,
                phone: data.phone,
                firstName: data.firstName,
                lastName: data.lastName,
                avatarUrl: data.avatarUrl,
            },
            create: {
                firebaseUid: data.firebaseUid,
                email: data.email,
                phone: data.phone,
                firstName: data.firstName,
                lastName: data.lastName,
                avatarUrl: data.avatarUrl,
            },
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
}
