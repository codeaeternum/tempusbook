import { Injectable, NotFoundException, HttpException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PLAN_LIMITS } from '../auth/config/plan-limits';
import { CreateServiceDto, UpdateServiceDto } from './dto/services.dto';

@Injectable()
export class ServicesService {
    constructor(private prisma: PrismaService) { }

    async findByBusiness(businessId: string) {
        return this.prisma.service.findMany({
            where: { businessId, isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }

    async findById(id: string) {
        const service = await this.prisma.service.findUnique({ where: { id } });
        if (!service) throw new NotFoundException('Service not found');
        return service;
    }

    async create(data: CreateServiceDto) {
        const subscription = await this.prisma.subscription.findUnique({ where: { businessId: data.businessId } });
        const planKey = (subscription?.status === 'TRIAL' || subscription?.status === 'ACTIVE') ? (subscription.plan || 'FREE') : 'FREE';
        const limit = PLAN_LIMITS[planKey as keyof typeof PLAN_LIMITS].maxServices;

        const currentActiveServices = await this.prisma.service.count({
            where: { businessId: data.businessId, isActive: true }
        });

        if (currentActiveServices >= limit) {
            throw new HttpException({
                statusCode: 402,
                message: `Límite alcanzado: Tu plan (${planKey}) permite hasta ${limit} servicios. Actualiza tu suscripción para seguir expandiendo tu catálogo.`,
            }, 402);
        }

        return this.prisma.service.create({ data });
    }

    async update(id: string, data: UpdateServiceDto) {
        return this.prisma.service.update({ where: { id }, data });
    }

    async delete(id: string) {
        return this.prisma.service.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
