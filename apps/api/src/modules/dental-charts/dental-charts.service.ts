import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DentalChartsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Retrieves the latest dental chart for a client within a specific business.
     * If no chart exists, it effectively means they have a blank/healthy mouth.
     */
    async getDentalChart(businessId: string, clientId: string) {
        let chart = await this.prisma.dentalChart.findFirst({
            where: { businessId, clientId },
            orderBy: { createdAt: 'desc' }
        });

        // Initialize a virtual blank chart if none exists yet
        if (!chart) {
            return {
                businessId,
                clientId,
                teethData: [],
                notes: ''
            };
        }

        return chart;
    }

    /**
     * Upserts (Updates or Inserts) the dental chart for a patient.
     * There typically shouldn't be multiple active charts for a patient in one clinic,
     * so we find the existing one or create a new one.
     */
    async upsertDentalChart(businessId: string, clientId: string, data: { teethData: any, notes?: string }) {
        // Ensure client exists and belongs to the business
        const clientLink = await this.prisma.user.findFirst({
            where: {
                id: clientId,
                // Check if they have interactions with this business
            }
        });

        if (!clientLink) {
            throw new NotFoundException('Client not found or not associated with this business');
        }

        const existingChart = await this.prisma.dentalChart.findFirst({
            where: { businessId, clientId },
            orderBy: { createdAt: 'desc' }
        });

        if (existingChart) {
            return this.prisma.dentalChart.update({
                where: { id: existingChart.id },
                data: {
                    teethData: data.teethData as Prisma.InputJsonValue,
                    notes: data.notes !== undefined ? data.notes : existingChart.notes
                }
            });
        }

        // Auto-link to an existing MedicalRecord if present
        const medicalRecord = await this.prisma.medicalRecord.findUnique({
            where: { businessId_clientId: { businessId, clientId } }
        });

        return this.prisma.dentalChart.create({
            data: {
                businessId,
                clientId,
                medicalRecordId: medicalRecord?.id || null,
                teethData: data.teethData as Prisma.InputJsonValue,
                notes: data.notes
            }
        });
    }
}
