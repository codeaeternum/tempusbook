import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payments.dto';

@Injectable()
export class PaymentsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(businessId: string, createDto: CreatePaymentDto) {
        return this.prisma.payment.create({
            data: {
                ...createDto,
                businessId
            }
        });
    }

    async findAll(businessId: string) {
        return this.prisma.payment.findMany({
            where: { businessId },
            include: {
                booking: { select: { client: { select: { firstName: true, lastName: true } } } },
                sale: { select: { client: { select: { firstName: true, lastName: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async refund(id: string, businessId: string) {
        const p = await this.prisma.payment.findUnique({ where: { id, businessId } });
        if (!p) throw new NotFoundException('Payment not found');
        return this.prisma.payment.update({
            where: { id },
            data: { status: 'REFUNDED' }
        });
    }

    async complete(id: string, businessId: string) {
        const p = await this.prisma.payment.findUnique({ where: { id, businessId } });
        if (!p) throw new NotFoundException('Payment not found');
        return this.prisma.payment.update({
            where: { id },
            data: { status: 'COMPLETED' }
        });
    }
}
