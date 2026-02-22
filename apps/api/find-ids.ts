import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- Fetching IDs ---');
    let user = await prisma.user.findFirst();
    let b = await prisma.business.findFirst();
    if (!b) {
        b = await prisma.business.create({
            data: {
                name: 'Pos Test',
                slug: 'pos-test',
                category: { create: { name: 'Cat', slug: 'cat', icon: 'c', sortOrder: 1 } }
            }
        });
    }
    let m = await prisma.businessMember.findFirst({ where: { businessId: b.id, userId: user!.id } });
    if (!m) {
        m = await prisma.businessMember.create({
            data: { businessId: b.id, userId: user!.id, role: 'OWNER' }
        });
    }
    let br = await prisma.branch.findFirst({ where: { businessId: b.id } });
    if (!br) {
        br = await prisma.branch.create({ data: { businessId: b.id, name: 'Main Branch' } });
    }
    console.log('B_ID=' + b.id);
    console.log('M_ID=' + m.id);
    console.log('BR_ID=' + br.id);
    process.exit(0);
}

main().catch(console.error);
