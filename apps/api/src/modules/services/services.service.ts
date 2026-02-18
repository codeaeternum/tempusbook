import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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

    async create(data: any) {
        return this.prisma.service.create({ data });
    }

    async update(id: string, data: any) {
        return this.prisma.service.update({ where: { id }, data });
    }

    async delete(id: string) {
        return this.prisma.service.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
