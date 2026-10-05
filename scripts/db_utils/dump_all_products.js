const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  console.log('Found', products.length, 'products in local DB.');
  fs.writeFileSync('local_products_export.json', JSON.stringify(products, null, 2));
  console.log('Exported to local_products_export.json');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
