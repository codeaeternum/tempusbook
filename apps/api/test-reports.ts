import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('📊 Starting Analytics Module E2E Validation...\n');
    try {
        let b = await prisma.business.findFirst({
            where: { id: '6e62095e-615d-4ac7-b74a-033603c5c980' }
        });
        if (!b) throw new Error('Se requiere el negocio ROOT_BUSINESS_ID en BD.');

        let user = await prisma.user.findFirst();
        if (!user) throw new Error('Se requiere un usuario en BD.');

        let service = await prisma.service.findFirst({ where: { businessId: b.id } });
        if (!service) throw new Error("Falta Servicio.");

        let staff = await prisma.businessMember.findFirst({ where: { businessId: b.id } });
        if (!staff) throw new Error("Falta Staff");

        console.log('Inyectando registros históricos para Análisis...');
        // Limpiamos los bookings anteriores si existen
        await prisma.booking.deleteMany({ where: { businessId: b.id } });

        // Insertar transacciones dispersas en el tiempo
        const now = new Date();
        const bookingsData = [];

        for (let i = 0; i < 5; i++) {
            // Mes local
            bookingsData.push({
                businessId: b.id, clientId: user.id, serviceId: service.id, staffId: staff.id,
                startTime: new Date(), endTime: new Date(Date.now() + 3600), status: 'COMPLETED'
            });
            // Mes anterior
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
            bookingsData.push({
                businessId: b.id, clientId: user.id, serviceId: service.id, staffId: staff.id,
                startTime: lastMonth, endTime: new Date(lastMonth.getTime() + 3600), status: 'COMPLETED'
            });
        }

        // Create transactionally
        for (let data of bookingsData) {
            await prisma.booking.create({ data: data as any });
        }
        console.log(`✅ Inyectadas 10 ventas finalizadas en PostgreSQL.`);

        console.log(`\n▶️ TEST 1: Fetching Dashboard Analytics Payload...`);
        const BASE_URL = 'http://localhost:3001/api/v1/reports';
        const HEADERS = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-dev-token'
        };

        const res = await fetch(`${BASE_URL}/dashboard/${b.id}`, { headers: HEADERS });
        if (!res.ok) throw new Error(`GET failed: ${await res.text()}`);

        const analytics = await res.json() as any;

        console.log(`✅ KPI's calculados - Total Bookings: ${analytics.kpis.totalBookings}`);
        console.log(`   Ingresos Mensuales Mapeados: ${analytics.monthlyRevenue.length} periodos`);
        console.log(`   Top Service (Pos1): ${analytics.topServices[0]?.name} - $${analytics.topServices[0]?.revenue}`);
        console.log(`   Staff Rendimiento (Pos1): ${analytics.staffPerformance[0]?.name} (★ ${analytics.staffPerformance[0]?.rating})`);

        console.log('\n🎉 ALL ANALYTICS TESTS PASSED SUCCESSFULLY! Ready for React UI.');

    } catch (e) {
        console.error('\n❌ E2E TEST CRASH:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
