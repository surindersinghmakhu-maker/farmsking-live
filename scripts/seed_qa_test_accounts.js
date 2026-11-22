const { PrismaClient, Role, SoilType, WaterType, AreaUnit, CropCategory, CropStatus, FarmerSubscriptionPlan, SupervisorPermission, OperatorPermission, AdminStaffPermission } = require('../backend/node_modules/@prisma/client');
const argon2 = require('../backend/node_modules/argon2');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting FarmsKing QA Role-Wise Test Accounts Generation...');

  const defaultPassword = 'Test@1234';
  const passwordHash = await argon2.hash(defaultPassword);
  console.log('✅ Generated standard password hash for password:', defaultPassword);

  const accounts = [
    // 1. SUPER_ADMIN
    {
      mobile: '9000000001',
      kingId: '90000001',
      name: 'QA Super Admin',
      email: 'qa.superadmin@farmsking.in',
      role: Role.SUPER_ADMIN,
      roles: [Role.SUPER_ADMIN, Role.ADMIN],
      village: 'Village Booh',
      district: 'Kapurthala',
      state: 'Punjab',
      pincode: '144601',
      isPhoneVerified: true,
      isApproved: true,
      profileStatus: 'APPROVED',
      kycVerified: true,
      adminStaffPermissions: [
        AdminStaffPermission.MANAGE_USERS,
        AdminStaffPermission.MANAGE_STAFF,
        AdminStaffPermission.MANAGE_PAYMENTS,
        AdminStaffPermission.MANAGE_PLANS,
        AdminStaffPermission.MANAGE_ADVISORS,
        AdminStaffPermission.VIEW_FINANCES,
        AdminStaffPermission.MANAGE_ORDERS,
        AdminStaffPermission.MANAGE_WEATHER_MARKET,
        AdminStaffPermission.MANAGE_DOCTORS,
        AdminStaffPermission.VIEW_AUDIT_LOGS,
      ],
    },
    // 2. ADMIN
    {
      mobile: '9000000002',
      kingId: '90000002',
      name: 'QA Admin Executive',
      email: 'qa.admin@farmsking.in',
      role: Role.ADMIN,
      roles: [Role.ADMIN],
      village: 'Grain Market',
      district: 'Ferozepur',
      state: 'Punjab',
      pincode: '142044',
      isPhoneVerified: true,
      isApproved: true,
      profileStatus: 'APPROVED',
      kycVerified: true,
      adminStaffPermissions: [
        AdminStaffPermission.MANAGE_USERS,
        AdminStaffPermission.MANAGE_STAFF,
        AdminStaffPermission.MANAGE_PAYMENTS,
        AdminStaffPermission.MANAGE_PLANS,
        AdminStaffPermission.MANAGE_ADVISORS,
        AdminStaffPermission.VIEW_FINANCES,
        AdminStaffPermission.MANAGE_ORDERS,
        AdminStaffPermission.MANAGE_WEATHER_MARKET,
        AdminStaffPermission.MANAGE_DOCTORS,
        AdminStaffPermission.VIEW_AUDIT_LOGS,
      ],
    },
    // 3. STAFF / MANAGER
    {
      mobile: '9000000003',
      kingId: '90000003',
      name: 'QA Operations Manager',
      email: 'qa.manager@farmsking.in',
      role: Role.MANAGER,
      roles: [Role.MANAGER],
      village: 'Grain Market',
      district: 'Ferozepur',
      state: 'Punjab',
      pincode: '142044',
      isPhoneVerified: true,
      isApproved: true,
      profileStatus: 'APPROVED',
      kycVerified: true,
    },
    // 4. FREE FARMER
    {
      mobile: '9000000004',
      kingId: '90000004',
      name: 'QA Free Farmer',
      email: 'qa.freefarmer@farmsking.in',
      role: Role.FARMER,
      roles: [Role.CUSTOMER, Role.FARMER],
      village: 'Village Booh',
      district: 'Kapurthala',
      state: 'Punjab',
      pincode: '144601',
      isPhoneVerified: true,
      isApproved: true,
      profileStatus: 'APPROVED',
      soilType: SoilType.ALLUVIAL,
      waterType: WaterType.BOREWELL_TUBEWELL,
    },
    // 5. PAID FARMER (VIP/PRO)
    {
      mobile: '9000000005',
      kingId: '90000005',
      name: 'QA Paid Farmer (VIP)',
      email: 'qa.paidfarmer@farmsking.in',
      role: Role.FARMER,
      roles: [Role.CUSTOMER, Role.FARMER],
      village: 'Kotkapura Road',
      district: 'Faridkot',
      state: 'Punjab',
      pincode: '151204',
      isPhoneVerified: true,
      isApproved: true,
      profileStatus: 'APPROVED',
      soilType: SoilType.LOAMY,
      waterType: WaterType.CANAL,
    },
    // 6. CLIENT / CUSTOMER
    {
      mobile: '9000000006',
      kingId: '90000006',
      name: 'QA Retail Customer',
      email: 'qa.customer@farmsking.in',
      role: Role.CUSTOMER,
      roles: [Role.CUSTOMER],
      village: 'Model Town',
      district: 'Jalandhar',
      state: 'Punjab',
      pincode: '144003',
      isPhoneVerified: true,
      isApproved: true,
      profileStatus: 'APPROVED',
    },
    // 7. BUSINESS PARTNER / AGENT
    {
      mobile: '9000000007',
      kingId: '90000007',
      name: 'QA Sales Partner (Agent)',
      email: 'qa.partner@farmsking.in',
      role: Role.AGENT,
      roles: [Role.AGENT],
      village: 'Makhu Road',
      district: 'Ferozepur',
      state: 'Punjab',
      pincode: '142044',
      isPhoneVerified: true,
      isApproved: true,
      profileStatus: 'APPROVED',
      kycVerified: true,
      upiId: 'qa.agent@upi',
      panNumber: 'AAHCP9007A',
    },
    // 8. FARM ADVISOR / AGRICULTURE DOCTOR
    {
      mobile: '9000000008',
      kingId: '90000008',
      name: 'Dr. QA Crop Doctor',
      email: 'dr.cropdoctor@farmsking.in',
      role: Role.ADVISOR,
      roles: [Role.ADVISOR],
      village: 'PAU Campus',
      district: 'Ludhiana',
      state: 'Punjab',
      pincode: '141004',
      advisorType: 'FARM',
      specialization: 'Plant Pathology & Agronomy',
      qualification: 'M.Sc Plant Pathology (PAU)',
      profileTitle: 'Senior Agronomist & Crop Doctor',
      yearsExperience: 12,
      canAdoptCrop: true,
      canGiveEPrescription: true,
      canTakeCalls: true,
      canDoFarmVisits: true,
      feePerConsultation: 100,
      feePerCropSeason: 500,
      feeVipMonthly: 999,
      isPhoneVerified: true,
      isApproved: true,
      profileStatus: 'APPROVED',
      kycVerified: true,
      upiId: 'dr.cropdoctor@upi',
      panNumber: 'AAHCD9008D',
    },
    // 9. GARDEN ADVISOR / PLANT DOCTOR
    {
      mobile: '9000000009',
      kingId: '90000009',
      name: 'Dr. QA Garden Advisor',
      email: 'dr.gardendoctor@farmsking.in',
      role: Role.ADVISOR,
      roles: [Role.ADVISOR],
      village: 'Sector 35',
      district: 'Chandigarh',
      state: 'Punjab',
      pincode: '160022',
      advisorType: 'GARDEN',
      specialization: 'Urban Horticulture & Terrace Gardening',
      qualification: 'B.Sc Horticulture',
      profileTitle: 'Urban Flora & Garden Specialist',
      yearsExperience: 8,
      canAdoptCrop: true,
      canGiveEPrescription: true,
      canTakeCalls: true,
      feePerConsultation: 80,
      isPhoneVerified: true,
      isApproved: true,
      profileStatus: 'APPROVED',
      kycVerified: true,
      upiId: 'dr.gardendoctor@upi',
      panNumber: 'AAHCG9009G',
    },
    // 10. NURSERY OWNER / SAPLING GROWER
    {
      mobile: '9000000010',
      kingId: '90000010',
      name: 'QA Nursery Grower',
      email: 'qa.nursery@farmsking.in',
      role: Role.NURSERY_OWNER,
      roles: [Role.NURSERY_OWNER],
      village: 'GT Road',
      district: 'Amritsar',
      state: 'Punjab',
      pincode: '143001',
      isPhoneVerified: true,
      isApproved: true,
      profileStatus: 'APPROVED',
      kycVerified: true,
      upiId: 'qa.nursery@upi',
      gstin: '03AAHCN9010A1Z5',
    },
    // 11. OPERATOR (STAFF)
    {
      mobile: '9000000011',
      kingId: '90000011',
      name: 'QA Support Operator',
      email: 'qa.operator@farmsking.in',
      role: Role.OPERATOR,
      roles: [Role.OPERATOR],
      village: 'Grain Market',
      district: 'Ferozepur',
      state: 'Punjab',
      pincode: '142044',
      isPhoneVerified: true,
      isApproved: true,
      profileStatus: 'APPROVED',
      operatorPermissions: [
        OperatorPermission.VIEW_ORDERS,
        OperatorPermission.VIEW_COUPONS,
        OperatorPermission.VIEW_USERS,
        OperatorPermission.VIEW_WALLETS,
        OperatorPermission.VIEW_FARMER_PLANS,
      ],
    },
    // 12. TECHNICAL TRAINER (STAFF)
    {
      mobile: '9000000012',
      kingId: '90000012',
      name: 'QA Technical Trainer',
      email: 'qa.trainer@farmsking.in',
      role: Role.TECHNICAL_TRAINER,
      roles: [Role.TECHNICAL_TRAINER],
      village: 'Civil Lines',
      district: 'Bathinda',
      state: 'Punjab',
      pincode: '151001',
      isPhoneVerified: true,
      isApproved: true,
      profileStatus: 'APPROVED',
      kycVerified: true,
    },
    // 13. ACCOUNTANT (STAFF)
    {
      mobile: '9000000013',
      kingId: '90000013',
      name: 'QA Platform Accountant',
      email: 'qa.accountant@farmsking.in',
      role: Role.ACCOUNTANT,
      roles: [Role.ACCOUNTANT],
      village: 'Mall Road',
      district: 'Ludhiana',
      state: 'Punjab',
      pincode: '141001',
      isPhoneVerified: true,
      isApproved: true,
      profileStatus: 'APPROVED',
      kycVerified: true,
    },
    // 14. SELLER (AGRI STORE DEALER)
    {
      mobile: '9000000014',
      kingId: '90000014',
      name: 'QA Certified Agri Dealer',
      email: 'qa.seller@farmsking.in',
      role: Role.SELLER,
      roles: [Role.SELLER],
      village: 'Mandi Gobindgarh',
      district: 'Fatehgarh Sahib',
      state: 'Punjab',
      pincode: '147301',
      isPhoneVerified: true,
      isApproved: true,
      profileStatus: 'APPROVED',
      kycVerified: true,
      upiId: 'qa.seller@upi',
      gstin: '03AAHCS9014S1Z8',
      panNumber: 'AAHCS9014S',
      mandiLicenseNo: 'PB-MND-9014-LIC',
    },
    // 15. TRADER (APMC COMMODITY BUYER)
    {
      mobile: '9000000015',
      kingId: '90000015',
      name: 'QA Mandi Commodity Trader',
      email: 'qa.trader@farmsking.in',
      role: Role.TRADER,
      roles: [Role.TRADER, Role.CUSTOMER],
      village: 'Khanna Mandi',
      district: 'Ludhiana',
      state: 'Punjab',
      pincode: '141401',
      isPhoneVerified: true,
      isApproved: true,
      profileStatus: 'APPROVED',
      kycVerified: true,
      mandiLicenseNo: 'APMC-KHN-TRD-9015',
    },
    // 16. GARDENER (URBAN GROWER)
    {
      mobile: '9000000016',
      kingId: '90000016',
      name: 'QA Terrace Gardener',
      email: 'qa.gardener@farmsking.in',
      role: Role.GARDENER,
      roles: [Role.GARDENER, Role.CUSTOMER],
      village: 'Phase 7, Mohali',
      district: 'SAS Nagar',
      state: 'Punjab',
      pincode: '160062',
      isPhoneVerified: true,
      isApproved: true,
      profileStatus: 'APPROVED',
    },
    // 17. SUPERVISOR (FARM STAFF)
    {
      mobile: '9000000017',
      kingId: '90000017',
      name: 'QA Farm Field Supervisor',
      email: 'qa.supervisor@farmsking.in',
      role: Role.SUPERVISOR,
      roles: [Role.SUPERVISOR, Role.CUSTOMER],
      village: 'Kotkapura Road',
      district: 'Faridkot',
      state: 'Punjab',
      pincode: '151204',
      isPhoneVerified: true,
      isApproved: true,
      profileStatus: 'APPROVED',
      supervisorPermissions: [
        SupervisorPermission.ASSIGNED_FARMS_ONLY,
        SupervisorPermission.MANAGE_SPRAY_SCHEDULE,
        SupervisorPermission.MANAGE_LABOUR_EXPENSES,
        SupervisorPermission.CROP_DOCTOR_CHAT,
        SupervisorPermission.MANAGE_HARVEST_SALES,
        SupervisorPermission.VIEW_FINANCES,
      ],
    },
    // 18. LABOUR (FIELD WORKER)
    {
      mobile: '9000000018',
      kingId: '90000018',
      name: 'QA Field Worker',
      email: 'qa.labour@farmsking.in',
      role: Role.LABOUR,
      roles: [Role.LABOUR, Role.CUSTOMER],
      village: 'Kotkapura Road',
      district: 'Faridkot',
      state: 'Punjab',
      pincode: '151204',
      isPhoneVerified: true,
      isApproved: true,
      profileStatus: 'APPROVED',
    },
  ];

  const createdMap = {};

  for (const acc of accounts) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { mobile: acc.mobile },
          { kingId: acc.kingId },
        ],
      },
    });

    const dataToSave = {
      ...acc,
      passwordHash,
    };

    let user;
    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: dataToSave,
      });
      console.log(`🔄 Updated existing user ${acc.mobile} (${acc.role}): ${user.name}`);
    } else {
      user = await prisma.user.create({
        data: dataToSave,
      });
      console.log(`✨ Created user ${acc.mobile} (${acc.role}): ${user.name}`);
    }
    createdMap[acc.role] = user;
    createdMap[acc.mobile] = user;
  }

  // Link Supervisor and Labour to Employer Paid Farmer (9000000005)
  const paidFarmer = createdMap['9000000005'];
  if (paidFarmer) {
    const supervisor = createdMap['9000000017'];
    if (supervisor) {
      await prisma.user.update({
        where: { id: supervisor.id },
        data: { employerFarmerId: paidFarmer.id },
      });
      console.log('🔗 Linked QA Supervisor (9000000017) to Employer Paid Farmer (9000000005)');
    }

    const labour = createdMap['9000000018'];
    if (labour) {
      await prisma.user.update({
        where: { id: labour.id },
        data: { employerFarmerId: paidFarmer.id },
      });

      // Also ensure labourWorker record exists under paid farmer
      const existingWorker = await prisma.labourWorker.findFirst({
        where: { farmerId: paidFarmer.id, mobile: '9000000018' },
      });
      if (!existingWorker) {
        await prisma.labourWorker.create({
          data: {
            farmerId: paidFarmer.id,
            name: labour.name,
            mobile: labour.mobile,
            defaultDailyWage: 450,
            defaultRate: 450,
            defaultUnit: 'DAILY',
            userId: labour.id,
          },
        });
        console.log('👷 Created LabourWorker record under Paid Farmer');
      }
    }

    // Set up a Sample Farm and Plot for Paid Farmer (9000000005)
    let paidFarm = await prisma.farm.findFirst({
      where: { ownerId: paidFarmer.id },
    });
    if (!paidFarm) {
      paidFarm = await prisma.farm.create({
        data: {
          ownerId: paidFarmer.id,
          name: 'QA VIP Heritage Farm',
          village: 'Kotkapura Road',
          district: 'Faridkot',
          state: 'Punjab',
          totalArea: 25.0,
          areaUnit: AreaUnit.ACRE,
          soilType: 'LOAMY',
          irrigationSource: 'CANAL',
        },
      });
      console.log('🌾 Created QA VIP Farm for Paid Farmer');
    }

    let paidPlot = await prisma.plot.findFirst({
      where: { farmId: paidFarm.id },
    });
    if (!paidPlot) {
      paidPlot = await prisma.plot.create({
        data: {
          farmId: paidFarm.id,
          name: 'East Canal Sector A',
          area: 10.0,
          areaUnit: AreaUnit.ACRE,
          soilType: 'LOAMY',
          irrigationType: 'CANAL',
        },
      });
      console.log('🌱 Created Plot East Canal Sector A');
    }

    let paidCrop = await prisma.cropCycle.findFirst({
      where: { plotId: paidPlot.id },
    });
    if (!paidCrop) {
      paidCrop = await prisma.cropCycle.create({
        data: {
          plotId: paidPlot.id,
          cropName: 'Wheat',
          variety: 'PBW 824 High Yield',
          category: CropCategory.GRAINS,
          status: CropStatus.ACTIVE,
          sowingDate: new Date('2026-11-01'),
          expectedHarvestDate: new Date('2027-04-15'),
          area: 10.0,
        },
      });
      console.log('🌾 Created Sample Wheat Crop for Paid Farmer');
    }

    // Give Paid Farmer an active PRO / VIP subscription
    const existingPlan = await prisma.farmerPlan.findUnique({
      where: { farmerId: paidFarmer.id },
    });
    const now = new Date();
    const nextYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    if (!existingPlan) {
      await prisma.farmerPlan.create({
        data: {
          farmerId: paidFarmer.id,
          plan: FarmerSubscriptionPlan.VIP,
          startDate: now,
          endDate: nextYear,
        },
      });
      console.log('⭐ Granted 1-Year Active VIP Plan to Paid Farmer (9000000005)');
    } else {
      await prisma.farmerPlan.update({
        where: { farmerId: paidFarmer.id },
        data: {
          plan: FarmerSubscriptionPlan.VIP,
          startDate: now,
          endDate: nextYear,
        },
      });
      console.log('⭐ Updated to 1-Year Active VIP Plan for Paid Farmer (9000000005)');
    }
  }

  // Set up a Sample Farm and Plot for Free Farmer (9000000004)
  const freeFarmer = createdMap['9000000004'];
  if (freeFarmer) {
    let freeFarm = await prisma.farm.findFirst({
      where: { ownerId: freeFarmer.id },
    });
    if (!freeFarm) {
      freeFarm = await prisma.farm.create({
        data: {
          ownerId: freeFarmer.id,
          name: 'QA Green Acres Farm',
          village: 'Village Booh',
          district: 'Kapurthala',
          state: 'Punjab',
          totalArea: 4.5,
          areaUnit: AreaUnit.ACRE,
          soilType: 'ALLUVIAL',
          irrigationSource: 'BOREWELL',
        },
      });
      console.log('🌾 Created QA Green Acres Farm for Free Farmer');
    }

    let freePlot = await prisma.plot.findFirst({
      where: { farmId: freeFarm.id },
    });
    if (!freePlot) {
      freePlot = await prisma.plot.create({
        data: {
          farmId: freeFarm.id,
          name: 'Home Plot #1',
          area: 4.5,
          areaUnit: AreaUnit.ACRE,
          soilType: 'ALLUVIAL',
          irrigationType: 'BOREWELL',
        },
      });
      console.log('🌱 Created Home Plot #1 for Free Farmer');
    }

    let freeCrop = await prisma.cropCycle.findFirst({
      where: { plotId: freePlot.id },
    });
    if (!freeCrop) {
      freeCrop = await prisma.cropCycle.create({
        data: {
          plotId: freePlot.id,
          cropName: 'Mustard',
          variety: 'Giriraj',
          category: CropCategory.CASH_CROP,
          status: CropStatus.ACTIVE,
          sowingDate: new Date('2026-10-20'),
          expectedHarvestDate: new Date('2027-03-20'),
          area: 4.5,
        },
      });
      console.log('🌼 Created Sample Mustard Crop for Free Farmer');
    }

    const existingFreePlan = await prisma.farmerPlan.findUnique({
      where: { farmerId: freeFarmer.id },
    });
    if (!existingFreePlan) {
      await prisma.farmerPlan.create({
        data: {
          farmerId: freeFarmer.id,
          plan: FarmerSubscriptionPlan.FREE,
          startDate: new Date(),
          endDate: null,
        },
      });
      console.log('🌾 Initialized FREE Farmer Plan for QA Free Farmer (9000000004)');
    }
  }

  // Set up a Sample Garden for Gardener (9000000016)
  const gardener = createdMap['9000000016'];
  if (gardener) {
    let garden = await prisma.garden.findFirst({
      where: { gardenerId: gardener.id },
    });
    if (!garden) {
      garden = await prisma.garden.create({
        data: {
          gardenerId: gardener.id,
          name: 'QA Rooftop Terrace Sanctuary',
          location: 'Terrace Floor, Phase 7 Mohali',
          area: 1200,
        },
      });
      console.log('🪴 Created Rooftop Terrace Garden for QA Gardener');
    }
  }

  // Set up a Sample Nursery Batch for Nursery Owner (9000000010)
  const nurseryOwner = createdMap['9000000010'];
  if (nurseryOwner) {
    let batch = await prisma.plotNurseryBatch.findFirst({
      where: { ownerId: nurseryOwner.id },
    });
    if (!batch) {
      const now = new Date();
      const ready = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const deadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      batch = await prisma.plotNurseryBatch.create({
        data: {
          ownerId: nurseryOwner.id,
          category: 'FLOWER_PLUG_EXPRESS',
          varietyName: 'Marigold Calcutta Orange Certified',
          sowingDate: new Date('2026-09-01'),
          readyDate: ready,
          uprootingDeadline: deadline,
          pricePerUnit: 25.0,
          estimatedCapacity: 2500,
          stage: 'READY_FOR_SALE',
          isSeedCertified: true,
        },
      });
      console.log('🌿 Created Sample Nursery Batch for Nursery Owner');
    }
  }

  // Set up Sample Products for Seller (9000000014)
  const seller = createdMap['9000000014'];
  if (seller) {
    let product = await prisma.product.findFirst({
      where: { createdById: seller.id },
    });
    if (!product) {
      product = await prisma.product.create({
        data: {
          createdById: seller.id,
          name: 'FarmsKing Premium Bio-NPK Granules 25kg',
          brand: 'FarmsKing BioTech',
          category: 'Bio Fertilizer',
          price: 650.0,
          sellingPrice: 650.0,
          mrp: 850.0,
          stockQty: 200,
          description: '100% genuine biological nitrogen, phosphorus, and potassium consortium with mycorrhiza.',
        },
      });
      console.log('🛒 Created Sample Product for QA Seller');
    }
  }

  console.log('\n=============================================================');
  console.log('🎉 ALL 18 ROLE-WISE TEST ACCOUNTS GENERATED SUCCESSFULLY!');
  console.log('=============================================================');
  console.log('Universal Password:   Test@1234');
  console.log('Universal Dev/QA OTP: 123456');
  console.log('=============================================================');
}

main()
  .catch((e) => {
    console.error('❌ Error generating test accounts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
