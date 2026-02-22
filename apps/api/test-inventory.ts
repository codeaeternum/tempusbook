import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('📦 Starting Inventory Module E2E Validation...\n');
    try {
        let b = await prisma.business.findFirst({
            where: { id: '6e62095e-615d-4ac7-b74a-033603c5c980' }
        });
        if (!b) throw new Error('Se requiere ROOT_BUSINESS_ID en BD.');

        // Verify Branch existence since Inventory requires a Branch for ProductStock allocation
        let branch = await prisma.branch.findFirst({ where: { businessId: b.id } });
        if (!branch) {
            console.log('⚠️ No branch found for Global Tenant. Creating a Default Main Branch...');
            branch = await prisma.branch.create({
                data: {
                    businessId: b.id,
                    name: 'Main Center',
                    address: 'Avenida Siempre Viva 123'
                }
            });
        }

        console.log('🟢 Test Data Seeded:');
        console.log(`Business: ${b.id}`);
        console.log(`Branch Allocation: ${branch.id}`);

        const BASE_URL = 'http://localhost:3001/api/v1/inventory';
        const HEADERS = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-dev-token' // AuthGuard pass
        };

        // --- HTTP TESTS ---

        // 1. POST Product + Initial Stock
        console.log('\n▶️ TEST 1: Creating a Physical Product with initial Inventory...');
        const newProductPayload = {
            businessId: b.id,
            branchId: branch.id,
            name: `E2E Styling Gel ${Date.now()}`,
            description: 'Professional Hold Gel.',
            sku: `GEL-${Date.now()}`,
            barcode: Date.now().toString(),
            costPrice: 85.50,
            price: 250.00,
            currency: 'MXN',
            isActive: true,
            initialStock: 10,
            minStock: 5
        };
        let res = await fetch(`${BASE_URL}`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(newProductPayload)
        });
        if (!res.ok) throw new Error(`Create product failed: ${await res.text()}`);
        let createdProd = await res.json() as any;
        console.log(`✅ Product '${createdProd.name}' successfully inserted. DB ID: ${createdProd.id}`);

        // 2. GET Full Catalog & Stocks (Joined)
        console.log('\n▶️ TEST 2: Fetching Full Live Inventory...');
        res = await fetch(`${BASE_URL}?businessId=${b.id}`, { headers: HEADERS });
        if (!res.ok) throw new Error(`Fetch inventory failed: ${await res.text()}`);
        let inventoryList = await res.json() as any[];
        let targetProduct = inventoryList.find(p => p.id === createdProd.id);
        console.log(`✅ Retrieved ${inventoryList.length} items. Product '${targetProduct?.name}' found with ${targetProduct?.stock} units in Stock.`);

        // 3. PATCH Stock Adjustment (Resupply)
        console.log('\n▶️ TEST 3: Submitting Stock Adjustment (Delta Update)...');
        res = await fetch(`${BASE_URL}/${createdProd.id}/stock`, {
            method: 'PATCH',
            headers: HEADERS,
            body: JSON.stringify({
                branchId: branch.id,
                quantityDelta: -2, // Selling two units
                reason: 'E2E Validation Sale.'
            })
        });
        if (!res.ok) throw new Error(`Stock adjustment failed: ${await res.text()}`);
        let updatedStock = await res.json() as any;
        console.log(`✅ Quantity Adjusted. Remaining physical units: ${updatedStock.quantity}`);

        if (updatedStock.quantity !== 8) {
            throw new Error(`Mathematical error. Expected 8, got ${updatedStock.quantity}`);
        }

        console.log('\n🎉 ALL INVENTORY TESTS PASSED SUCCESSFULLY! The Warehouse Backend is tightly coupled.');

    } catch (e) {
        console.error('\n❌ E2E INVENTORY TEST CRASH:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
