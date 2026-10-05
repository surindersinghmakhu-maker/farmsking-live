const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({ where: { mobile: { contains: '6283153040' } } });
  console.log('--- USERS WITH 6283153040 ---');
  console.log(JSON.stringify(users, null, 2));

  const workers = await prisma.labourWorker.findMany({
    where: {
      OR: [
        { mobile: { contains: '6283153040' } },
        { user: { mobile: { contains: '6283153040' } } },
        { name: { contains: '6283153040' } }
      ]
    },
    include: {
      farmer: { select: { id: true, name: true, mobile: true } },
      user: { select: { id: true, name: true, mobile: true } }
    }
  });
  console.log('--- WORKERS WITH 6283153040 ---');
  console.log(JSON.stringify(workers, null, 2));

  // Also search for all labourWorkers in general to see if there are workers with slightly different formatting or mobile numbers
  const allWorkers = await prisma.labourWorker.findMany({
    select: { id: true, name: true, mobile: true, userId: true, farmer: { select: { name: true, mobile: true } } }
  });
  console.log('--- ALL WORKERS IN DB ---');
  console.log(JSON.stringify(allWorkers, null, 2));
}

run().finally(() => prisma.$disconnect());
