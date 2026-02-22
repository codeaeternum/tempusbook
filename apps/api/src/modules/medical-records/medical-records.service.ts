import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MedicalRecordsService {
    constructor(private prisma: PrismaService) { }

    async getRecord(businessId: string, clientId: string) {
        let record = await this.prisma.medicalRecord.findUnique({
            where: { businessId_clientId: { businessId, clientId } },
            include: { client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } }
        });

        // Auto-create if not exists
        if (!record) {
            record = await this.prisma.medicalRecord.create({
                data: { businessId, clientId },
                include: { client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } }
            });
        }
        return record;
    }

    async updateRecord(businessId: string, clientId: string, data: any) {
        return this.prisma.medicalRecord.upsert({
            where: { businessId_clientId: { businessId, clientId } },
            create: {
                businessId,
                clientId,
                ...data
            },
            update: {
                ...data
            }
        });
    }
}
