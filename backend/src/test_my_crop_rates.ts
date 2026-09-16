import { PrismaClient } from '@prisma/client';
import { MarketRatesService } from './modules/market-rates/market-rates.service';

const prisma = new PrismaClient();

async function main() {
  const service = new MarketRatesService(prisma as any);

  const user = await prisma.user.findFirst({
    where: { name: { contains: 'Surinder', mode: 'insensitive' } },
  });

  console.log('Testing getMyCropRates for user:', user?.name, user?.id, user?.state);

  const result = await service.getMyCropRates(
    user
      ? ({
          id: user.id,
          role: user.role,
        } as any)
      : null,
  );

  console.log('\nResult from getMyCropRates():');
  console.dir(result, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
