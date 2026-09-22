const { NestFactory } = require('./backend/node_modules/@nestjs/core');
const { AppModule } = require('./backend/dist/app.module');
const { CropsService } = require('./backend/dist/modules/crops/crops.service');

async function testNestCropsMine() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const cropsService = app.get(CropsService);

  const mockUser = {
    id: 'c7d07121-991a-4ff4-9618-0147870d2747',
    mobile: '9872466901',
    role: 'FARMER',
    roles: ['CUSTOMER', 'FARMER'],
    deactivatedRoles: [],
    name: 'Surinder Singh'
  };

  console.log('Testing listMineForFarmer in NestJS container...');
  try {
    const result = await cropsService.listMineForFarmer(mockUser);
    console.log('Result count:', result.length);
    result.forEach(c => console.log(' ->', c.id, c.cropId, c.cropName));
  } catch (err) {
    console.error('NestJS CropsService Error:', err);
  }

  await app.close();
}

testNestCropsMine().catch(console.error);
