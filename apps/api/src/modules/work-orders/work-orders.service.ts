import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from './dto/work-orders.dto';

@Injectable()
export class WorkOrdersService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateWorkOrderDto) {
        return this.prisma.workOrder.create({
            data,
            include: { client: true, vehicle: true }
        });
    }

    async findByBusiness(businessId: string) {
        return this.prisma.workOrder.findMany({
            where: { businessId },
            include: { client: true, vehicle: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const order = await this.prisma.workOrder.findUnique({
            where: { id },
            include: { client: true, vehicle: true, quotations: true }
        });
        if (!order) throw new NotFoundException('Work Order not found');
        return order;
    }

    async update(id: string, data: UpdateWorkOrderDto) {
        return this.prisma.workOrder.update({
            where: { id },
            data,
            include: { client: true, vehicle: true }
        });
    }

    async remove(id: string) {
        return this.prisma.workOrder.delete({
            where: { id },
        });
    }
}
