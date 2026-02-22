import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { startOfDay, endOfDay, subDays } from 'date-fns';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async getDashboardMetrics(businessId: string) {
        // Obtenemos bookings del mes actual o todos (COMPLETED vs ALL)
        const allBookings = await this.prisma.booking.findMany({
            where: { businessId },
            include: {
                service: true,
                staff: { include: { user: true } },
                client: true,
                review: true
            },
            orderBy: { startTime: 'desc' }
        });

        const completedBookings = allBookings.filter(b => b.status === 'COMPLETED');

        // 1. KPIs
        const totalBookings = completedBookings.length;
        const totalRevenue = completedBookings.reduce((acc, b) => acc + (Number(b.service?.price || 0)), 0);
        const avgTicket = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

        // Nuevos clientes (Clientes cuya primera reserva fue en los últimos 30 días)
        const thirtyDaysAgo = subDays(new Date(), 30);
        const clientsSeen = new Set<string>();
        let newClients = 0;
        [...completedBookings].reverse().forEach(b => {
            if (b.clientId && !clientsSeen.has(b.clientId)) {
                clientsSeen.add(b.clientId);
                if (b.startTime >= thirtyDaysAgo) newClients++;
            }
        });

        const growth = totalBookings > 0 ? 15 : 0; // Mock until MoM is built
        const occupancy = totalBookings > 0 ? 72 : 0;

        // 2. Citas de Hoy
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        const todayAppointments = allBookings
            .filter(b => b.startTime >= todayStart && b.startTime <= todayEnd)
            .map(b => ({
                id: b.id,
                time: b.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                client: b.client ? `${b.client.firstName} ${b.client.lastName}` : 'Cliente Anónimo',
                service: b.service?.name || 'Servicio General',
                status: b.status.toLowerCase(),
                avatar: b.client?.avatarUrl || '👤',
                amount: Number(b.service?.price || 0)
            }))
            .sort((a, b) => a.time.localeCompare(b.time));

        // 3. Ranking de Servicios Top
        const serviceMap = new Map<string, { count: number, revenue: number }>();
        completedBookings.forEach(b => {
            if (!b.service) return;
            const name = b.service.name;
            const price = Number(b.service.price || 0);
            if (!serviceMap.has(name)) serviceMap.set(name, { count: 0, revenue: 0 });
            const s = serviceMap.get(name)!;
            s.count += 1;
            s.revenue += price;
        });

        // Compute percentages
        let maxRevenue = 0;
        serviceMap.forEach(s => { if (s.revenue > maxRevenue) maxRevenue = s.revenue; });

        const topServices = Array.from(serviceMap.entries())
            .map(([name, stats]) => ({
                name,
                count: stats.count,
                revenue: stats.revenue,
                pct: maxRevenue > 0 ? Math.round((stats.revenue / maxRevenue) * 100) : 0
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // 4. Actividad Reciente (Feed)
        const recentActivity = allBookings.slice(0, 6).map(b => {
            const clientName = b.client ? `${b.client.firstName} ${b.client.lastName}` : 'Alguien';

            if (b.status === 'COMPLETED') {
                return { icon: '💰', text: `${clientName} pagó $${Number(b.service?.price || 0)} — ${b.service?.name}`, time: b.startTime.toISOString(), type: 'payment' };
            } else if (b.status === 'PENDING' || b.status === 'CONFIRMED') {
                return { icon: '📅', text: `${clientName} agendó cita para ${b.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, time: b.createdAt.toISOString(), type: 'booking' };
            } else if (b.status === 'NO_SHOW') {
                return { icon: '👻', text: `${clientName} No llegó a su cita`, time: b.startTime.toISOString(), type: 'alert' };
            }
            return { icon: 'ℹ️', text: `Actualización de ${clientName}`, time: b.updatedAt.toISOString(), type: 'info' };
        });

        return {
            kpis: { totalRevenue, totalBookings, avgTicket, growth, occupancy, newClients },
            todayAppointments,
            topServices,
            recentActivity
        };
    }
}
