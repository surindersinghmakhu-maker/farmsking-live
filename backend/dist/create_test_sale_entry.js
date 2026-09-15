"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function normalizeToPerKg(rawRate, rawUnit) {
    if (isNaN(rawRate) || rawRate <= 0)
        return 0;
    const u = (rawUnit || 'KG').toUpperCase();
    if (u.includes('QUINTAL') || u.includes('QTL'))
        return rawRate / 100;
    if (u.includes('50') || u.includes('BAG_50'))
        return rawRate / 50;
    if (u.includes('35') || u.includes('BAG_35'))
        return rawRate / 35;
    if (u.includes('40') || u.includes('MANN'))
        return rawRate / 40;
    if (u.includes('TON'))
        return rawRate / 1000;
    if (u.includes('GRAM') || u.includes('GM'))
        return rawRate * 1000;
    return rawRate;
}
const CROP_ENGLISH_MAP = {
    rose: 'Rose',
    gulab: 'Rose',
    'ਗੁਲਾਬ': 'Rose',
    'गुलाब': 'Rose',
    marigold: 'Marigold',
    genda: 'Marigold',
    'ਗੈਂਦਾ': 'Marigold',
    'गेंदा': 'Marigold',
};
function toEnglishCropName(rawName) {
    if (!rawName)
        return '';
    const cleaned = rawName.split('(')[0].trim();
    const key = cleaned.toLowerCase();
    if (CROP_ENGLISH_MAP[key])
        return CROP_ENGLISH_MAP[key];
    for (const [k, english] of Object.entries(CROP_ENGLISH_MAP)) {
        if (key.includes(k) || k.includes(key))
            return english;
    }
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
async function main() {
    console.log('--- TEST SALE ENTRY CREATION & RATE CALCULATION ---');
    const farmer = await prisma.user.findFirst({
        where: { role: 'FARMER', deletedAt: null },
    });
    if (!farmer) {
        console.error('No farmer user found in DB!');
        return;
    }
    console.log(`Using Farmer: ${farmer.name} (${farmer.id}), State: ${farmer.state || 'Punjab'}`);
    const now = new Date();
    const nowIso = now.toISOString();
    const billNo = `TEST-${Date.now().toString().slice(-6)}`;
    const items = [
        { cropName: 'Marigold', productName: 'Marigold', qty: 10, unit: 'KG', rate: 60, pricePerUnit: 60, timestamp: nowIso },
        { cropName: 'Rose', productName: 'Rose', qty: 5, unit: 'KG', rate: 150, pricePerUnit: 150, timestamp: nowIso },
    ];
    const saleBill = await prisma.saleBill.create({
        data: {
            farmerId: farmer.id,
            billNo,
            farmerName: farmer.name,
            partyName: 'Test Buyer',
            isCash: true,
            amountReceivedMode: 'CASH',
            items: items,
            totalItems: 2,
            totalAmount: 1350,
            amountReceived: 1350,
            thisSaleBalance: 0,
            previousBalance: 0,
            netReceivable: 1350,
            createdAt: now,
        },
    });
    console.log(`✅ Created Sale Bill #${saleBill.billNo} (ID: ${saleBill.id})`);
    for (const item of items) {
        const cleanName = toEnglishCropName(item.cropName);
        await prisma.marketRate.create({
            data: {
                cropName: cleanName,
                variety: 'Farmer Sale',
                market: farmer.district ? `${farmer.district} Mandi` : 'Local Mandi',
                state: farmer.state || 'Punjab',
                district: farmer.district || null,
                modalPrice: Number(item.rate),
                minPrice: Number(item.rate),
                maxPrice: Number(item.rate),
                unit: 'KG',
                rateDate: now,
                source: 'farmer_sale_bill',
            },
        });
        console.log(`✅ Recorded MarketRate record for ${cleanName}: ₹${item.rate}/KG`);
    }
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const since = new Date(Date.now() - ONE_DAY_MS);
    const sinceTime = since.getTime();
    const recentSaleBills = await prisma.saleBill.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true, items: true, farmer: { select: { state: true } } },
    });
    const recentMarketRates = await prisma.marketRate.findMany({
        where: { rateDate: { gte: since }, NOT: { source: 'arhtiya_crop_sale' } },
        select: { cropName: true, unit: true, minPrice: true, maxPrice: true, modalPrice: true, rateDate: true, state: true },
    });
    const targetCrops = ['Rose', 'Marigold'];
    console.log('\n--- CALCULATING LIVE 24H RATES FOR TARGET CROPS ---');
    for (const cropName of targetCrops) {
        const cropKey = cropName.toLowerCase();
        const ratePool = [];
        const matchesCrop = (targetName) => {
            if (!targetName)
                return false;
            const t = targetName.split('(')[0].trim().toLowerCase();
            return t === cropKey || t.includes(cropKey) || cropKey.includes(t);
        };
        for (const bill of recentSaleBills) {
            const bItems = bill.items;
            if (Array.isArray(bItems)) {
                for (const it of bItems) {
                    if (matchesCrop(it.cropName || it.productName)) {
                        const itemTime = it.timestamp || it.createdAt || bill.createdAt;
                        if (itemTime && new Date(itemTime).getTime() >= sinceTime) {
                            const perKg = normalizeToPerKg(Number(it.rate || it.pricePerUnit), it.unit);
                            if (perKg > 0)
                                ratePool.push(perKg);
                        }
                    }
                }
            }
        }
        for (const mr of recentMarketRates) {
            if (matchesCrop(mr.cropName) && mr.rateDate && new Date(mr.rateDate).getTime() >= sinceTime) {
                const perKg = normalizeToPerKg(Number(mr.modalPrice ?? mr.minPrice ?? mr.maxPrice), mr.unit);
                if (perKg > 0)
                    ratePool.push(perKg);
            }
        }
        if (ratePool.length > 0) {
            const minP = Math.min(...ratePool);
            const maxP = Math.max(...ratePool);
            const avgP = Math.round(ratePool.reduce((a, b) => a + b, 0) / ratePool.length);
            console.log(`📊 ${cropName} (Per KG): Avg = ₹${avgP}/KG, Min = ₹${minP}/KG, Max = ₹${maxP}/KG (Samples: ${ratePool.length})`);
        }
        else {
            console.log(`⚠️ ${cropName}: No sales found in last 24h.`);
        }
    }
    console.log('\n--- TEST COMPLETED SUCCESSFULLY ---');
}
main()
    .catch((e) => {
    console.error('Test error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=create_test_sale_entry.js.map