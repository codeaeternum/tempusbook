import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('⭐ Starting Reviews Module E2E Validation...\n');
    try {
        let b = await prisma.business.findFirst({
            where: { id: '6e62095e-615d-4ac7-b74a-033603c5c980' }
        });
        if (!b) throw new Error('Se requiere un negocio en BD.');

        let user = await prisma.user.findFirst();
        if (!user) throw new Error('Se requiere un usuario en BD.');

        // Asegurarnos de tener un Booking para anclar el Review
        let service = await prisma.service.findFirst({ where: { businessId: b.id } });
        if (!service) {
            service = await prisma.service.create({
                data: { businessId: b.id, name: 'Servicio Raíz Test', durationMinutes: 60, price: 500 }
            });
        }

        let staff = await prisma.businessMember.findFirst({ where: { businessId: b.id } });
        if (!staff) {
            staff = await prisma.businessMember.create({
                data: { businessId: b.id, userId: user.id, role: 'EMPLOYEE' }
            });
        }

        let booking = await prisma.booking.findFirst({ where: { businessId: b.id, clientId: user.id } });
        if (!booking) {
            booking = await prisma.booking.create({
                data: {
                    businessId: b.id,
                    clientId: user.id,
                    serviceId: service.id,
                    staffId: staff.id,
                    startTime: new Date(),
                    endTime: new Date(Date.now() + 3600000), // +1 Hr
                    status: 'COMPLETED'
                }
            });
        }

        // 1. Limpiar reseñas previas para la prueba
        await prisma.review.deleteMany({ where: { businessId: b.id } });

        // 2. Sembrar una Reseña Orgánica directamente en BD (simulando App de Cliente)
        let review = await prisma.review.create({
            data: {
                businessId: b.id,
                clientId: user.id,
                bookingId: booking.id,
                rating: 5,
                comment: 'Excelente servicio E2E, muy recomendado!',
            }
        });
        console.log(`✅ Seeded Review [${review.id}] manually (simulating Client App Entry)`);

        // 3. Probar GET Endpoint
        console.log(`\n▶️ TEST 1: Fetching Reviews for Business...`);
        const BASE_URL = 'http://localhost:3001/api/v1/reviews';
        const HEADERS = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-dev-token'
        };

        let res = await fetch(`${BASE_URL}/business/${b.id}`, { headers: HEADERS });
        if (!res.ok) throw new Error(`GET failed: ${await res.text()}`);

        let reviewsList = await res.json() as any[];
        if (reviewsList.length === 0) throw new Error('GET returned empty array');
        console.log(`✅ Fetched ${reviewsList.length} reviews from API. Found rating: ${reviewsList[0].rating}★`);
        console.log(`   Nested Included data: Client (${reviewsList[0].client.firstName}), Service (${reviewsList[0].booking?.service?.name})`);

        // 4. Probar PATCH Endpoint (Responder)
        console.log(`\n▶️ TEST 2: Replying to Review...`);
        res = await fetch(`${BASE_URL}/${review.id}/reply`, {
            method: 'PATCH',
            headers: HEADERS,
            body: JSON.stringify({ reply: 'Muchas gracias por tu reseña automatizada E2E!' })
        });

        if (!res.ok) throw new Error(`PATCH failed: ${await res.text()}`);
        let updatedReview = await res.json() as any;
        console.log(`✅ Replied successfully! Reply logged at: ${updatedReview.repliedAt}`);

        console.log('\n🎉 ALL REVIEWS TESTS PASSED SUCCESSFULLY! API is ready.');

    } catch (e) {
        console.error('\n❌ E2E TEST CRASH:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
