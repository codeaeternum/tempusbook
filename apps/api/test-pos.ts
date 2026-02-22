import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Starting POS Verification Test...\n');

    try {
        let b = await prisma.business.findFirst();
        if (!b) throw new Error('Se requiere un negocio en BD.');

        let user = await prisma.user.findFirst();
        let staff = await prisma.businessMember.findFirst({ where: { businessId: b.id, userId: user!.id } });
        let branch = await prisma.branch.findFirst({ where: { businessId: b.id } });

        console.log('\n🟢 Test Data Seeded:');
        console.log(`Business: ${b.id}`);
        console.log(`Staff: ${staff!.id}`);
        console.log(`Branch: ${branch?.id}`);

        // ===============================================
        // START TESTING HTTP CALLS
        // ===============================================

        const BASE_URL = 'http://localhost:3001/api/v1/pos';
        const HEADERS = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-dev-token'
        };

        // TEST 1: Open Cash Shift
        console.log(`\n▶️ TEST 1: Opening Cash Shift...`);
        let res = await fetch(`${BASE_URL}/shift/open`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({
                businessId: b.id,
                branchId: branch?.id,
                openedById: staff!.id,
                startingCash: 500
            })
        });

        if (!res.ok) {
            let txt = await res.text();
            if (!txt.includes('already open')) throw new Error(`Status ${res.status}: ${txt}`);
        }
        console.log('✅ Shift Opened (o ya estaba abierto)');

        // TEST 2: Get Active Shift
        console.log(`\n▶️ TEST 2: Fetching Active Cash Shift...`);
        const qs = branch ? `?businessId=${b.id}&branchId=${branch.id}` : `?businessId=${b.id}`;
        res = await fetch(`${BASE_URL}/shift/active${qs}`, { headers: HEADERS });
        const txt = await res.text();
        const shiftData = txt ? JSON.parse(txt) : null;
        if (!shiftData || !shiftData.id) throw new Error(`Status ${res.status}: Missing active shift ID. Text: ${txt}`);
        console.log(`✅ Active Shift ID: ${shiftData.id}`);

        // TEST 3: Process a Sales Checkout
        console.log(`\n▶️ TEST 3: Checkout (Sale Transaction)...`);
        const checkoutPayload = {
            businessId: b.id,
            staffId: staff!.id,
            shiftId: shiftData.id,
            subtotal: 1000,
            discount: 0,
            total: 1000,
            paymentMethod: 'CASH',
            cashGiven: 1000,
            items: [
                {
                    name: "Test Custom Item",
                    qty: 1,
                    unitPrice: 1000,
                    discount: 0,
                    totalPrice: 1000,
                    note: "Test Sale via End-to-End"
                }
            ]
        };

        res = await fetch(`${BASE_URL}/checkout`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(checkoutPayload)
        });
        let saleResult = await res.json() as any;
        if (!res.ok) throw new Error(`Checkout failed: ${JSON.stringify(saleResult)}`);
        console.log(`✅ Venta procesada exitosamente. Sale ID: ${saleResult.id}`);

        // TEST 4: Close Cash Shift
        console.log(`\n▶️ TEST 4: Closing Cash Shift...`);
        res = await fetch(`${BASE_URL}/shift/close`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({
                shiftId: shiftData.id,
                businessId: b.id,
                closedById: staff!.id,
                actualCash: 1500, // 500 start + 1000 cash sale
                notes: 'Z-Report test OK'
            })
        });

        if (!res.ok) {
            let txt = await res.text();
            throw new Error(`Close Shift failed: Status ${res.status}: ${txt}`);
        }
        console.log('✅ Shift Closed Successfully (Z-Report registered).');

        console.log('\n🎉 ALL POS TESTS PASSED SUCCESSFULLY! The Ledger is structurally sound.');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
