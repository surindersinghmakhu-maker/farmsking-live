import { BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  ECOMMERCE_TCS_RATE_PERCENT,
  computeMarketplaceSettlement,
  computeTdsDeduction,
  detectInterStateSupply,
  isRealStatutoryId,
  isValidGstin,
  isValidPan,
  maskPan,
} from './common/utils/tax-compliance.util';
import { SellerService } from './modules/seller/seller.service';
import { ComplianceService } from './modules/compliance/compliance.service';

describe('Statutory Indian Tax, GST TCS 0.5%, Income Tax TDS & KYC Rules', () => {
  describe('Dummy / Placeholder ID Blocker', () => {
    it('rejects all placeholder GSTIN, PAN, TAN, CIN and FSSAI IDs', () => {
      expect(isRealStatutoryId('03AAAAF0000A1Z5')).toBe(false);
      expect(isRealStatutoryId('03ABCDE1234F1Z5')).toBe(false);
      expect(isRealStatutoryId('AAAAF0000A')).toBe(false);
      expect(isRealStatutoryId('AABCF1234D')).toBe(false);
      expect(isRealStatutoryId('PTLA12345B')).toBe(false);
      expect(isRealStatutoryId('')).toBe(false);
      expect(isRealStatutoryId(null)).toBe(false);

      expect(isValidGstin('03AAAAF0000A1Z5')).toBe(false);
      expect(isValidGstin('03AAFCK1234H1Z2')).toBe(true);
      expect(isValidPan('AAAAF0000A')).toBe(false);
      expect(isValidPan('BXZPS4321K')).toBe(true);
      expect(maskPan('BXZPS4321K')).toBe('BXXXXXX21K');
    });
  });

  describe('CGST Act Sec 52 TCS (0.5%) & 18% Commission GST Settlement', () => {
    it('computes 0.5% TCS strictly on net taxable value and 18% GST on commission', () => {
      expect(ECOMMERCE_TCS_RATE_PERCENT).toBe(0.5);

      const calc = computeMarketplaceSettlement({
        grossAmount: 1180,
        gstPercentage: 18,
        commissionPercent: 8,
        isSellerGstRegistered: true,
        sellerPanNumber: 'BXZPS4321K',
        includeTds194O: true,
      });

      expect(calc.netTaxableAmount).toBe(1000);
      expect(calc.productGstAmount).toBe(180);
      expect(calc.tcsRate).toBe(0.5);
      expect(calc.tcsAmount).toBe(5);
      expect(calc.commissionAmount).toBe(80);
      expect(calc.commissionGstAmount).toBe(14.4);
      expect(calc.tds194OAmount).toBe(1);
      expect(calc.netSellerPayout).toBe(1079.6);
    });

    it('exempts unregistered sellers from Sec 52 TCS while applying Sec 194-O 5% without PAN', () => {
      const calc = computeMarketplaceSettlement({
        grossAmount: 1000,
        gstPercentage: 0,
        commissionPercent: 8,
        isSellerGstRegistered: false,
        sellerPanNumber: null,
        includeTds194O: true,
      });

      expect(calc.tcsAmount).toBe(0);
      expect(calc.commissionAmount).toBe(80);
      expect(calc.commissionGstAmount).toBe(14.4);
      expect(calc.tds194OAmount).toBe(50);
      expect(calc.netSellerPayout).toBe(855.6);
    });
  });

  describe('Income Tax TDS Rates & Sec 206AA Fallback', () => {
    it('applies Sec 194-O (0.1% / 5%), Sec 194-H (2% / 20%), Sec 194-J (10% / 20%)', () => {
      const pan = 'BXZPS4321K';

      const s194O = computeTdsDeduction({ grossAmount: 10000, section: '194O', panNumber: pan });
      expect(s194O.tdsRate).toBe(0.1);
      expect(s194O.tdsAmount).toBe(10);
      expect(s194O.panAvailable).toBe(true);

      const s194ONoPan = computeTdsDeduction({ grossAmount: 10000, section: '194O', panNumber: null });
      expect(s194ONoPan.tdsRate).toBe(5);
      expect(s194ONoPan.tdsAmount).toBe(500);
      expect(s194ONoPan.effectiveSection).toBe('194O/206AA');

      const s194H = computeTdsDeduction({ grossAmount: 5000, section: '194H', panNumber: pan });
      expect(s194H.tdsRate).toBe(2);
      expect(s194H.tdsAmount).toBe(100);

      const s194HNoPan = computeTdsDeduction({ grossAmount: 5000, section: '194H', panNumber: 'AAAAF0000A' });
      expect(s194HNoPan.tdsRate).toBe(20);
      expect(s194HNoPan.tdsAmount).toBe(1000);

      const s194J = computeTdsDeduction({ grossAmount: 5000, section: '194J', panNumber: pan });
      expect(s194J.tdsRate).toBe(10);
      expect(s194J.tdsAmount).toBe(500);
    });
  });

  describe('Inter-State IGST vs Intra-State CGST+SGST Detection', () => {
    it('detects intra-state within Punjab and inter-state across state borders', () => {
      expect(detectInterStateSupply('Punjab', 'Makhu, District Ferozepur, Punjab')).toBe(false);
      expect(detectInterStateSupply('Punjab', 'Karnal, Haryana - 132001')).toBe(true);
    });
  });

  describe('Upfront Seller KYC Gate Enforcement', () => {
    it('rejects commercial seller onboarding without valid PAN, GSTIN, Cheque, and Terms consent', async () => {
      const mockPrisma: any = {
        sellerStore: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue({ name: 'Test Vendor', mobile: '9876543210', role: Role.SELLER, roles: [Role.SELLER], deactivatedRoles: [] }),
        },
      };

      const service = new SellerService(mockPrisma, {} as any, {} as any);

      await expect(
        service.registerStore({ id: 'user-1', role: Role.SELLER } as any, {
          sellerType: 'COMMERCIAL',
          storeName: 'Test Agro Hub',
          slug: 'test-agro-hub',
          panNumber: 'AAAAF0000A',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('GSTR-8 CSV Export (0.5% TCS Split CGST/SGST vs IGST)', () => {
    it('exports statutory 0.5% TCS split cleanly into CGST/SGST and IGST columns', async () => {
      const mockPrisma: any = {
        sellerStore: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'store-1',
              gstin: '03AAFCK1234H1Z2',
              legalName: 'Punjab Seeds Co',
              storeName: 'Punjab Seeds',
              pickupState: 'Punjab',
            },
          ]),
        },
        customerOrderItem: {
          findMany: jest.fn().mockResolvedValue([
            {
              subtotal: 1180,
              price: 1180,
              quantity: 1,
              product: { gstPercentage: 18 },
              order: { deliveryAddress: 'Ludhiana, Punjab' },
            },
            {
              subtotal: 1180,
              price: 1180,
              quantity: 1,
              product: { gstPercentage: 18 },
              order: { deliveryAddress: 'Jaipur, Rajasthan' },
            },
          ]),
        },
      };

      const mockAppSettings: any = { getIntegrations: jest.fn() };
      const compliance = new ComplianceService(mockPrisma, mockAppSettings);
      const csv = await compliance.exportGstr8Csv(11, 2026);

      expect(csv).toContain('03AAFCK1234H1Z2');
      expect(csv).toContain('2000.00');
      expect(csv).toContain('2.50');
      expect(csv).toContain('5.00');
      expect(csv).toContain('10.00');
    });
  });
});
