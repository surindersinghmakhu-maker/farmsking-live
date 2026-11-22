const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      kingId: true,
      mobile: true,
      name: true,
      role: true,
      roles: true,
      isApproved: true,
      isPhoneVerified: true,
      advisorType: true,
      supervisorPermissions: true,
      operatorPermissions: true,
      adminStaffPermissions: true,
    },
    orderBy: { createdAt: 'asc' }
  });
  console.log(`Found ${users.length} users:`);
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
