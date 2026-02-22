import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Starting Forms API Verification Test...\n');

    try {
        // 1. Clean up Previous Test Data via Relational cascading
        const oldCategory = await prisma.category.findUnique({ where: { slug: 'test-retail' } });
        if (oldCategory) {
            await prisma.business.deleteMany({ where: { categoryId: oldCategory.id } });
            await prisma.category.delete({ where: { id: oldCategory.id } });
        }
        await prisma.business.deleteMany({ where: { slug: 'forms-test' } }); // Fallback
        await prisma.user.deleteMany({ where: { email: 'forms-client@aeternasuite.com' } });

        console.log('🧹 Cleaned previous test data.');

        // 2. Create Dummy Data
        const category = await prisma.category.create({
            data: { name: 'Retail Test', slug: 'test-retail', icon: '🛒' },
        });

        const business = await prisma.business.create({
            data: { name: 'Forms Testing Business', slug: 'forms-test', categoryId: category.id },
        });

        const user = await prisma.user.create({
            data: { firstName: 'John', lastName: 'Doe', email: 'forms-client@aeternasuite.com', firebaseUid: 'forms-client-uid' },
        });

        console.log('\n🟢 Test Data Seeded:');
        console.log(`Business: ${business.id}`);

        const BASE_URL = 'http://localhost:3001/api/v1/forms';
        const HEADERS = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-dev-token'
        };

        // TEST 1: Retrieve Empty Forms
        console.log('\n--- 🧪 TEST 1: Retrieve Empty Forms ---');
        let res = await fetch(`${BASE_URL}?businessId=${business.id}`, { headers: HEADERS });
        let data = await res.json() as any;

        if (!res.ok) throw new Error(`Test 1 failed: HTTP ${res.status}`);
        if (!Array.isArray(data) || data.length !== 0) throw new Error('Test 1 failed: Expected empty array []');
        console.log('✅ Test 1 Passed: Empty array returned correctly.');

        // TEST 2: Create a Form Template
        console.log('\n--- 🧪 TEST 2: Create New Form Template ---');
        res = await fetch(`${BASE_URL}`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({
                businessId: business.id,
                name: 'Intake Questionnaire',
                description: 'Pre-service questions',
                category: 'registro',
                isActive: true,
                fields: [
                    { id: 'f1', label: 'Allergies', type: 'text', required: true }
                ]
            })
        });

        const newForm = await res.json() as any;
        if (!res.ok) throw new Error(`Test 2 failed: HTTP ${res.status} - ${JSON.stringify(newForm)}`);
        if (newForm.name !== 'Intake Questionnaire') throw new Error('Test 2 failed: Name mismatch');
        if (newForm.fields.length !== 1) throw new Error('Test 2 failed: Fields array not persisted properly');
        console.log('✅ Test 2 Passed: Form Template created with valid JSON Schema.');

        // TEST 3: Submit Form Response
        console.log('\n--- 🧪 TEST 3: Submit Client Form Response ---');
        res = await fetch(`${BASE_URL}/${newForm.id}/responses`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({
                businessId: business.id,
                clientId: user.id,
                responseData: {
                    'f1': 'Peanuts'
                }
            })
        });

        const newResponse = await res.json() as any;
        if (!res.ok) throw new Error(`Test 3 failed: HTTP ${res.status} - ${JSON.stringify(newResponse)}`);
        if (newResponse.responseData.f1 !== 'Peanuts') throw new Error('Test 3 failed: JSON Response lost details');
        console.log('✅ Test 3 Passed: Form response saved successfully.');

        // TEST 4: Get Aggregated Count
        console.log('\n--- 🧪 TEST 4: Verify Responses Count on Template ---');
        res = await fetch(`${BASE_URL}?businessId=${business.id}`, { headers: HEADERS });
        data = await res.json() as any;

        if (!res.ok) throw new Error(`Test 4 failed: HTTP ${res.status}`);
        if (data[0].responses !== 1) throw new Error(`Test 4 failed: Form Responses count aggregated wrong! Expected 1, got ${data[0].responses}`);
        console.log('✅ Test 4 Passed: Response correctly aggregated.');

        console.log('\n🎉 ALL FORMS END-TO-END TESTS PASSED SUCCESSFULLY! 🎉');
        process.exit(0);

    } catch (e) {
        console.error('\n❌ TEST FAILED:');
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
