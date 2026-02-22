import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicles.dto';

@Injectable()
export class VehiclesService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateVehicleDto) {
        return this.prisma.vehicle.create({
            data
        });
    }

    async findByBusiness(businessId: string) {
        return this.prisma.vehicle.findMany({
            where: { businessId },
            include: { client: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByClient(clientId: string) {
        return this.prisma.vehicle.findMany({
            where: { clientId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id },
            include: { client: true, workOrders: true }
        });
        if (!vehicle) throw new NotFoundException('Vehicle not found');
        return vehicle;
    }

    async update(id: string, data: UpdateVehicleDto) {
        return this.prisma.vehicle.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        return this.prisma.vehicle.delete({
            where: { id },
        });
    }
}
