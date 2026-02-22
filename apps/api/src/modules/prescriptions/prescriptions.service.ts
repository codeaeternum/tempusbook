import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface CreatePrescriptionDto {
    diagnosis?: string;
    notes?: string;
    doctorName?: string;
    items: Array<{
        medicationName: string;
        dosage: string;
        frequency: string;
        duration: string;
        notes?: string;
    }>;
}

@Injectable()
export class PrescriptionsService {
    constructor(private prisma: PrismaService) { }

    async create(businessId: string, clientId: string, data: CreatePrescriptionDto) {
        // Ensure client exists and belongs to the business
        const clientLink = await this.prisma.user.findFirst({
            where: { id: clientId }
        });

        if (!clientLink) {
            throw new NotFoundException('Client not found');
        }

        const medicalRecord = await this.prisma.medicalRecord.findUnique({
            where: { businessId_clientId: { businessId, clientId } }
        });

        return this.prisma.prescription.create({
            data: {
                businessId,
                clientId,
                medicalRecordId: medicalRecord?.id || null,
                diagnosis: data.diagnosis,
                notes: data.notes,
                doctorName: data.doctorName,
                items: {
                    create: data.items.map(item => ({
                        medicationName: item.medicationName,
                        dosage: item.dosage,
                        frequency: item.frequency,
                        duration: item.duration,
                        notes: item.notes
                    }))
                }
            },
            include: {
                items: true
            }
        });
    }

    async findAll(businessId: string, clientId: string) {
        return this.prisma.prescription.findMany({
            where: { businessId, clientId },
            orderBy: { createdAt: 'desc' },
            include: {
                items: true
            }
        });
    }

    async findOne(businessId: string, id: string) {
        const prescription = await this.prisma.prescription.findFirst({
            where: { id, businessId },
            include: {
                items: true,
                client: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                business: {
                    select: {
                        name: true,
                        logoUrl: true,
                        phone: true,
                        email: true,
                        address: true
                    }
                }
            }
        });

        if (!prescription) {
            throw new NotFoundException('Prescription not found');
        }

        return prescription;
    }
}
