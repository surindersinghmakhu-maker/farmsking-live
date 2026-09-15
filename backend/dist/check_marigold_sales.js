"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    console.log(`Checking Marigold sales since: ${since24h.toISOString()}\n`);
    const bills = await prisma.saleBill.findMany({
        orderBy: { createdAt: 'desc' },
    });
    console.log(`=== Total Sale Bills in DB: ${bills.length} ===\n`);
    const marigoldBills = [];
    for (const b of bills) {
        const items = b.items || [];
        for (const item of items) {
            const name = String(item.cropName || item.productName || item.crop || '').toLowerCase();
            if (name.includes('marigold') ||
                name.includes('genda') ||
                name.includes('ਗੈਂਦਾ') ||
                name.includes('गेंदा')) {
                const is24h = b.createdAt >= since24h;
                marigoldBills.push({
                    billNo: b.billNo,
                    farmerName: b.farmerName || 'N/A',
                    partyName: b.partyName || 'N/A',
                    cropName: item.cropName || item.productName || name,
                    rate: item.rate || item.pricePerUnit || item.price,
                    unit: item.unit || 'KG',
                    totalWeight: item.totalWeight || item.weight || item.quantity || item.qty,
                    netAmount: item.netAmount || item.totalAmount || item.amount,
                    createdAt: b.createdAt.toISOString(),
                    isWithin24h: is24h,
                });
            }
        }
    }
    console.log('--- 📋 Marigold Sales from SaleBill Table ---');
    if (marigoldBills.length === 0) {
        console.log('No Marigold sales found in SaleBill table.');
    }
    else {
        console.table(marigoldBills);
    }
    const marketRates = await prisma.marketRate.findMany({
        where: {
            OR: [
                { cropName: { contains: 'marigold', mode: 'insensitive' } },
                { cropName: { contains: 'genda', mode: 'insensitive' } },
                { cropName: { contains: 'ਗੈਂਦਾ', mode: 'insensitive' } },
            ],
        },
        orderBy: { rateDate: 'desc' },
    });
    console.log('\n--- 📋 Marigold Entries in MarketRate Table ---');
    if (marketRates.length === 0) {
        console.log('No Marigold entries found in MarketRate table.');
    }
    else {
        console.table(marketRates.map((mr) => ({
            id: mr.id,
            cropName: mr.cropName,
            minPrice: mr.minPrice,
            maxPrice: mr.maxPrice,
            modalPrice: mr.modalPrice,
            unit: mr.unit,
            state: mr.state,
            source: mr.source,
            rateDate: mr.rateDate.toISOString(),
            isWithin24h: mr.rateDate >= since24h,
        })));
    }
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=check_marigold_sales.js.map