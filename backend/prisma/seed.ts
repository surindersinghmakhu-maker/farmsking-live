import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Combined Essential 5 Agricultural Expense Categories
const expenseCategories = [
  { key: 'seeds_fertilizer', labelEn: 'Seeds, Fertilizers & Pesticides', labelHi: 'खाद, बीज व दवाई', sortOrder: 1 },
  { key: 'labour_machinery', labelEn: 'Labor, Tractor & Equipment', labelHi: 'मजदूरी, ट्रैक्टर व उपकरण', sortOrder: 2 },
  { key: 'irrigation_power', labelEn: 'Irrigation, Diesel & Electricity', labelHi: 'सिंचाई, डीजल व बिजली', sortOrder: 3 },
  { key: 'transport_packing', labelEn: 'Transport, Mandi & Packing', labelHi: 'परिवहन, मंडी व पैकिंग', sortOrder: 4 },
  { key: 'other', labelEn: 'Other Farm Expenses', labelHi: 'अन्य कृषि खर्च', sortOrder: 5 },
];

const fertilizers = [
  { name: 'Urea', type: 'CHEMICAL', defaultUnit: 'kg' },
  { name: 'DAP', type: 'CHEMICAL', defaultUnit: 'kg' },
  { name: 'MOP', type: 'CHEMICAL', defaultUnit: 'kg' },
  { name: 'NPK', type: 'CHEMICAL', defaultUnit: 'kg' },
  { name: 'Vermicompost', type: 'ORGANIC', defaultUnit: 'kg' },
  { name: 'Farmyard Manure (FYM)', type: 'ORGANIC', defaultUnit: 'kg' },
  { name: 'Zinc Sulphate', type: 'CHEMICAL', defaultUnit: 'kg' },
  { name: 'Bio-fertilizer', type: 'BIO', defaultUnit: 'litre' },
] as const;

const marketRates: { cropName: string; market: string; state: string; modalPrice: number }[] = [
  { cropName: 'Marigold', market: 'Bathinda Mandi', state: 'Punjab', modalPrice: 4000 },
  { cropName: 'Marigold', market: 'Karnal Mandi', state: 'Haryana', modalPrice: 3800 },
  { cropName: 'Tomato', market: 'Bathinda Mandi', state: 'Punjab', modalPrice: 1200 },
  { cropName: 'Rose', market: 'Bathinda Mandi', state: 'Punjab', modalPrice: 8000 },
  { cropName: 'Wheat', market: 'Bathinda Mandi', state: 'Punjab', modalPrice: 2200 },
];

async function main() {
  for (const category of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { key: category.key },
      update: {
        labelEn: category.labelEn,
        labelHi: category.labelHi,
        sortOrder: category.sortOrder,
      },
      create: { ...category, isSystem: true, isActive: true },
    });
  }

  for (const fertilizer of fertilizers) {
    const existing = await prisma.fertilizer.findFirst({
      where: { name: fertilizer.name, isSystem: true },
    });
    if (!existing) {
      await prisma.fertilizer.create({
        data: { ...fertilizer, isSystem: true },
      });
    }
  }

  await prisma.marketRate.deleteMany({ where: { source: 'seed-demo' } });
  await prisma.marketRate.createMany({
    data: marketRates.map((rate) => ({
      cropName: rate.cropName,
      market: rate.market,
      state: rate.state,
      modalPrice: rate.modalPrice,
      minPrice: rate.modalPrice * 0.95,
      maxPrice: rate.modalPrice * 1.05,
      unit: 'quintal',
      rateDate: new Date(),
      source: 'seed-demo',
    })),
  });

  const existingPlan = await prisma.advisorPlan.findFirst({ where: { name: 'Farmer Advisor Plan' } });
  if (!existingPlan) {
    await prisma.advisorPlan.create({
      data: {
        name: 'Farmer Advisor Plan',
        description: 'One dedicated Farm Advisor for your crops, schedules, and problem-solving.',
        price: 500,
        billingCycle: 'MONTHLY',
      },
    });
  }

  const demoAdvisorMobile = '9999900001';
  const existingAdvisor = await prisma.user.findUnique({ where: { mobile: demoAdvisorMobile } });
  if (!existingAdvisor) {
    await prisma.user.create({
      data: {
        mobile: demoAdvisorMobile,
        passwordHash: await argon2.hash('advisor123'),
        role: Role.ADVISOR,
        name: 'Gurpreet Singh',
        village: 'Bathinda',
        district: 'Bathinda',
        state: 'Punjab',
      },
    });
  }

  console.log(
    `Seeded ${expenseCategories.length} expense categories, ${fertilizers.length} fertilizers, ${marketRates.length} market rates, 1 advisor plan, and a demo advisor account (${demoAdvisorMobile} / advisor123).`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
