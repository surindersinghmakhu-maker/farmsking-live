const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDashboard() {
  const userId = 'b9a696f9-8437-41e2-9480-8717cb479361';
  const user = await prisma.user.findUnique({ where: { id: userId } });

  const workers = await prisma.labourWorker.findMany({
    where: {
      OR: [
        { userId },
        ...(user.mobile ? [{ mobile: user.mobile }] : []),
      ],
      deletedAt: null,
    },
    include: {
      farmer: { select: { id: true, name: true, mobile: true } },
      workEntries: { where: { deletedAt: null } },
      payments: { where: { deletedAt: null } },
    }
  });

  console.log('Workers found for dashboard:', workers.map(w => ({ id: w.id, name: w.name, mobile: w.mobile, farmer: w.farmer.name })));
}
testDashboard().finally(() => prisma.$disconnect());
