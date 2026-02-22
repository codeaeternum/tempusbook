import { Injectable, NotFoundException, HttpException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBusinessMemberDto, UpdateBusinessMemberDto } from './dto/business-members.dto';
import { PLAN_LIMITS } from '../auth/config/plan-limits';

@Injectable()
export class BusinessMembersService {
    constructor(private prisma: PrismaService) { }

    async findByBusiness(businessId: string) {
        return this.prisma.businessMember.findMany({
            where: { businessId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        email: true,
                        phone: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
    }

    async findById(id: string) {
        const member = await this.prisma.businessMember.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });

        if (!member) throw new NotFoundException('Miembro del equipo no encontrado');
        return member;
    }

    async create(data: CreateBusinessMemberDto) {
        // SaaS Paywall Limitation: Max Staff allowed by Subscription
        const subscription = await this.prisma.subscription.findUnique({ where: { businessId: data.businessId } });
        const planKey = (subscription?.status === 'TRIAL' || subscription?.status === 'ACTIVE') ? (subscription.plan || 'FREE') : 'FREE';
        const limit = PLAN_LIMITS[planKey as keyof typeof PLAN_LIMITS].maxStaff;

        const currentActiveStaff = await this.prisma.businessMember.count({
            where: { businessId: data.businessId, isActive: true }
        });

        if (currentActiveStaff >= limit) {
            throw new HttpException({
                statusCode: 402,
                message: `Límite alcanzado: Tu plan (${planKey}) permite hasta ${limit} miembros de equipo. Actualiza tu suscripción para seguir creciendo.`,
            }, 402);
        }

        let finalUserId = data.userId;

        if (!finalUserId && data.email && data.firstName) {
            // Phantom User Creation
            const newUser = await this.prisma.user.create({
                data: {
                    firebaseUid: `phantom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName || '',
                    phone: data.phone || null,
                    avatarUrl: data.color || null,
                }
            });
            finalUserId = newUser.id;
        }

        if (!finalUserId) {
            throw new Error("Se requiere un userId existente o los datos mínimos ('email', 'firstName') para registrar al Empleado.");
        }

        return this.prisma.businessMember.create({
            data: {
                businessId: data.businessId,
                userId: finalUserId,
                role: data.role,
                isActive: data.isActive,
                color: data.color,
            },
            include: { user: true }
        });
    }

    async update(id: string, data: UpdateBusinessMemberDto) {
        return this.prisma.businessMember.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        return this.prisma.businessMember.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
