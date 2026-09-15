"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const market_rates_service_1 = require("./modules/market-rates/market-rates.service");
const prisma = new client_1.PrismaClient();
async function main() {
    const service = new market_rates_service_1.MarketRatesService(prisma);
    const user = await prisma.user.findFirst({
        where: { name: { contains: 'Surinder', mode: 'insensitive' } },
    });
    console.log('Testing getMyCropRates for user:', user?.name, user?.id, user?.state);
    const result = await service.getMyCropRates(user
        ? {
            id: user.id,
            role: user.role,
        }
        : null);
    console.log('\nResult from getMyCropRates():');
    console.dir(result, { depth: null });
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=test_my_crop_rates.js.map