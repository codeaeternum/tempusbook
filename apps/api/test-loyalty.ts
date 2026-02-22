import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('💎 Starting Loyalty Module E2E Validation...\n');
    try {
        let b = await prisma.business.findFirst({
            where: { id: '6e62095e-615d-4ac7-b74a-033603c5c980' }
        });
        if (!b) throw new Error('Se requiere negocio.');

        let user = await prisma.user.findFirst();
        if (!user) throw new Error('Se requiere usuario.');

        console.log('🟢 Test Data Seeded:');
        console.log(`Business: ${b.id}`);
        console.log(`User/Client: ${user.id}`);

        const BASE_URL = 'http://localhost:3001/api/v1/loyalty';
        const HEADERS = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-dev-token' // AuthGuard pass
        };

        // 1. Create a Loyalty Program natively if missing
        let program = await prisma.loyaltyProgram.findFirst({ where: { businessId: b.id } });
        if (!program) {
            program = await prisma.loyaltyProgram.create({
                data: {
                    businessId: b.id,
                    name: 'Test Setup Points',
                    type: 'POINTS',
                    config: { pointsPerPeso: 1 } as any,
                    enabled: true,
                    icon: '🌟'
                }
            });
        }

        // 2. Add points to user creating a LoyaltyCard manually
        let card = await prisma.loyaltyCard.findFirst({ where: { clientId: user.id, loyaltyProgramId: program.id } });
        if (!card) {
            card = await prisma.loyaltyCard.create({
                data: {
                    clientId: user.id,
                    loyaltyProgramId: program.id,
                    tier: 'ORO',
                    points: 500,
                    visits: 3,
                    stamps: 1,
                    totalSpent: 1200
                }
            });
        }

        // --- HTTP TESTS ---

        // 3. GET Programs
        console.log('\n▶️ TEST 1: Fetching Loyalty Programs...');
        let res = await fetch(`${BASE_URL}/programs?businessId=${b.id}`, { headers: HEADERS });
        if (!res.ok) throw new Error(`Fetch programs failed: ${await res.text()}`);
        let programsData = await res.json() as any[];
        console.log(`✅ ${programsData.length} programs returned. First: ${programsData[0]?.name}`);

        // 4. GET Members
        console.log('\n▶️ TEST 2: Fetching Loyalty Members...');
        res = await fetch(`${BASE_URL}/members?businessId=${b.id}`, { headers: HEADERS });
        if (!res.ok) throw new Error(`Fetch members failed: ${await res.text()}`);
        let membersData = await res.json() as any[];
        console.log(`✅ ${membersData.length} members returned. First user points: ${membersData[0]?.points}.`);

        // 5. POST Reward
        console.log('\n▶️ TEST 3: Creating a Loyalty Reward...');
        const newReward = {
            businessId: b.id,
            name: `E2E Free Product ${Date.now()}`,
            pointsCost: 200,
            category: 'Productos',
            isActive: true
        };
        res = await fetch(`${BASE_URL}/rewards`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(newReward)
        });
        if (!res.ok) throw new Error(`Create reward failed: ${await res.text()}`);
        let createdReward = await res.json() as any;
        console.log(`✅ Reward '${createdReward.name}' created mapped to ${createdReward.pointsCost} points.`);

        // 6. GET Rewards
        console.log('\n▶️ TEST 4: Fetching all active Rewards...');
        res = await fetch(`${BASE_URL}/rewards?businessId=${b.id}`, { headers: HEADERS });
        if (!res.ok) throw new Error(`Fetch rewards failed: ${await res.text()}`);
        let rewardsList = await res.json() as any[];
        console.log(`✅ Retreived ${rewardsList.length} total rewards currently configured.`);

        console.log('\n🎉 ALL LOYALTY TESTS PASSED SUCCESSFULLY! Clients are ready to earn points.');
    } catch (e) {
        console.error('\n❌ E2E LOYALTY TEST CRASH:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
