import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BookingsService {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        businessId: string;
        clientId: string;
        serviceId: string;
        staffId?: string;
        branchId?: string;
        startTime: Date;
        clientNotes?: string;
        intakeFormData?: Record<string, unknown>;
    }) {
        // Get service to calculate end time
        const service = await this.prisma.service.findUnique({
            where: { id: data.serviceId },
        });
        if (!service) throw new NotFoundException('Service not found');

        const startTime = new Date(data.startTime);
        const endTime = new Date(
            startTime.getTime() + service.durationMinutes * 60 * 1000,
        );

        // Check for conflicts
        const existing = await this.prisma.booking.findFirst({
            where: {
                businessId: data.businessId,
                staffId: data.staffId || undefined,
                status: { in: ['PENDING', 'CONFIRMED'] },
                startTime: { lt: endTime },
                endTime: { gt: startTime },
            },
        });

        if (existing) {
            throw new BadRequestException('Time slot not available');
        }

        return this.prisma.booking.create({
            data: {
                ...data,
                startTime,
                endTime,
                status: 'PENDING',
            },
            include: {
                service: true,
                business: true,
            },
        });
    }

    async findByBusiness(
        businessId: string,
        params: { date?: string; staffId?: string; status?: string },
    ) {
        const where: any = { businessId };

        if (params.date) {
            const start = new Date(params.date);
            const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
            where.startTime = { gte: start, lt: end };
        }

        if (params.staffId) where.staffId = params.staffId;
        if (params.status) where.status = params.status;

        return this.prisma.booking.findMany({
            where,
            include: {
                service: true,
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        avatarUrl: true,
                    },
                },
                staff: {
                    include: {
                        user: {
                            select: { firstName: true, lastName: true },
                        },
                    },
                },
            },
            orderBy: { startTime: 'asc' },
        });
    }

    async findByClient(clientId: string, upcoming: boolean = true) {
        const where: any = { clientId };

        if (upcoming) {
            where.startTime = { gte: new Date() };
            where.status = { in: ['PENDING', 'CONFIRMED'] };
        }

        return this.prisma.booking.findMany({
            where,
            include: {
                service: true,
                business: { select: { id: true, name: true, slug: true, logoUrl: true } },
            },
            orderBy: { startTime: upcoming ? 'asc' : 'desc' },
            take: 50,
        });
    }

    async updateStatus(id: string, status: string, reason?: string) {
        const booking = await this.prisma.booking.findUnique({ where: { id } });
        if (!booking) throw new NotFoundException('Booking not found');

        const updateData: any = { status };

        if (status === 'CANCELLED') {
            updateData.cancelledAt = new Date();
            updateData.cancelReason = reason;
        }

        return this.prisma.booking.update({
            where: { id },
            data: updateData,
        });
    }

    async reschedule(id: string, newStartTime: Date) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            include: { service: true, business: true },
        });

        if (!booking) throw new NotFoundException('Booking not found');

        // Check reschedule limit from business settings
        const settings = booking.business.settings as any;
        const maxReschedules = settings?.maxReschedules ?? 2;

        if (booking.rescheduleCount >= maxReschedules) {
            throw new BadRequestException(
                `Maximum reschedules (${maxReschedules}) reached`,
            );
        }

        const startTime = new Date(newStartTime);
        const endTime = new Date(
            startTime.getTime() + booking.service.durationMinutes * 60 * 1000,
        );

        // Check availability
        const conflict = await this.prisma.booking.findFirst({
            where: {
                id: { not: id },
                businessId: booking.businessId,
                staffId: booking.staffId || undefined,
                status: { in: ['PENDING', 'CONFIRMED'] },
                startTime: { lt: endTime },
                endTime: { gt: startTime },
            },
        });

        if (conflict) {
            throw new BadRequestException('New time slot not available');
        }

        return this.prisma.booking.update({
            where: { id },
            data: {
                startTime,
                endTime,
                rescheduleCount: { increment: 1 },
            },
        });
    }
}
