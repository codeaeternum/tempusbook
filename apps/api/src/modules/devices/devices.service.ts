import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDeviceDto, UpdateDeviceDto } from './dto/devices.dto';

@Injectable()
export class DevicesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createDeviceDto: CreateDeviceDto) {
        return (this.prisma as any).device.create({
            data: createDeviceDto,
            include: { client: true }
        });
    }

    async findByBusiness(businessId: string) {
        return (this.prisma as any).device.findMany({
            where: { businessId },
            include: { client: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByClient(clientId: string) {
        return (this.prisma as any).device.findMany({
            where: { clientId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string) {
        const device = await (this.prisma as any).device.findUnique({
            where: { id },
            include: { client: true, workOrders: true, quotations: true }
        });
        if (!device) throw new NotFoundException('Device not found');
        return device;
    }

    async update(id: string, updateDeviceDto: UpdateDeviceDto) {
        return (this.prisma as any).device.update({
            where: { id },
            data: updateDeviceDto,
            include: { client: true }
        });
    }

    async remove(id: string) {
        return (this.prisma as any).device.delete({
            where: { id }
        });
    }
}
