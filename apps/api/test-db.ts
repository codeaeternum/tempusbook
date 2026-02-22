import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBusiness() {
  const businesses = await prisma.business.findMany({
    include: {
      category: true,
      members: {
        include: {
          user: true
        }
      }
    }
  });

  console.log(JSON.stringify(businesses, null, 2));
}

checkBusiness()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
