import { Prisma, PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { generateUniqueKingId } from '../src/common/utils/king-id.util';

const prisma = new PrismaClient();

// Individual Agricultural Work & Farming Input Expense Categories
const expenseCategories = [
  { key: 'cultivation', labelEn: 'Cultivation & Tillage (ਵਾਹੀ)', labelHi: 'जुताई व बाही', sortOrder: 1 },
  { key: 'sowing_seeds', labelEn: 'Seeds & Sowing (ਬੀਜ / ਬਿਜਾਈ)', labelHi: 'बीज व बुआई', sortOrder: 2 },
  { key: 'fertilizer', labelEn: 'Fertilizers & FYM Manure (ਖਾਦ)', labelHi: 'खाद व उर्वरक', sortOrder: 3 },
  { key: 'crop_care', labelEn: 'Crop Care & Protection (ਫਸਲ ਦੀ ਦੇਖਭਾਲ)', labelHi: 'फसल की देखभाल', sortOrder: 4 },
  { key: 'irrigation_power', labelEn: 'Irrigation & Power (ਸਿੰਚਾਈ / ਡੀਜ਼ਲ)', labelHi: 'सिंचाई व डीजल', sortOrder: 5 },
  { key: 'spray_pesticide', labelEn: 'Spray & Pesticides (ਕੀਟਨਾਸ਼ਕ ਸਪ੍ਰੇ)', labelHi: 'कीटनाशक स्प्रे', sortOrder: 6 },
  { key: 'labour', labelEn: 'Labour & Dihadi (ਮਜ਼ਦੂਰੀ / ਦਿਹਾੜੀ)', labelHi: 'मजदूरी व दिहाड़ी', sortOrder: 7 },
  { key: 'machinery_equipment', labelEn: 'Machinery & Tractor Rent (ਟਰੈਕਟਰ / ਮਸ਼ੀਨਰੀ)', labelHi: 'ट्रैक्टर व मशीनरी', sortOrder: 8 },
  { key: 'harvesting', labelEn: 'Harvesting & Threshing (ਵਾਢੀ / ਗਹਾਈ)', labelHi: 'कटाई व मड़ाई', sortOrder: 9 },
  { key: 'transport', labelEn: 'Transport & Freight (ਟ੍ਰਾਂਸਪੋਰਟ / ਭਾੜਾ)', labelHi: 'परिवहन व भाड़ा', sortOrder: 10 },
  { key: 'mandi_packing', labelEn: 'Packing & Mandi Fee (ਮੰਡੀ / ਪੈਕਿੰਗ)', labelHi: 'मंडी व पैकिंग', sortOrder: 11 },
  { key: 'other', labelEn: 'Other Farm Expenses (ਹੋਰ ਖਰਚੇ)', labelHi: 'अन्य कृषि खर्च', sortOrder: 12 },
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
        kingId: await generateUniqueKingId(prisma),
        mobile: demoAdvisorMobile,
        passwordHash: await argon2.hash('advisor123'),
        role: Role.ADVISOR,
        advisorType: 'FARM',
        name: 'Gurpreet Singh',
        village: 'Bathinda',
        district: 'Bathinda',
        state: 'Punjab',
      },
    });
  }

  const demoSuperAdminMobile = '9999900002';
  const existingSuperAdmin = await prisma.user.findUnique({ where: { mobile: demoSuperAdminMobile } });
  if (!existingSuperAdmin) {
    await prisma.user.create({
      data: {
        kingId: '02101982',
        mobile: demoSuperAdminMobile,
        passwordHash: await argon2.hash('superadmin123'),
        role: Role.SUPER_ADMIN,
        name: 'FarmsKing Super Admin',
      },
    });
  } else {
    await prisma.user.update({
      where: { id: existingSuperAdmin.id },
      data: { kingId: '02101982' },
    });
  }

  const demoOperatorMobile = '9999900003';
  const existingOperator = await prisma.user.findUnique({ where: { mobile: demoOperatorMobile } });
  if (!existingOperator) {
    await prisma.user.create({
      data: {
        kingId: await generateUniqueKingId(prisma),
        mobile: demoOperatorMobile,
        passwordHash: await argon2.hash('operator123'),
        role: Role.OPERATOR,
        name: 'FarmsKing Operator',
      },
    });
  }

  // ─── One demo account per remaining role, for dashboard testing ──────────

  async function upsertDemoUser(
    mobile: string,
    password: string,
    data: Omit<Prisma.UserCreateInput, 'kingId' | 'mobile' | 'passwordHash'>,
  ) {
    const existing = await prisma.user.findUnique({ where: { mobile } });
    if (existing) return existing;
    return prisma.user.create({
      data: { kingId: await generateUniqueKingId(prisma), mobile, passwordHash: await argon2.hash(password), ...data },
    });
  }

  const demoGardenAdvisor = await upsertDemoUser('9999900004', 'gardadv123', {
    role: Role.ADVISOR,
    advisorType: 'GARDEN',
    name: 'Priya Sharma',
    village: 'Mohali',
    district: 'Mohali',
    state: 'Punjab',
    pincode: '160055',
    postOffice: 'Sector 70 Mohali',
    photoUrl: 'https://i.pravatar.cc/300?img=47',
    specialization: 'Home & Terrace Gardening',
    bio: 'Helping home gardeners grow healthier plants for 6+ years.',
    yearsExperience: 6,
  });

  const demoFarmer = await upsertDemoUser('9999900005', 'farmer123', {
    role: Role.FARMER,
    name: 'Balwinder Singh',
    village: 'Bathinda',
    district: 'Bathinda',
    state: 'Punjab',
    pincode: '151001',
    postOffice: 'Bathinda City',
    photoUrl: 'https://i.pravatar.cc/300?img=12',
    sprayTankSizeL: 20,
    soilType: 'LOAMY',
    waterType: 'CANAL',
  });
  await prisma.farmerPlan.upsert({
    where: { farmerId: demoFarmer.id },
    update: {},
    create: { farmerId: demoFarmer.id, plan: 'FREE' },
  });

  const demoGardener = await upsertDemoUser('9999900006', 'gardener123', {
    role: Role.GARDENER,
    name: 'Neha Kapoor',
    village: 'Mohali',
    district: 'Mohali',
    state: 'Punjab',
    pincode: '160055',
    postOffice: 'Sector 70 Mohali',
    photoUrl: 'https://i.pravatar.cc/300?img=32',
  });
  await prisma.gardenerPlan.upsert({
    where: { gardenerId: demoGardener.id },
    update: {},
    create: { gardenerId: demoGardener.id, plan: 'FREE' },
  });

  const demoCustomer = await upsertDemoUser('9999900007', 'customer123', {
    role: Role.CUSTOMER,
    name: 'Rohan Verma',
    village: 'Chandigarh',
    district: 'Chandigarh',
    state: 'Chandigarh',
    pincode: '160017',
    postOffice: 'Sector 17 Chandigarh',
    photoUrl: 'https://i.pravatar.cc/300?img=15',
  });

  const demoPartnerUser = await upsertDemoUser('9999900008', 'partner123', {
    role: Role.BUSINESS_PARTNER,
    name: 'Vikram Malhotra',
    village: 'Ludhiana',
    district: 'Ludhiana',
    state: 'Punjab',
    pincode: '141001',
    postOffice: 'Ludhiana City',
    photoUrl: 'https://i.pravatar.cc/300?img=53',
  });

  const demoAdminUser = await upsertDemoUser('9999900009', 'admin123', {
    role: Role.ADMIN,
    name: 'FarmsKing Admin',
  });
  await prisma.user.update({
    where: { id: demoAdminUser.id },
    data: { kingId: '01012000' },
  });

  // ─── Sample records so every dashboard has something real to show ────────

  const existingFarm = await prisma.farm.findFirst({ where: { ownerId: demoFarmer.id } });
  const demoFarm =
    existingFarm ??
    (await prisma.farm.create({
      data: {
        ownerId: demoFarmer.id,
        name: 'Singh Family Farm',
        village: 'Bathinda',
        district: 'Bathinda',
        state: 'Punjab',
        totalArea: 5,
        areaUnit: 'ACRE',
        soilType: 'Loamy',
        irrigationSource: 'Canal',
      },
    }));

  const existingPlot = await prisma.plot.findFirst({ where: { farmId: demoFarm.id } });
  const demoPlot =
    existingPlot ??
    (await prisma.plot.create({
      data: { farmId: demoFarm.id, name: 'Plot 1', area: 2, areaUnit: 'ACRE', soilType: 'Loamy', waterSource: 'Canal' },
    }));

  const existingCrop = await prisma.cropCycle.findFirst({ where: { plotId: demoPlot.id } });
  if (!existingCrop) {
    await prisma.cropCycle.create({
      data: {
        plotId: demoPlot.id,
        category: 'VEGETABLES',
        cropName: 'Tomato',
        variety: 'Hybrid',
        area: 2,
        sowingDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      },
    });
  }

  const existingGarden = await prisma.garden.findFirst({ where: { gardenerId: demoGardener.id } });
  const demoGarden =
    existingGarden ??
    (await prisma.garden.create({
      data: { gardenerId: demoGardener.id, name: 'Terrace Garden', location: 'Mohali', area: 300 },
    }));

  const existingPlants = await prisma.plant.count({ where: { gardenId: demoGarden.id } });
  if (existingPlants === 0) {
    await prisma.plant.createMany({
      data: [
        { gardenId: demoGarden.id, name: 'Money Plant', species: 'Epipremnum aureum', plantedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
        { gardenId: demoGarden.id, name: 'Tulsi', species: 'Ocimum tenuiflorum', plantedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      ],
    });
  }

  const demoProduct =
    (await prisma.product.findFirst({ where: { name: 'Organic Vermicompost 5kg' } })) ??
    (await prisma.product.create({
      data: {
        name: 'Organic Vermicompost 5kg',
        description: 'Nutrient-rich organic compost for healthier soil.',
        category: 'Fertilizer',
        unit: 'bag',
        price: 350,
        stockQty: 100,
        createdById: demoAdminUser.id,
      },
    }));

  const demoCoupon =
    (await prisma.coupon.findFirst({ where: { businessPartnerId: demoPartnerUser.id, code: 'DEMO-PARTNER10' } })) ??
    (await prisma.coupon.create({
      data: {
        code: 'DEMO-PARTNER10',
        businessPartnerId: demoPartnerUser.id,
        createdById: demoAdminUser.id,
        commissionType: 'PERCENTAGE',
        commissionValue: 5,
        discountType: 'PERCENTAGE',
        discountValue: 10,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimit: 1000,
      },
    }));

  const existingOrder = await prisma.customerOrder.findFirst({ where: { customerId: demoCustomer.id } });
  if (!existingOrder) {
    const orderAmount = 350;
    const discountAmount = 35;
    const commissionAmount = 17.5;
    const order = await prisma.customerOrder.create({
      data: {
        customerId: demoCustomer.id,
        orderNumber: `DEMO-ORD-${Date.now()}`,
        totalAmount: orderAmount - discountAmount,
        status: 'CONFIRMED',
        couponId: demoCoupon.id,
        deliveryAddress: 'Sector 17, Chandigarh',
      },
    });
    await prisma.customerOrderItem.create({
      data: { orderId: order.id, productId: demoProduct.id, productName: demoProduct.name, quantity: 1, price: orderAmount },
    });
    const redemption = await prisma.couponRedemption.create({
      data: {
        couponId: demoCoupon.id,
        customerId: demoCustomer.id,
        orderId: order.id,
        orderAmount,
        discountAmount,
        commissionAmount,
        creditedAt: new Date(),
      },
    });
    await prisma.coupon.update({ where: { id: demoCoupon.id }, data: { usedCount: { increment: 1 } } });
    await prisma.walletTransaction.create({
      data: {
        userId: demoPartnerUser.id,
        type: 'CREDIT',
        amount: commissionAmount,
        reason: `Commission from coupon ${demoCoupon.code}`,
        couponRedemptionId: redemption.id,
      },
    });
  }

  // A couple of chat messages each side, so the Chat tab has content to demo.
  const demoAdvisorForChat = await prisma.user.findUnique({ where: { mobile: demoAdvisorMobile } });
  if (demoAdvisorForChat) {
    const existingMsg = await prisma.message.findFirst({
      where: { senderId: demoFarmer.id, receiverId: demoAdvisorForChat.id },
    });
    if (!existingMsg) {
      await prisma.message.create({
        data: { senderId: demoFarmer.id, receiverId: demoAdvisorForChat.id, content: 'Hello ji, tomato ki spray kab karni hai?' },
      });
      await prisma.message.create({
        data: { senderId: demoAdvisorForChat.id, receiverId: demoFarmer.id, content: 'Kal subah karwa lena, mausam theek rahega.', isRead: true, readAt: new Date() },
      });
    }
  }

  const existingGardenerMsg = await prisma.message.findFirst({
    where: { senderId: demoGardener.id, receiverId: demoGardenAdvisor.id },
  });
  if (!existingGardenerMsg) {
    await prisma.message.create({
      data: { senderId: demoGardener.id, receiverId: demoGardenAdvisor.id, content: 'Tulsi ke patte peele ho rahe hain, kya karu?' },
    });
    await prisma.message.create({
      data: { senderId: demoGardenAdvisor.id, receiverId: demoGardener.id, content: 'Paani thoda kam karo aur dhoop me rakho.', isRead: true, readAt: new Date() },
    });
  }

  // Link the demo farmer <-> demo farm advisor, and demo gardener <-> demo garden advisor, so their dashboards show real data.
  const demoAdvisor = await prisma.user.findUnique({ where: { mobile: demoAdvisorMobile } });
  if (demoAdvisor) {
    const existingFarmerLink = await prisma.advisorAssignment.findFirst({
      where: { advisorId: demoAdvisor.id, farmerId: demoFarmer.id },
    });
    if (!existingFarmerLink) {
      await prisma.advisorAssignment.create({
        data: { advisorId: demoAdvisor.id, farmerId: demoFarmer.id, status: 'ACTIVE', startDate: new Date() },
      });
    }
  }

  const existingGardenerLink = await prisma.advisorAssignment.findFirst({
    where: { advisorId: demoGardenAdvisor.id, farmerId: demoGardener.id },
  });
  if (!existingGardenerLink) {
    await prisma.advisorAssignment.create({
      data: { advisorId: demoGardenAdvisor.id, farmerId: demoGardener.id, status: 'ACTIVE', startDate: new Date() },
    });
  }

  // Link the demo customer to the demo business partner via a coupon redemption record equivalent (direct link, no order needed for testing).
  const demoPartner = await prisma.user.findUnique({ where: { mobile: '9999900008' } });
  if (demoPartner) {
    await prisma.partnerAssignment.upsert({
      where: { customerId: demoCustomer.id },
      update: {},
      create: { businessPartnerId: demoPartner.id, customerId: demoCustomer.id },
    });
  }

  console.log(
    `Seeded ${expenseCategories.length} expense categories, ${fertilizers.length} fertilizers, ${marketRates.length} market rates, 1 advisor plan, and one demo account per role:\n` +
      `  Farm Advisor:   ${demoAdvisorMobile} / advisor123\n` +
      `  Garden Advisor: 9999900004 / gardadv123\n` +
      `  Farmer:         9999900005 / farmer123 (linked to Farm Advisor)\n` +
      `  Gardener:       9999900006 / gardener123 (linked to Garden Advisor)\n` +
      `  Customer:       9999900007 / customer123 (linked to Business Partner)\n` +
      `  Business Partner: 9999900008 / partner123\n` +
      `  Admin:          9999900009 / admin123\n` +
      `  Super Admin:    ${demoSuperAdminMobile} / superadmin123\n` +
      `  Operator:       ${demoOperatorMobile} / operator123`
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
