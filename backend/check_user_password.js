const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const argon2 = require('argon2');

async function run() {
  const user = await prisma.user.findUnique({
    where: { mobile: '9501529971' }
  });

  console.log('User 9501529971 details:', {
    id: user.id,
    kingId: user.kingId,
    name: user.name,
    mobile: user.mobile,
    role: user.role,
    passwordHash: user.passwordHash
  });

  const isMobilePassword = await argon2.verify(user.passwordHash, '9501529971');
  console.log('Is password equal to mobile (9501529971)?', isMobilePassword);

  const commonPasswords = ['123456', '12345678', 'admin', 'farmsking', '9501529971'];
  for (const p of commonPasswords) {
    if (await argon2.verify(user.passwordHash, p)) {
      console.log('MATCHED PASSWORD:', p);
    }
  }
}

run().finally(() => prisma.$disconnect());
