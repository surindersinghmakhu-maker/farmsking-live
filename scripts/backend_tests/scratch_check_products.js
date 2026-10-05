const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: {
      sellerStore: true,
    },
  });

  console.log('Total Products in Database:', products.length);
  products.forEach((p, idx) => {
    console.log(`\n--- Product #${idx + 1} ---`);
    console.log('ID:', p.id);
    console.log('Name:', p.name);
    console.log('Price:', p.price);
    console.log('Category:', p.category);
    console.log('CategorySlug:', p.categorySlug);
    console.log('Active:', p.isActive);
    console.log('ModerationStatus:', p.moderationStatus);
    console.log('Store:', p.sellerStore?.storeName || 'No Store');
  });

  // Ensure all products are ACTIVE so they show on live farmsking.in
  await prisma.product.updateMany({
    data: {
      isActive: true,
      moderationStatus: 'ACTIVE',
    },
  });

  console.log('\n✅ All products marked ACTIVE and live!');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
