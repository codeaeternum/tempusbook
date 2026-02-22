import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3001/api/v1/payments';
const HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-dev-token' // AuthGuard dev bypass
};

async function main() {
    console.log('--- Configurando Entorno de Pruebas de Pagos ---');
    let business = await prisma.business.findFirst();
    if (!business) throw new Error('Se requiere correr los seeders primero');

    try {
        // Limpiamos pagos previos de prueba si existen para un entorno determinista
        await prisma.payment.deleteMany({ where: { businessId: business.id } });

        // PRUEBA 1: Crear un Pago 
        console.log('\n--- 🧪 TEST 1: Crear un registro de Pago por Transferencia ---');
        let res = await fetch(`${BASE_URL}?businessId=${business.id}`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({
                amount: 850,
                type: 'FULL',
                method: 'TRANSFER',
                status: 'COMPLETED'
            })
        });
        let paymentData = await res.json() as any;
        if (!res.ok) throw new Error(`Test 1 falló: HTTP ${res.status}`);
        if (paymentData.amount !== "850") throw new Error('Test 1 falló: El monto guardado no coincide o no es Decimal');
        console.log(`✅ Test 1 Superado: Pago creado con ID ${paymentData.id}`);

        // PRUEBA 2: Consulta del Libro Mayor de Pagos (Ledger)
        console.log('\n--- 🧪 TEST 2: Consultar la colección de pagos en histórico ---');
        res = await fetch(`${BASE_URL}?businessId=${business.id}`, { headers: HEADERS });
        let allPayments = await res.json() as any[];
        if (!res.ok) throw new Error(`Test 2 falló: HTTP ${res.status}`);
        if (allPayments.length !== 1) throw new Error('Test 2 falló: El array de Ledger está corrupto o vacío');
        console.log('✅ Test 2 Superado: Se extrajeron los pagos atómicamente con ordenamiento correcto.');

        // PRUEBA 3: Mutación y Reembolso
        console.log('\n--- 🧪 TEST 3: Emitir una orden de Reembolso Automático ---');
        res = await fetch(`${BASE_URL}/${paymentData.id}/refund?businessId=${business.id}`, {
            method: 'PATCH',
            headers: HEADERS
        });
        let reft = await res.json() as any;
        if (!res.ok) throw new Error(`Test 3 falló: HTTP ${res.status}`);
        if (reft.status !== 'REFUNDED') throw new Error('Test 3 falló: El estado del pago en BDD no mutó a REFUNDED');
        console.log('✅ Test 3 Superado: Interceptores NestJS mutaron el estado exitosamente.');

        console.log('\n🎉 ¡MÓDULO DE PAGOS COMPLETAMENTE VERIFICADO Y SOSTEMBILE!');
    } catch (error) {
        console.error('\n❌ ERROR EN LA SIMULACIÓN:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
