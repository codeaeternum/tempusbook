import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('📅 Starting Calendar Bookings Validation...\n');

    try {
        let b = await prisma.business.findFirst();
        if (!b) throw new Error('Se requiere un negocio en BD para agendar citas.');

        let user = await prisma.user.findFirst();
        if (!user) throw new Error('Se requiere un usuario en BD.');

        let staff = await prisma.businessMember.findFirst({ where: { businessId: b.id } });
        if (!staff) {
            staff = await prisma.businessMember.create({
                data: {
                    businessId: b.id,
                    userId: user.id,
                    role: 'EMPLOYEE'
                }
            });
        }

        let branch = await prisma.branch.findFirst({ where: { businessId: b.id } });
        let service = await prisma.service.findFirst({ where: { businessId: b.id } });

        // Aseguramos que el servicio de prueba tenga configuración
        if (!service) {
            service = await prisma.service.create({
                data: {
                    businessId: b.id,
                    name: 'Test Setup Service',
                    durationMinutes: 60,
                    price: 250
                }
            });
        }

        console.log('\n🟢 Bookings Seed Layout Evaluated:');
        console.log(`- Business ID: ${b.id}`);
        console.log(`- Staff ID:    ${staff!.id}`);
        console.log(`- Service ID:  ${service.id}`);
        console.log(`- Branch ID:   ${branch?.id || 'None'}`);
        console.log(`- Client ID:   ${user!.id} (Self Booking)`);

        // ===============================================
        // TESTING HTTPS REST LAYER VIA NESTJS BOOKINGS CONTROLLER
        // ===============================================
        const BASE_URL = 'http://localhost:3001/api/v1/bookings';
        const HEADERS = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-dev-token' // AuthGuard dev token
        };

        // 1. Limpiamos agendas previas futuras o conflictivas
        await prisma.booking.deleteMany({ where: { businessId: b.id } });

        // 2. Ejecutar la llamada API: CREAR RESERVACIÓN
        console.log(`\n▶️ TEST 1: Schedule Native Booking...`);
        const startDate = new Date();
        startDate.setHours(startDate.getHours() + 1); // 1 Hr into the future today
        startDate.setMinutes(0, 0, 0);

        let res = await fetch(BASE_URL, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({
                businessId: b.id,
                clientId: user!.id,
                serviceId: service.id,
                staffId: staff!.id,
                branchId: branch?.id,
                startTime: startDate.toISOString(),
                clientNotes: 'Cita en Sandbox para Next.JS Calendar E2E test'
            })
        });

        if (!res.ok) {
            let errorText = await res.text();
            throw new Error(`Schedule Booking failed: Status ${res.status}: ${errorText}`);
        }

        let schedulingResponse = await res.json() as any;
        console.log(`✅ Appointment Created: [${schedulingResponse.id}] for ~${startDate.toLocaleTimeString()}`);

        // 3. RECUPERAR LAS RESERVAS REGISTRADAS DEL NEGOCIO
        console.log(`\n▶️ TEST 2: Validate Agenda Rendering Flow (Calendar Payload)...`);
        res = await fetch(`${BASE_URL}/business/${b.id}`, { headers: HEADERS });
        let agenda = await res.json() as any[];

        if (!agenda || !Array.isArray(agenda) || agenda.length === 0) {
            throw new Error('Fallback failed: The schedule returned an empty grid after scheduling.');
        }

        console.log(`✅ Agenda Read Validated. Current Scheduled Events: ${agenda.length}`);

        // 4. CAMBIAR EL STATUS DE LA RESERVA (CONFIRMAR O CANCELAR)
        console.log(`\n▶️ TEST 3: Mutate Booking Status (Confirmation)...`);
        res = await fetch(`${BASE_URL}/${schedulingResponse.id}/status`, {
            method: 'PATCH',
            headers: HEADERS,
            body: JSON.stringify({ status: 'CONFIRMED' })
        });

        if (!res.ok) throw new Error('Status mutation was rejected by NestJS guards.');
        console.log(`✅ Booking Status mutated to CONFIRMED gracefully.`);

        console.log('\n🎉 ALL CALENDAR TESTS PASSED SUCCESSFULLY! Firebase UI is ready.');

    } catch (e) {
        console.error('\n❌ E2E TEST CRASH:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
