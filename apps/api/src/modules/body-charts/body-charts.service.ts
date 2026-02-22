import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface BodyMarker {
    id: string;
    x: number;
    y: number;
    side: 'front' | 'back';
    label: string;
    severity: number;
    notes?: string;
}

export interface UpsertBodyChartDto {
    markers: BodyMarker[];
    notes?: string;
}

@Injectable()
export class BodyChartsService {
    constructor(private prisma: PrismaService) { }

    async getBodyChart(businessId: string, clientId: string) {
        let chart = await this.prisma.bodyChart.findFirst({
            where: { businessId, clientId },
            orderBy: { createdAt: 'desc' }
        });

        if (!chart) {
            return {
                businessId,
                clientId,
                markers: [],
                notes: ''
            };
        }

        return chart;
    }

    async upsertBodyChart(businessId: string, clientId: string, data: UpsertBodyChartDto) {
        // Validation check
        const clientLink = await this.prisma.user.findFirst({
            where: { id: clientId }
        });

        if (!clientLink) {
            throw new NotFoundException('Client not found');
        }

        const medicalRecord = await this.prisma.medicalRecord.findUnique({
            where: { businessId_clientId: { businessId, clientId } }
        });

        const existingChart = await this.prisma.bodyChart.findFirst({
            where: { businessId, clientId },
            orderBy: { createdAt: 'desc' }
        });

        if (existingChart) {
            return this.prisma.bodyChart.update({
                where: { id: existingChart.id },
                data: {
                    markers: data.markers as unknown as Prisma.InputJsonValue,
                    notes: data.notes !== undefined ? data.notes : existingChart.notes
                }
            });
        }

        return this.prisma.bodyChart.create({
            data: {
                businessId,
                clientId,
                medicalRecordId: medicalRecord?.id || null,
                markers: data.markers as unknown as Prisma.InputJsonValue,
                notes: data.notes
            }
        });
    }
}
