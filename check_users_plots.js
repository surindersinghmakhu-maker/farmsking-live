const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user1 = await prisma.user.findUnique({ where: { id: 'c7d07121-991a-4ff4-9618-0147870d2747' } });
  const user2 = await prisma.user.findUnique({ where: { id: '90065856-5709-44e7-896d-b9c2a4bd6301' } });

  console.log('User c7d07121:', user1?.name, user1?.mobile, user1?.kingId);
  console.log('User 90065856:', user2?.name, user2?.mobile, user2?.kingId);

  // Check all farms owned by user2 (9501529971)
  const farms2 = await prisma.farm.findMany({
    where: { ownerId: '90065856-5709-44e7-896d-b9c2a4bd6301', deletedAt: null },
    include: { plots: { where: { deletedAt: null } } }
  });
  console.log('\nFarms & Plots owned by 9501529971:');
  for (const f of farms2) {
    console.log('Farm:', f.id, f.name);
    for (const p of f.plots) {
      console.log('  Plot:', p.id, p.name);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
