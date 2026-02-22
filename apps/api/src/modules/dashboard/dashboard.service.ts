import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats(businessId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // 1. Ingresos Hoy (Sum of completed payments today)
        const todayPayments = await this.prisma.payment.aggregate({
            where: {
                businessId,
                status: 'COMPLETED',
                createdAt: { gte: today, lt: tomorrow }
            },
            _sum: { amount: true }
        });
        const revenueToday = Number(todayPayments._sum.amount || 0);

        // 2. Citas Hoy
        const bookingsCount = await this.prisma.booking.count({
            where: {
                businessId,
                startTime: { gte: today, lt: tomorrow },
                status: { notIn: ['CANCELLED', 'NO_SHOW'] }
            }
        });

        // 3. Clientes Nuevos este Mes
        const newClients = await this.prisma.user.count({
            where: {
                // Actually Client is global User. We use BusinessMember or we count bookings.
                // Since this is B2B, the true way is counting unique clients with first booking this month or created this month.
                // Let's approximate by counting bookings from users who had their first booking this month.
                // As a placeholder let's query the User model joined with Bookings
                bookings: { some: { businessId, createdAt: { gte: firstDayOfMonth } } }
            }
        });

        // 4. Ticket Promedio (All time o This month, using this month payments)
        const thisMonthPayments = await this.prisma.payment.aggregate({
            where: { businessId, status: 'COMPLETED', createdAt: { gte: firstDayOfMonth } },
            _sum: { amount: true },
            _count: { id: true }
        });

        const totalRev = Number(thisMonthPayments._sum.amount || 0);
        const totalCount = thisMonthPayments._count.id || 1; // prevent div by zero
        const avgTicket = totalCount > 0 && totalRev > 0 ? totalRev / totalCount : 0;

        return {
            revenueToday,
            bookingsCount,
            newClients,
            avgTicket
        };
    }

    async getUpcomingBookings(businessId: string) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        return this.prisma.booking.findMany({
            where: {
                businessId,
                startTime: { gte: startOfDay, lte: endOfDay },
                status: { notIn: ['CANCELLED'] }
            },
            include: {
                client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                service: { select: { id: true, name: true, durationMinutes: true, price: true } },
                staff: { include: { user: { select: { firstName: true, lastName: true } } } }
            },
            orderBy: { startTime: 'asc' },
            take: 50
        });
    }

    async getRecentActivity(businessId: string) {
        // Return recent payments, new bookings, reviews, etc.
        // For simplicity, let's just query latest bookings and payments from the AuditLog if exists, 
        // or just bookings for now.
        const bookings = await this.prisma.booking.findMany({
            where: { businessId },
            include: { service: true, client: true },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        const payments = await this.prisma.payment.findMany({
            where: { businessId },
            include: { booking: { include: { client: true, service: true } } },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        const activity: any[] = [];
        bookings.forEach(b => {
            activity.push({
                type: 'booking',
                text: `${b.client?.firstName || 'Cliente'} agendó ${b.service?.name}`,
                time: b.createdAt,
                icon: '📅'
            });
        });

        payments.forEach(p => {
            activity.push({
                type: 'payment',
                text: `${p.booking?.client?.firstName || 'Cliente'} pagó $${p.amount} — ${p.booking?.service?.name || 'Servicio'}`,
                time: p.createdAt,
                icon: '💰'
            });
        });

        // Sort by time desc
        activity.sort((a, b) => b.time.getTime() - a.time.getTime());

        return activity.slice(0, 8);
    }

    async getTopServices(businessId: string) {
        // Find most booked services this month
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const bookingsItem = await this.prisma.booking.groupBy({
            by: ['serviceId'],
            where: { businessId, createdAt: { gte: firstDayOfMonth }, status: { notIn: ['CANCELLED'] } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5
        });

        if (!bookingsItem.length) return [];

        const maxCount = bookingsItem[0]._count.id;

        const services = await this.prisma.service.findMany({
            where: { id: { in: bookingsItem.map(b => b.serviceId) } }
        });

        return bookingsItem.map(b => {
            const svc = services.find(s => s.id === b.serviceId);
            return {
                name: svc?.name || 'Servicio Desconocido',
                count: b._count.id,
                revenue: b._count.id * Number(svc?.price || 0),
                pct: Math.round((b._count.id / maxCount) * 100)
            };
        });
    }
}
