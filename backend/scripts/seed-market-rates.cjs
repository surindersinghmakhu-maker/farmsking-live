const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const marketRates = [
  { cropName: 'Marigold', market: 'Bathinda Mandi', state: 'Punjab', modalPrice: 4000 },
  { cropName: 'Marigold', market: 'Karnal Mandi', state: 'Haryana', modalPrice: 3800 },
  { cropName: 'Marigold', market: 'Lucknow Mandi', state: 'Uttar Pradesh', modalPrice: 3600 },
  { cropName: 'Marigold', market: 'Pune Mandi', state: 'Maharashtra', modalPrice: 4200 },
  { cropName: 'Marigold', market: 'Bengaluru Mandi', state: 'Karnataka', modalPrice: 4100 },

  { cropName: 'Tomato', market: 'Bathinda Mandi', state: 'Punjab', modalPrice: 1200 },
  { cropName: 'Tomato', market: 'Karnal Mandi', state: 'Haryana', modalPrice: 1100 },
  { cropName: 'Tomato', market: 'Lucknow Mandi', state: 'Uttar Pradesh', modalPrice: 1000 },
  { cropName: 'Tomato', market: 'Pune Mandi', state: 'Maharashtra', modalPrice: 1400 },
  { cropName: 'Tomato', market: 'Bengaluru Mandi', state: 'Karnataka', modalPrice: 1300 },

  { cropName: 'Rose', market: 'Bathinda Mandi', state: 'Punjab', modalPrice: 8000 },
  { cropName: 'Rose', market: 'Karnal Mandi', state: 'Haryana', modalPrice: 7800 },
  { cropName: 'Rose', market: 'Pune Mandi', state: 'Maharashtra', modalPrice: 8500 },
  { cropName: 'Rose', market: 'Bengaluru Mandi', state: 'Karnataka', modalPrice: 8200 },

  { cropName: 'Wheat', market: 'Bathinda Mandi', state: 'Punjab', modalPrice: 2200 },
  { cropName: 'Wheat', market: 'Karnal Mandi', state: 'Haryana', modalPrice: 2150 },
  { cropName: 'Wheat', market: 'Lucknow Mandi', state: 'Uttar Pradesh', modalPrice: 2100 },
  { cropName: 'Wheat', market: 'Indore Mandi', state: 'Madhya Pradesh', modalPrice: 2180 },

  { cropName: 'Chilli', market: 'Bengaluru Mandi', state: 'Karnataka', modalPrice: 9000 },
  { cropName: 'Chilli', market: 'Guntur Mandi', state: 'Andhra Pradesh', modalPrice: 8800 },
  { cropName: 'Chilli', market: 'Pune Mandi', state: 'Maharashtra', modalPrice: 9200 },

  { cropName: 'Onion', market: 'Pune Mandi', state: 'Maharashtra', modalPrice: 1800 },
  { cropName: 'Onion', market: 'Bengaluru Mandi', state: 'Karnataka', modalPrice: 1700 },
  { cropName: 'Onion', market: 'Indore Mandi', state: 'Madhya Pradesh', modalPrice: 1650 },
];

async function main() {
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
  console.log(`Seeded ${marketRates.length} market rates.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
