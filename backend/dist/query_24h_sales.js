"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const market_rates_service_1 = require("./modules/market-rates/market-rates.service");
const prisma = new client_1.PrismaClient();
async function get24hSalesList() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    console.log('Fetching sales since:', since.toISOString());
    const saleBills = await prisma.saleBill.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        include: { farmer: { select: { name: true, state: true } } },
    });
    console.log(`\nTotal Sale Bills in last 24h: ${saleBills.length}`);
    const grouped = new Map();
    for (const bill of saleBills) {
        const items = bill.items;
        if (!Array.isArray(items))
            continue;
        for (const it of items) {
            const cropRaw = it.cropName || it.productName || '';
            const rate = Number(it.rate || it.pricePerUnit || 0);
            const qty = Number(it.qty || it.quantity || 1);
            const amount = Number(it.amount || qty * rate);
            const unit = (it.unit || 'KG').toUpperCase();
            if (!cropRaw || rate <= 0)
                continue;
            const cropName = (0, market_rates_service_1.toEnglishCropName)(cropRaw);
            const key = cropName.toLowerCase();
            if (!grouped.has(key)) {
                grouped.set(key, {
                    cropName,
                    unit,
                    entries: [],
                    minRate: rate,
                    maxRate: rate,
                    totalQty: 0,
                    totalRevenue: 0,
                });
            }
            const g = grouped.get(key);
            g.entries.push({
                billNo: bill.billNo,
                farmerName: bill.farmerName || bill.farmer?.name || 'Unknown',
                qty,
                rate,
                amount,
                time: new Date(it.timestamp || it.createdAt || bill.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            });
            g.minRate = Math.min(g.minRate, rate);
            g.maxRate = Math.max(g.maxRate, rate);
            g.totalQty += qty;
            g.totalRevenue += amount;
        }
    }
    console.log('\n======================================================');
    console.log('      PREVIOUS 24 HOURS - CATEGORY WISE SALE LIST   ');
    console.log('======================================================\n');
    if (grouped.size === 0) {
        console.log('❌ No sale entries found in last 24 hours!');
    }
    for (const [, g] of grouped.entries()) {
        const avgRate = Math.round((g.minRate + g.maxRate) / 2);
        console.log(`🌾 ${g.cropName} (${g.unit})`);
        console.log(`   Min Rate : ₹${g.minRate} / ${g.unit}`);
        console.log(`   Max Rate : ₹${g.maxRate} / ${g.unit}`);
        console.log(`   Avg Rate : ₹${avgRate} / ${g.unit} ((${g.minRate}+${g.maxRate})/2)`);
        console.log(`   Total Qty: ${g.totalQty} ${g.unit}`);
        console.log(`   Revenue  : ₹${g.totalRevenue.toLocaleString('en-IN')}`);
        console.log(`   Entries  : ${g.entries.length}`);
        console.log('   ──────────────────────────────────────────────────');
        for (const e of g.entries) {
            console.log(`   Bill: ${e.billNo} | Farmer: ${e.farmerName} | ${e.qty} ${g.unit} @ ₹${e.rate} = ₹${e.amount} | ${e.time}`);
        }
        console.log('');
    }
    await prisma.$disconnect();
}
get24hSalesList().catch((e) => {
    console.error(e);
    prisma.$disconnect();
});
//# sourceMappingURL=query_24h_sales.js.map