import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚙 [Automotive E2E] Iniciando Test de Flujo B2C...');

    // 0. Encontrar Negocio Real
    let business = await prisma.business.findFirst();
    if (!business) {
        throw new Error('No hay negocios registrados en la DB local.');
    }
    const ROOT_BUSINESS_ID = business.id;

    // 1. Encontrar o Crear Cliente Temp
    let client = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
    if (!client) {
        client = await prisma.user.create({
            data: {
                id: 'e2e-auto-client-' + Date.now(),
                firstName: 'Max',
                lastName: 'Verstappen',
                email: 'maxv@redbull.com',
                phone: '525555555555',
                role: 'CLIENT',
                firebaseUid: 'mock-fb-auto-client-' + Date.now()
            }
        });
    }

    // 2. Crear un Vehículo
    const vehicle = await prisma.vehicle.create({
        data: {
            businessId: ROOT_BUSINESS_ID,
            clientId: client.id,
            vin: 'WBA00000X12345ZZZ',
            make: 'Porsche',
            model: '911 GT3',
            year: 2022,
            licensePlate: 'RBR-01'
        }
    });

    const magicTokenId = `porsche-magic-${Date.now()}`;

    // 3. Crear Cotización
    const quotation = await prisma.quotation.create({
        data: {
            businessId: ROOT_BUSINESS_ID,
            clientId: client.id,
            vehicleId: vehicle.id,
            totalAmount: 18500.0,
            magicLink: magicTokenId,
            items: [
                { name: 'Aceite Sintético Mobil 1', quantity: 8, price: 350 },
                { name: 'Filtro de Aceite OEM', quantity: 1, price: 1200 },
                { name: 'Mano de Obra (Service A)', quantity: 1, price: 4500 },
                { name: 'Balatas Traseras Brembo', quantity: 1, price: 10000 }
            ],
            notes: 'Servicio Programado. El cobro por revisión no es reembolsable.'
        }
    });

    console.log('\n✅ ¡Flujo AeternaSuite Mechanic Generado!');
    console.log(`👤 Cliente: ${client.firstName} ${client.lastName}`);
    console.log(`🚗 Auto: ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`);
    console.log(`\n🔗 [B2C MAGIC LINK GENERADO] 👉 http://localhost:3000/q/${magicTokenId}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
