import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQuotationDto, UpdateQuotationStatusDto } from './dto/quotations.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QuotationsService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateQuotationDto) {
        // Generator for Magic Links preventing ID Guessing
        const magicLinkToken = uuidv4();

        return this.prisma.quotation.create({
            data: {
                businessId: data.businessId,
                clientId: data.clientId,
                vehicleId: data.vehicleId,
                workOrderId: data.workOrderId,
                totalAmount: data.totalAmount,
                items: data.items,
                notes: data.notes,
                expiresAt: data.expiresAt,
                magicLink: magicLinkToken,
            },
            include: { client: true, vehicle: true }
        });
    }

    async findByBusiness(businessId: string) {
        return this.prisma.quotation.findMany({
            where: { businessId },
            include: { client: true, vehicle: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const quotation = await this.prisma.quotation.findUnique({
            where: { id },
            include: { client: true, vehicle: true, business: true }
        });
        if (!quotation) throw new NotFoundException('Quotation not found');
        return quotation;
    }

    async findByMagicLink(token: string) {
        const quotation = await this.prisma.quotation.findUnique({
            where: { magicLink: token },
            include: { client: true, vehicle: true, business: true }
        });
        if (!quotation) throw new NotFoundException('Invalid or expired Magic Link');
        return quotation;
    }

    async updateStatus(id: string, updateDto: UpdateQuotationStatusDto) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Update Quotation Status
            const quotation = await tx.quotation.update({
                where: { id },
                data: { status: updateDto.status },
            });

            // 2. SINERGIA 4: Cotizaciones -> WorkOrders
            // If the client accepts the quote and no work order exists yet, automate its creation.
            if (updateDto.status === 'APPROVED' && !quotation.workOrderId) {
                const workOrder = await tx.workOrder.create({
                    data: {
                        businessId: quotation.businessId,
                        clientId: quotation.clientId,
                        vehicleId: quotation.vehicleId, // Maps the target vehicle if any
                        status: 'RECEIVING', // WorkOrderStatus.RECEIVING is default
                        description: `Orden automática generada desde Cotización aprobada mediante enlace público.\n\nNotas originales: ${quotation.notes || 'N/A'}\nTotal pre-aprobado: $${quotation.totalAmount}`,
                    }
                });

                // Link the generated Work Order back to the Quotation
                await tx.quotation.update({
                    where: { id: quotation.id },
                    data: { workOrderId: workOrder.id }
                });
            }

            return quotation;
        });
    }
}
