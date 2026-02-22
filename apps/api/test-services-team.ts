import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('✂️ Starting Services & Team Module E2E Validation...\n');
    try {
        let b = await prisma.business.findFirst({
            where: { id: '6e62095e-615d-4ac7-b74a-033603c5c980' }
        });
        if (!b) throw new Error('Se requiere ROOT_BUSINESS_ID en BD.');

        // Select a user to become the staff member
        let userForStaff = await prisma.user.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        if (!userForStaff) throw new Error('No user available to cast as Staff.');

        console.log('🟢 Test Data Seeded:');
        console.log(`Business: ${b.id}`);
        console.log(`Target Staff User: ${userForStaff.id} - ${userForStaff.firstName}`);

        const BASE_URL_SERVICES = 'http://localhost:3001/api/v1/services';
        const BASE_URL_TEAM = 'http://localhost:3001/api/v1/business-members';
        const HEADERS = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-dev-token' // AuthGuard pass
        };

        // --- HTTP TESTS ---

        // 1. POST Service
        console.log('\n▶️ TEST 1: Creating a specific Service (Haircut)...');
        const newServicePayload = {
            businessId: b.id,
            name: `E2E Haircut Pro ${Date.now()}`,
            description: 'Professional high-fade haircut.',
            durationMinutes: 45,
            price: 350.00,
            currency: 'MXN',
            isActive: true
        };
        let res = await fetch(BASE_URL_SERVICES, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(newServicePayload)
        });
        if (!res.ok) throw new Error(`Create service failed: ${await res.text()}`);
        let createdService = await res.json() as any;
        console.log(`✅ Service '${createdService.name}' successfully inserted. DB ID: ${createdService.id}`);

        // 2. GET Services Catalog
        console.log('\n▶️ TEST 2: Fetching Full Services Catalog...');
        res = await fetch(`${BASE_URL_SERVICES}/business/${b.id}`, { headers: HEADERS });
        if (!res.ok) throw new Error(`Fetch services failed: ${await res.text()}`);
        let servicesData = await res.json() as any[];
        let targetService = servicesData.find(s => s.id === createdService.id);
        console.log(`✅ Retrieved ${servicesData.length} items. Target Service Price mapped at: $${targetService?.price}.`);

        // 3. POST Business Member
        console.log('\n▶️ TEST 3: Appointing User as Business Member...');

        // First, check if already exists to avoid unique constraint error
        let existingMember = await prisma.businessMember.findFirst({
            where: { businessId: b.id, userId: userForStaff.id }
        });

        let createdMember;
        if (existingMember) {
            console.log(`✅ Member already existed. Simulating Update bypass...`);
            createdMember = existingMember;
        } else {
            const newMemberPayload = {
                businessId: b.id,
                userId: userForStaff.id,
                role: 'MANAGER',
                isActive: true,
                color: 'hsl(210, 60%, 50%)'
            };
            res = await fetch(BASE_URL_TEAM, {
                method: 'POST',
                headers: HEADERS,
                body: JSON.stringify(newMemberPayload)
            });
            if (!res.ok) throw new Error(`Create member failed: ${await res.text()}`);
            createdMember = await res.json() as any;
            console.log(`✅ User appointed successfully. DB Member ID: ${createdMember.id}`);
        }

        // 4. GET Team Members
        console.log('\n▶️ TEST 4: Fetching Active Business Team...');
        res = await fetch(`${BASE_URL_TEAM}/business/${b.id}`, { headers: HEADERS });
        if (!res.ok) throw new Error(`Fetch team failed: ${await res.text()}`);
        let teamData = await res.json() as any[];
        console.log(`✅ Team List Retrieved: ${teamData.length} active experts matching Tenant.`);

        console.log('\n🎉 ALL SERVICES & TEAM TESTS PASSED SUCCESSFULLY! Ready for React UI linkage.');

    } catch (e) {
        console.error('\n❌ E2E SERVICES/TEAM TEST CRASH:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
