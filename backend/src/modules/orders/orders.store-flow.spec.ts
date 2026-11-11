import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderPaymentMode, OrderStatus, ProductModerationStatus, Role, SellerKycStatus, SubOrderStatus, WalletTransactionType } from '@prisma/client';
import { BillingService } from './billing.service';
import { OrdersService } from './orders.service';
import { ProductsService } from '../products/products.service';
import { SellerService } from '../seller/seller.service';

describe('Store System End-to-End Guards, Financial & Tax Audit', () => {
  describe('BillingService GST & A4 Compliance', () => {
    const mockPrisma = {} as any;
    const billing = new BillingService(mockPrisma);

    it('charges 0% TCS and 0% GST for unregistered Farmer sellers', () => {
      const res = billing.calculateGstAndTcs({
        grossPrice: 1000,
        isPriceInclusiveOfGst: true,
        productGstPercentage: 5,
        sellerGstin: null,
        sellerCommissionRate: 5,
      });

      expect(res.isSellerGstRegistered).toBe(false);
      expect(res.productGstAmount).toBe(0);
      expect(res.tcsRate).toBe(0);
      expect(res.tcsAmount).toBe(0);
      expect(res.commissionAmount).toBe(50);
      expect(res.commissionGstAmount).toBe(9);
      expect(res.netSellerPayout).toBe(941);
    });

    it('charges 1% TCS on net taxable value (excluding GST) for GSTIN sellers', () => {
      const res = billing.calculateGstAndTcs({
        grossPrice: 1180,
        isPriceInclusiveOfGst: true,
        productGstPercentage: 18,
        sellerGstin: '03AAAAA1234A1Z5',
        sellerCommissionRate: 5,
      });

      expect(res.isSellerGstRegistered).toBe(true);
      expect(res.netTaxableAmount).toBe(1000);
      expect(res.productGstAmount).toBe(180);
      expect(res.tcsAmount).toBe(10);
      expect(res.commissionAmount).toBe(50);
    });

    it('renders invoices with official FARMSKING TECHNOLOGIES PRIVATE LIMITED header and @page A4 CSS', () => {
      const html = billing.renderInvoiceHtml({
        invoiceNumber: 'FK-INV-2627-000001',
        issuedAt: new Date().toISOString(),
        sellerName: 'Test Farmer Store',
        sellerGstin: null,
        customerName: 'Harpreet Singh',
        customerGstin: null,
        invoiceType: 'CUSTOMER_INVOICE',
        netTaxableAmount: 500,
        gstAmount: 0,
        tcsAmount: 0,
        grossAmount: 500,
      });

      expect(html).toContain('FARMSKING TECHNOLOGIES PRIVATE LIMITED');
      expect(html).toContain('VPO Goindwal Sahib');
      expect(html).toContain('@page { size: A4; margin: 12mm 15mm; }');
    });
  });

  describe('ProductsService Security & Ownership', () => {
    it('prevents Seller A from modifying or deactivating Seller B products', async () => {
      const mockPrisma: any = {
        product: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'prod-1',
            sellerStore: { id: 'store-b', sellerId: 'seller-b' },
          }),
        },
      };
      const productsService = new ProductsService(mockPrisma);

      await expect(
        productsService.update({ id: 'seller-a', role: Role.SELLER } as any, 'prod-1', { isActive: false }),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        productsService.remove({ id: 'seller-a', role: Role.SELLER } as any, 'prod-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('scopes SELLER listAll(includeInactive=true) strictly to own store', async () => {
      const mockPrisma: any = {
        sellerStore: { findUnique: jest.fn().mockResolvedValue({ id: 'store-a' }) },
        product: { findMany: jest.fn().mockResolvedValue([]) },
      };
      const productsService = new ProductsService(mockPrisma);

      await productsService.listAll({ id: 'seller-a', role: Role.SELLER } as any, true);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sellerStoreId: 'store-a' },
        }),
      );
    });

    it('blocks unverified seller stores from listing products', async () => {
      const mockPrisma: any = {
        sellerStore: {
          findUnique: jest.fn().mockResolvedValue({ id: 'store-a', sellerId: 'seller-a', kycStatus: SellerKycStatus.SUBMITTED }),
        },
      };
      const productsService = new ProductsService(mockPrisma);

      await expect(
        productsService.create({ id: 'seller-a', role: Role.SELLER } as any, {
          name: 'Urea 45kg',
          price: 266,
          categorySlug: 'bio-fertilizers',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('OrdersService Financials, Wallet Atomicity & Auth', () => {
    function makeOrdersService(prismaMock: any) {
      return new OrdersService(
        prismaMock,
        { create: jest.fn().mockResolvedValue(null) } as any,
        { getActiveForOrder: jest.fn().mockResolvedValue(null) } as any,
        { getBalance: jest.fn().mockResolvedValue(0), credit: jest.fn() } as any,
        { get: jest.fn().mockResolvedValue({ walletTaxEnabled: true, walletUsagePlatformFeePercent: 2, walletUsageGstPercent: 18 }), getIntegrations: jest.fn().mockResolvedValue({}) } as any,
        {} as any,
        { createShipmentOrder: jest.fn() } as any,
        {} as any,
        { createInvoicesForOrder: jest.fn().mockResolvedValue([]), renderInvoiceHtml: jest.fn().mockReturnValue('<html></html>') } as any,
        { sendOrderPlacedConfirmationEmail: jest.fn().mockResolvedValue(null), sendAdminOrderAlertEmail: jest.fn().mockResolvedValue(null) } as any,
        { sendDirectTextMessage: jest.fn().mockResolvedValue(null) } as any,
        { sendOrderPlacedSms: jest.fn().mockResolvedValue(null) } as any,
      );
    }

    it('applies bulk discount consistently on CustomerOrderItem & SubOrder, sets 0% TCS for farmer, and debits fee+GST with wallet usage', async () => {
      let createdOrderArgs: any;
      let createdSubOrderArgs: any;
      const walletCreates: any[] = [];

      const txMock: any = {
        walletTransaction: {
          aggregate: jest.fn()
            .mockResolvedValueOnce({ _sum: { amount: 1000 } })
            .mockResolvedValueOnce({ _sum: { amount: 0 } }),
          create: jest.fn().mockImplementation(async (args) => {
            walletCreates.push(args.data);
            return args.data;
          }),
        },
        customerOrder: {
          create: jest.fn().mockImplementation(async (args) => {
            createdOrderArgs = args.data;
            return {
              id: 'order-1',
              orderNumber: args.data.orderNumber,
              totalAmount: args.data.totalAmount,
              customerId: args.data.customerId,
              items: [],
              subOrders: [],
            };
          }),
        },
        product: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        sellerStore: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'store-farmer',
            gstin: null,
            commissionRate: 5,
          }),
        },
        subOrder: {
          create: jest.fn().mockImplementation(async (args) => {
            createdSubOrderArgs = args.data;
            return args.data;
          }),
        },
      };

      const prismaMock: any = {
        product: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'prod-1',
              name: 'Organic Wheat Seed',
              price: 100,
              stockQty: 50,
              isActive: true,
              isCodAllowed: true,
              weightKg: 1,
              categorySlug: 'seeds',
              bulkDiscountMinQty: 5,
              bulkDiscountPercentage: 10, // ₹90 effective unit price for qty >= 5
              sellerStoreId: 'store-farmer',
              sellerStore: { id: 'store-farmer', gstin: null, commissionRate: 5 },
            },
          ]),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue({ id: 'cust-1', name: 'Harpreet', mobile: '9876543210', email: null }),
        },
        $queryRaw: jest.fn().mockResolvedValue([{ id: 'store-farmer', categoryCommissions: { seeds: 4 } }]),
        $transaction: jest.fn().mockImplementation(async (fn) => fn(txMock)),
      };

      const svc = makeOrdersService(prismaMock);
      await svc.create(
        { id: 'cust-1', role: Role.CUSTOMER } as any,
        {
          items: [{ productId: 'prod-1', quantity: 5 }],
          paymentMode: OrderPaymentMode.COD,
          useWalletBalance: true,
          deliveryAddress: 'VPO Goindwal Sahib',
        },
      );

      // 5 * ₹90 (10% bulk discount) = ₹450 gross
      expect(createdOrderArgs.items.create[0].price).toBe(90);
      expect(createdOrderArgs.items.create[0].subtotal).toBe(450);
      expect(createdOrderArgs.items.create[0].tcsAmount).toBe(0); // Farmer has no GSTIN -> 0 TCS

      // Category commission for seeds = 4% on ₹450 = ₹18; net = ₹432
      expect(createdSubOrderArgs.subtotal).toBe(450);
      expect(createdSubOrderArgs.commissionAmount).toBe(18);
      expect(createdSubOrderArgs.vendorNetPayout).toBe(432);

      // Wallet covers full ₹450 + 2% fee (₹9) + 18% GST on fee (₹1.62) = ₹460.62
      expect(walletCreates).toHaveLength(1);
      expect(walletCreates[0].type).toBe(WalletTransactionType.DEBIT);
      expect(walletCreates[0].amount).toBe(460.62);
      expect(createdOrderArgs.totalAmount).toBe(0);
    });

    it('refunds debited wallet amount back to customer when an order is cancelled', async () => {
      const creditCalls: any[] = [];
      const txMock: any = {
        customerOrder: { update: jest.fn().mockResolvedValue({ id: 'ord-1', status: OrderStatus.CANCELLED }) },
        subOrder: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        product: { update: jest.fn().mockResolvedValue({}) },
        walletTransaction: {
          findFirst: jest.fn()
            .mockResolvedValueOnce({ id: 'tx-deb', amount: 460.62 }) // debitTx exists
            .mockResolvedValueOnce(null), // not yet refunded
          create: jest.fn().mockImplementation(async (args) => {
            creditCalls.push(args.data);
            return args.data;
          }),
        },
      };
      const prismaMock: any = {
        customerOrder: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'ord-1',
            orderNumber: 'ORD-TEST-1',
            customerId: 'cust-1',
            status: OrderStatus.PLACED,
            walletUsedAmount: 450,
            items: [{ productId: 'prod-1', quantity: 5 }],
            subOrders: [],
          }),
        },
        $transaction: jest.fn().mockImplementation(async (fn) => fn(txMock)),
      };

      const svc = makeOrdersService(prismaMock);
      await svc.cancel({ id: 'cust-1', role: Role.CUSTOMER } as any, 'ord-1');

      expect(creditCalls).toHaveLength(1);
      expect(creditCalls[0].type).toBe(WalletTransactionType.CREDIT);
      expect(creditCalls[0].amount).toBe(460.62);
    });

    it('blocks unauthorized user from reading another customer or seller invoice HTML', async () => {
      const prismaMock: any = {
        orderInvoice: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'inv-1',
            order: { customerId: 'cust-owner' },
            sellerStore: { sellerId: 'seller-owner' },
          }),
        },
      };
      const svc = makeOrdersService(prismaMock);

      await expect(
        svc.getInvoiceHtml({ id: 'random-user', role: Role.CUSTOMER } as any, 'inv-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('SellerService SubOrder Isolation', () => {
    it('prevents Seller A from updating Seller B SubOrder status', async () => {
      const prismaMock: any = {
        sellerStore: { findUnique: jest.fn().mockResolvedValue({ id: 'store-a', kycStatus: SellerKycStatus.VERIFIED }) },
        subOrder: { findUnique: jest.fn().mockResolvedValue({ id: 'sub-b', sellerStoreId: 'store-b', orderStatus: SubOrderStatus.PLACED }) },
      };
      const svc = new SellerService(prismaMock, {} as any, {} as any);

      await expect(
        svc.updateMySubOrderStatus({ id: 'seller-a', role: Role.SELLER } as any, 'sub-b', SubOrderStatus.ACCEPTED),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

