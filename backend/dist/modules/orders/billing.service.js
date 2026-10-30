"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = exports.InvoiceTypeEnum = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
var InvoiceTypeEnum;
(function (InvoiceTypeEnum) {
    InvoiceTypeEnum["CUSTOMER_INVOICE"] = "CUSTOMER_INVOICE";
    InvoiceTypeEnum["COMMISSION_INVOICE"] = "COMMISSION_INVOICE";
    InvoiceTypeEnum["PAYOUT_STATEMENT"] = "PAYOUT_STATEMENT";
    InvoiceTypeEnum["CREDIT_NOTE"] = "CREDIT_NOTE";
})(InvoiceTypeEnum || (exports.InvoiceTypeEnum = InvoiceTypeEnum = {}));
let BillingService = class BillingService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = common_1.Logger.name;
    }
    getFinancialYear(date = new Date()) {
        const month = date.getMonth() + 1;
        const fullYear = date.getFullYear();
        const startYear = month >= 4 ? fullYear : fullYear - 1;
        const endYear = startYear + 1;
        return `${startYear.toString().slice(-2)}${endYear.toString().slice(-2)}`;
    }
    async generateNextInvoiceNumber(type, sellerStoreId) {
        const fy = this.getFinancialYear();
        let prefix = 'FK-INV';
        if (type === InvoiceTypeEnum.COMMISSION_INVOICE)
            prefix = 'FK-COM';
        else if (type === InvoiceTypeEnum.PAYOUT_STATEMENT)
            prefix = 'FK-PAY';
        else if (type === InvoiceTypeEnum.CREDIT_NOTE)
            prefix = 'FK-CDN';
        if (sellerStoreId && type === InvoiceTypeEnum.CUSTOMER_INVOICE) {
            const store = await this.prisma.sellerStore.findUnique({
                where: { id: sellerStoreId },
                select: { invoicePrefix: true, invoiceLastSequence: true, slug: true },
            });
            if (store?.invoicePrefix) {
                const nextSeq = (store.invoiceLastSequence || 0) + 1;
                await this.prisma.sellerStore.update({
                    where: { id: sellerStoreId },
                    data: { invoiceLastSequence: nextSeq },
                });
                const seqStr = nextSeq.toString().padStart(6, '0');
                return {
                    invoiceNumber: `${store.invoicePrefix}${fy}-${seqStr}`,
                    financialYear: fy,
                };
            }
        }
        const seqKey = `FY${fy}_${type}`;
        const seqRecord = await this.prisma.invoiceSequence.upsert({
            where: { id: seqKey },
            create: {
                id: seqKey,
                financialYear: fy,
                type: type,
                lastSequence: 1,
            },
            update: {
                lastSequence: { increment: 1 },
            },
        });
        const seqStr = seqRecord.lastSequence.toString().padStart(6, '0');
        return {
            invoiceNumber: `${prefix}-${fy}-${seqStr}`,
            financialYear: fy,
        };
    }
    calculateGstAndTcs(params) {
        const { grossPrice, isPriceInclusiveOfGst = true, productGstPercentage = 0, sellerGstin, sellerCommissionRate = 5, isInterState = false, } = params;
        const isSellerGstRegistered = Boolean(sellerGstin && sellerGstin.trim().length >= 15);
        const gstRate = isSellerGstRegistered ? Number(productGstPercentage || 0) : 0;
        let netTaxableAmount = grossPrice;
        let productGstAmount = 0;
        if (gstRate > 0) {
            if (isPriceInclusiveOfGst) {
                netTaxableAmount = Number((grossPrice / (1 + gstRate / 100)).toFixed(2));
                productGstAmount = Number((grossPrice - netTaxableAmount).toFixed(2));
            }
            else {
                netTaxableAmount = grossPrice;
                productGstAmount = Number(((grossPrice * gstRate) / 100).toFixed(2));
            }
        }
        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;
        if (productGstAmount > 0) {
            if (isInterState) {
                igstAmount = productGstAmount;
            }
            else {
                cgstAmount = Number((productGstAmount / 2).toFixed(2));
                sgstAmount = Number((productGstAmount - cgstAmount).toFixed(2));
            }
        }
        const tcsRate = isSellerGstRegistered ? 1.0 : 0.0;
        const tcsAmount = isSellerGstRegistered
            ? Number(((netTaxableAmount * tcsRate) / 100).toFixed(2))
            : 0.0;
        const commRate = Number(sellerCommissionRate || 5);
        const commissionAmount = Number(((netTaxableAmount * commRate) / 100).toFixed(2));
        const commissionGstRate = 18.0;
        const commissionGstAmount = Number(((commissionAmount * commissionGstRate) / 100).toFixed(2));
        const totalDeductions = Number((tcsAmount + commissionAmount + commissionGstAmount).toFixed(2));
        const totalCollectedFromCustomer = isPriceInclusiveOfGst
            ? grossPrice
            : grossPrice + productGstAmount;
        const netSellerPayout = Number((totalCollectedFromCustomer - totalDeductions).toFixed(2));
        return {
            isSellerGstRegistered,
            grossAmount: totalCollectedFromCustomer,
            netTaxableAmount,
            productGstRate: gstRate,
            productGstAmount,
            cgstAmount,
            sgstAmount,
            igstAmount,
            tcsRate,
            tcsAmount,
            commissionRate: commRate,
            commissionAmount,
            commissionGstRate,
            commissionGstAmount,
            totalDeductions,
            netSellerPayout,
        };
    }
    async createInvoicesForOrder(orderId) {
        const order = await this.prisma.customerOrder.findUnique({
            where: { id: orderId },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true,
                        sellerStore: {
                            include: {
                                seller: true,
                            },
                        },
                    },
                },
                subOrders: {
                    include: {
                        sellerStore: {
                            include: {
                                seller: true,
                            },
                        },
                    },
                },
            },
        });
        if (!order)
            return null;
        const createdInvoices = [];
        const sellerItemsMap = new Map();
        for (const item of order.items) {
            const storeId = item.sellerStoreId || 'PLATFORM_DIRECT';
            if (!sellerItemsMap.has(storeId)) {
                sellerItemsMap.set(storeId, []);
            }
            sellerItemsMap.get(storeId)?.push(item);
        }
        for (const [storeId, items] of sellerItemsMap.entries()) {
            const firstItem = items[0];
            const store = firstItem?.sellerStore;
            const sellerGstin = store?.gstin || null;
            let subOrderTotal = 0;
            let totalNetTaxable = 0;
            let totalGst = 0;
            let totalCgst = 0;
            let totalSgst = 0;
            let totalIgst = 0;
            let totalTcs = 0;
            let totalCommission = 0;
            let totalCommissionGst = 0;
            for (const item of items) {
                const itemGross = Number(item.price) * item.quantity;
                const gstPct = item.product?.gstPercentage ? Number(item.product.gstPercentage) : 0;
                const commPct = store?.commissionRate ? Number(store.commissionRate) : 5;
                const calc = this.calculateGstAndTcs({
                    grossPrice: itemGross,
                    isPriceInclusiveOfGst: true,
                    productGstPercentage: gstPct,
                    sellerGstin: sellerGstin,
                    sellerCommissionRate: commPct,
                });
                subOrderTotal += calc.grossAmount;
                totalNetTaxable += calc.netTaxableAmount;
                totalGst += calc.productGstAmount;
                totalCgst += calc.cgstAmount;
                totalSgst += calc.sgstAmount;
                totalIgst += calc.igstAmount;
                totalTcs += calc.tcsAmount;
                totalCommission += calc.commissionAmount;
                totalCommissionGst += calc.commissionGstAmount;
            }
            const custInv = await this.generateNextInvoiceNumber(InvoiceTypeEnum.CUSTOMER_INVOICE, store?.id);
            const customerInvoice = await this.prisma.orderInvoice.create({
                data: {
                    orderId: order.id,
                    sellerStoreId: store?.id || null,
                    invoiceNumber: custInv.invoiceNumber,
                    financialYear: custInv.financialYear,
                    invoiceType: 'CUSTOMER_INVOICE',
                    customerName: order.customer.name,
                    customerGstin: null,
                    sellerName: store?.storeName || 'FarmsKing Store',
                    sellerGstin: sellerGstin,
                    grossAmount: subOrderTotal,
                    netTaxableAmount: totalNetTaxable,
                    gstAmount: totalGst,
                    cgstAmount: totalCgst,
                    sgstAmount: totalSgst,
                    igstAmount: totalIgst,
                    tcsAmount: totalTcs,
                    commissionAmount: totalCommission,
                    commissionGstAmount: totalCommissionGst,
                },
            });
            const commInv = await this.generateNextInvoiceNumber(InvoiceTypeEnum.COMMISSION_INVOICE);
            const commissionInvoice = await this.prisma.orderInvoice.create({
                data: {
                    orderId: order.id,
                    sellerStoreId: store?.id || null,
                    invoiceNumber: commInv.invoiceNumber,
                    financialYear: commInv.financialYear,
                    invoiceType: 'COMMISSION_INVOICE',
                    customerName: store?.storeName || 'Seller',
                    customerGstin: sellerGstin,
                    sellerName: 'FarmsKing Agriculture Pvt Ltd',
                    sellerGstin: '03AAAAF0000A1Z5',
                    grossAmount: totalCommission + totalCommissionGst,
                    netTaxableAmount: totalCommission,
                    gstAmount: totalCommissionGst,
                    cgstAmount: Number((totalCommissionGst / 2).toFixed(2)),
                    sgstAmount: Number((totalCommissionGst / 2).toFixed(2)),
                    commissionAmount: totalCommission,
                    commissionGstAmount: totalCommissionGst,
                },
            });
            const payInv = await this.generateNextInvoiceNumber(InvoiceTypeEnum.PAYOUT_STATEMENT);
            const payoutStatement = await this.prisma.orderInvoice.create({
                data: {
                    orderId: order.id,
                    sellerStoreId: store?.id || null,
                    invoiceNumber: payInv.invoiceNumber,
                    financialYear: payInv.financialYear,
                    invoiceType: 'PAYOUT_STATEMENT',
                    customerName: store?.storeName || 'Seller',
                    customerGstin: sellerGstin,
                    sellerName: 'FarmsKing Platform',
                    sellerGstin: null,
                    grossAmount: subOrderTotal,
                    netTaxableAmount: totalNetTaxable,
                    gstAmount: totalGst,
                    tcsAmount: totalTcs,
                    commissionAmount: totalCommission,
                    commissionGstAmount: totalCommissionGst,
                },
            });
            createdInvoices.push(customerInvoice, commissionInvoice, payoutStatement);
        }
        return createdInvoices;
    }
    renderInvoiceHtml(invoice) {
        const isExempt = Number(invoice.gstAmount) === 0;
        const documentTitle = isExempt ? 'BILL OF SUPPLY / COMMERCIAL RECEIPT' : 'TAX INVOICE';
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${invoice.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 30px; color: #222; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #16a34a; padding-bottom: 10px; }
    .title { color: #16a34a; font-size: 20px; font-weight: bold; }
    .meta { font-size: 13px; text-align: right; }
    .parties { display: flex; justify-content: space-between; margin: 20px 0; font-size: 14px; }
    .box { width: 48%; border: 1px solid #ddd; padding: 10px; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background: #f4f4f4; }
    .totals { margin-top: 20px; text-align: right; font-size: 14px; }
    .footer { margin-top: 40px; font-size: 11px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">FarmsKing Agriculture Marketplace</div>
      <div style="font-size: 12px; color: #555;">Official E-Commerce Operator (ECO) - Section 52 CGST Act</div>
    </div>
    <div class="meta">
      <strong>${documentTitle}</strong><br/>
      Invoice No: <strong>${invoice.invoiceNumber}</strong><br/>
      Date: ${new Date(invoice.issuedAt).toLocaleDateString('en-IN')}
    </div>
  </div>

  <div class="parties">
    <div class="box">
      <strong>Seller Details:</strong><br/>
      ${invoice.sellerName}<br/>
      GSTIN: ${invoice.sellerGstin || 'Unregistered / Exempt (Farmer)'}<br/>
    </div>
    <div class="box">
      <strong>Customer Details:</strong><br/>
      ${invoice.customerName}<br/>
      GSTIN: ${invoice.customerGstin || 'Unregistered Retail Buyer'}<br/>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Net Taxable Value</th>
        <th>GST Rate</th>
        <th>GST Amount</th>
        <th>TCS (1%)</th>
        <th>Total (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Order Items (${invoice.invoiceType})</td>
        <td>₹${Number(invoice.netTaxableAmount).toFixed(2)}</td>
        <td>${isExempt ? '0% (Exempt)' : 'Taxable'}</td>
        <td>₹${Number(invoice.gstAmount).toFixed(2)}</td>
        <td>₹${Number(invoice.tcsAmount).toFixed(2)}</td>
        <td><strong>₹${Number(invoice.grossAmount).toFixed(2)}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <p>Net Taxable Amount: ₹${Number(invoice.netTaxableAmount).toFixed(2)}</p>
    <p>Product GST: ₹${Number(invoice.gstAmount).toFixed(2)}</p>
    <p>TCS (Section 52): ₹${Number(invoice.tcsAmount).toFixed(2)}</p>
    <h3>Total Invoice Value: ₹${Number(invoice.grossAmount).toFixed(2)}</h3>
  </div>

  <div class="footer">
    This is a computer-generated invoice issued via FarmsKing Platform. No signature required.
  </div>
</body>
</html>
    `;
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BillingService);
//# sourceMappingURL=billing.service.js.map