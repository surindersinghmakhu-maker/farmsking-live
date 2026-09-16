"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const market_rates_service_1 = require("./modules/market-rates/market-rates.service");
const prisma = new client_1.PrismaClient();
const marketRatesService = new market_rates_service_1.MarketRatesService(prisma);
async function runTest() {
    console.log('--- STARTING LIVE AVERAGE RATE TEST ---');
    let farmer = await prisma.user.findFirst({ where: { role: 'FARMER' } });
    if (!farmer) {
        farmer = await prisma.user.create({
            data: {
                mobile: '9876543210',
                name: 'Test Farmer',
                role: 'FARMER',
                passwordHash: 'test',
                state: 'Punjab',
            },
        });
    }
    const now = new Date();
    await prisma.saleBill.create({
        data: {
            farmerId: farmer.id,
            billNo: `TEST-BILL-${Date.now()}-1`,
            farmerName: farmer.name || 'Test Farmer',
            partyName: 'Cash Sale',
            isCash: true,
            amountReceivedMode: 'CASH',
            items: [
                { cropName: 'Marigold', qty: 10, rate: 60, unit: 'KG', amount: 600, timestamp: now.toISOString() }
            ],
            totalItems: 1,
            totalAmount: 600,
            amountReceived: 600,
            thisSaleBalance: 0,
            previousBalance: 0,
            netReceivable: 0,
        }
    });
    await prisma.marketRate.create({
        data: {
            cropName: 'Marigold',
            variety: 'Farmer Sale',
            market: 'Local Mandi',
            state: farmer.state || 'Punjab',
            modalPrice: 60,
            minPrice: 60,
            maxPrice: 60,
            unit: 'KG',
            rateDate: now,
            source: 'farmer_sale_bill',
        }
    });
    await prisma.saleBill.create({
        data: {
            farmerId: farmer.id,
            billNo: `TEST-BILL-${Date.now()}-2`,
            farmerName: farmer.name || 'Test Farmer',
            partyName: 'Cash Sale',
            isCash: true,
            amountReceivedMode: 'CASH',
            items: [
                { cropName: 'Marigold', qty: 5, rate: 100, unit: 'KG', amount: 500, timestamp: now.toISOString() }
            ],
            totalItems: 1,
            totalAmount: 500,
            amountReceived: 500,
            thisSaleBalance: 0,
            previousBalance: 0,
            netReceivable: 0,
        }
    });
    await prisma.marketRate.create({
        data: {
            cropName: 'Marigold',
            variety: 'Farmer Sale',
            market: 'Local Mandi',
            state: farmer.state || 'Punjab',
            modalPrice: 100,
            minPrice: 100,
            maxPrice: 100,
            unit: 'KG',
            rateDate: now,
            source: 'farmer_sale_bill',
        }
    });
    const result = await marketRatesService.getMyCropRates({ id: farmer.id, role: 'FARMER' });
    const marigoldRate = result.rates.find((r) => r.cropName.toLowerCase() === 'marigold');
    console.log('\n--- CALCULATED MARKET RATES FOR MARIGOLD ---');
    console.log('Crop:', marigoldRate?.cropName);
    console.log('Local Min Rate:', marigoldRate?.localMinRate, 'RS/KG');
    console.log('Local Max Rate:', marigoldRate?.localMaxRate, 'RS/KG');
    console.log('Local Avg Rate (Formula: (Min+Max)/2):', marigoldRate?.localAvgRate, 'RS/KG');
    console.log('Sample Count:', marigoldRate?.localSampleCount);
    if (marigoldRate &&
        marigoldRate.localMinRate === 60 &&
        marigoldRate.localMaxRate === 100 &&
        marigoldRate.localAvgRate === 80) {
        console.log('\n✅ VERIFICATION SUCCESSFUL! Min=60, Max=100, Avg=(60+100)/2=80 RS/KG!');
    }
    else {
        console.log('\n❌ VERIFICATION FAILED! Check rate values.');
    }
    await prisma.$disconnect();
}
runTest().catch((e) => {
    console.error(e);
    prisma.$disconnect();
});
//# sourceMappingURL=test_live_average.js.map