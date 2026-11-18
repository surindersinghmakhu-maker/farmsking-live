import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Role, SellerKycStatus, WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import type { AuthUser } from '../../common/types/auth-user.type';
import {
  ECOMMERCE_TCS_RATE_PERCENT,
  TDS_RATES,
  computeTdsDeduction,
  detectInterStateSupply,
  getCurrentFinancialYearAndQuarter,
  isRealStatutoryId,
  isValidGstin,
  isValidPan,
  maskPan,
} from '../../common/utils/tax-compliance.util';
import { convertGstr8ToCsv, Gstr8Record } from '../seller/gstr8-export.util';
import { CreateComplianceRecordDto, UpdateComplianceRecordDto } from './dto/compliance-record.dto';

const DEFAULT_STATUTORY_SEED = [
  {
    category: 'MCA_ROC',
    title: 'Form INC-20A — Declaration of Commencement of Business',
    authority: 'ROC Punjab & Chandigarh (MCA V3)',
    status: 'PENDING',
    assignedTo: 'ADVOCATE',
    notes: 'Mandatory within 180 days of incorporation (CIN U62013PB2026PTC070389) with bank subscription credit proof before commencing paid share operations.',
  },
  {
    category: 'MCA_ROC',
    title: 'First Board Meeting, ADT-1 Statutory Auditor Appointment & Registers',
    authority: 'ROC Punjab & Chandigarh',
    status: 'PENDING',
    assignedTo: 'ADVOCATE',
    notes: 'Hold first Board Meeting within 30 days of incorporation, appoint Chartered Accountant as First Auditor (ADT-1), maintain MBP-1 & Statutory Registers.',
  },
  {
    category: 'GST',
    title: 'Regular & E-Commerce Operator (Sec 52) GSTIN Registration + TCS Portal Activation',
    authority: 'CBIC / Punjab State GST Dept',
    status: 'PENDING',
    assignedTo: 'CA',
    notes: 'Separate E-Commerce Operator TCS registration under Section 52 CGST Act for GSTR-8 filing (0.5% TCS: 0.25% CGST + 0.25% SGST / 0.5% IGST).',
  },
  {
    category: 'INCOME_TAX_TDS',
    title: 'Company PAN, TAN Allotment & Quarterly Form 26Q TDS Return Setup',
    authority: 'Income Tax Dept / NSDL / TRACES',
    status: 'PENDING',
    assignedTo: 'CA',
    notes: 'Deduct & deposit TDS monthly by 7th of next month: Sec 194-O (0.1% / 5% w/o PAN), Sec 194-H (2% / 20% w/o PAN), Sec 194-J (10% / 20% w/o PAN).',
  },
  {
    category: 'AGRI_LICENSE',
    title: 'State Seeds, Insecticide/Pesticide & Fertilizer (Form O) Compliance Supervision',
    authority: 'Directorate of Agriculture, Punjab',
    status: 'IN_PROGRESS',
    assignedTo: 'ADVOCATE',
    notes: 'Ensure every third-party commercial seller holds valid unexpired Seed Act, Insecticides Act 1968 & FCO 1985 certificates prior to catalog activation.',
  },
  {
    category: 'PAYMENT_GATEWAY',
    title: 'Payment Gateway (Cashfree / Razorpay / PhonePe) Website Policy & Escrow Verification',
    authority: 'RBI Licensed PA/PG Underwriters',
    status: 'COMPLIANT',
    assignedTo: 'ADVOCATE',
    notes: 'Published live routes: /terms, /privacy-policy, /refund-policy (5-7 working days card/bank refund), /shipping-policy, /compliance, and named Grievance Officer.',
  },
  {
    category: 'AGREEMENT',
    title: 'Standardized Vendor Marketplace Indemnity Bond & Agent / Advisor Agreements',
    authority: 'IT Act Sec 79 & Indian Contract Act 1872',
    status: 'COMPLIANT',
    assignedTo: 'ADVOCATE',
    notes: 'Digital acceptance recorded with timestamp on SellerStore onboarding, Buyer checkout, and User/Partner onboarding.',
  },
];

@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appSettingsService: AppSettingsService,
  ) {}

  private async ensureInitialStatutoryRecords() {
    const count = await this.prisma.statutoryComplianceRecord.count();
    if (count === 0) {
      await this.prisma.statutoryComplianceRecord.createMany({
        data: DEFAULT_STATUTORY_SEED,
      });
    }
  }

  /** Complete CA, Accountant & Advocate Financial + Tax + KYC + Legal Readiness Report */
  async getCaSummary() {
    await this.ensureInitialStatutoryRecords();

    const now = new Date();
    const { financialYear, quarter } = getCurrentFinancialYearAndQuarter(now);

    const [
      integrations,
      orders,
      invoices,
      sellerPayouts,
      gstr8Reports,
      stores,
      walletStats,
      commissionWallets,
      withdrawals,
      planPayments,
      farmerPlanPayments,
      gardenerPlanPayments,
      advisorsAndAgents,
      traders,
      statutoryRecords,
      tdsLedgers,
    ] = await Promise.all([
      this.appSettingsService.getIntegrations(),
      this.prisma.customerOrder.findMany({
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          discountAmount: true,
          walletUsedAmount: true,
          walletPlatformFee: true,
          walletGstAmount: true,
          paymentMode: true,
          paymentStatus: true,
          status: true,
          deliveryAddress: true,
          orderDate: true,
        },
        orderBy: { orderDate: 'desc' },
        take: 1000,
      }),
      this.prisma.orderInvoice.findMany({
        select: {
          id: true,
          invoiceNumber: true,
          invoiceType: true,
          financialYear: true,
          grossAmount: true,
          netTaxableAmount: true,
          gstAmount: true,
          cgstAmount: true,
          sgstAmount: true,
          igstAmount: true,
          tcsAmount: true,
          tdsAmount: true,
          commissionAmount: true,
          commissionGstAmount: true,
          issuedAt: true,
        },
        orderBy: { issuedAt: 'desc' },
        take: 1000,
      }),
      this.prisma.sellerPayout.findMany({
        include: {
          sellerStore: {
            select: {
              id: true,
              storeName: true,
              legalName: true,
              gstin: true,
              panNumber: true,
              sellerType: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      this.prisma.gstr8Report.findMany({
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 200,
      }),
      this.prisma.sellerStore.findMany({
        include: {
          seller: { select: { id: true, name: true, mobile: true, kingId: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.groupBy({
        by: ['userId', 'type'],
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.findMany({
        where: {
          type: WalletTransactionType.CREDIT,
          OR: [
            { couponRedemptionId: { not: null } },
            { reason: { contains: 'commission', mode: 'insensitive' } },
            { reason: { contains: 'referral', mode: 'insensitive' } },
            { reason: { contains: 'royalty', mode: 'insensitive' } },
            { reason: { contains: 'bonus', mode: 'insensitive' } },
            { reason: { contains: 'consultation', mode: 'insensitive' } },
            { reason: { contains: 'parchi', mode: 'insensitive' } },
          ],
          user: {
            OR: [
              { role: { in: [Role.AGENT, Role.ADVISOR, Role.TECHNICAL_TRAINER] } },
              { roles: { hasSome: [Role.AGENT, Role.ADVISOR, Role.TECHNICAL_TRAINER] } },
            ],
          },
        },
        include: {
          user: {
            select: { id: true, name: true, mobile: true, kingId: true, role: true, roles: true, panNumber: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      this.prisma.withdrawalRequest.findMany({
        select: {
          id: true,
          businessPartnerId: true,
          requestedAmount: true,
          approvedAmount: true,
          platformFeeAmount: true,
          gstAmount: true,
          netPayableAmount: true,
          status: true,
          requestedAt: true,
        },
        take: 500,
      }),
      this.prisma.planPaymentRequest.findMany({
        select: { id: true, amount: true, status: true },
      }),
      this.prisma.farmerPlanPaymentRequest.findMany({
        select: { id: true, amount: true, status: true },
      }),
      this.prisma.gardenerPlanPaymentRequest.findMany({
        select: { id: true, amount: true, status: true },
      }),
      this.prisma.user.findMany({
        where: {
          deletedAt: null,
          OR: [
            { role: { in: [Role.ADVISOR, Role.AGENT, Role.TECHNICAL_TRAINER] } },
            { roles: { hasSome: [Role.ADVISOR, Role.AGENT, Role.TECHNICAL_TRAINER] } },
          ],
        },
        select: {
          id: true,
          name: true,
          mobile: true,
          kingId: true,
          role: true,
          roles: true,
          panNumber: true,
          panDocUrl: true,
          aadhaarLast4: true,
          aadhaarDocUrl: true,
          bankAccountNumber: true,
          bankIfsc: true,
          upiId: true,
          isApproved: true,
          profileStatus: true,
          termsAcceptedAt: true,
        },
      }),
      this.prisma.user.findMany({
        where: {
          deletedAt: null,
          OR: [{ role: Role.TRADER }, { roles: { has: Role.TRADER } }],
        },
        select: {
          id: true,
          name: true,
          mobile: true,
          kingId: true,
          gstin: true,
          panNumber: true,
          mandiLicenseNo: true,
          kycVerified: true,
        },
      }),
      this.prisma.statutoryComplianceRecord.findMany({
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.tdsLedger.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
    ]);

    // 1. Sales & GST Output Summary
    const nonCancelledOrders = orders.filter((o) => o.status !== 'CANCELLED');
    const paidOrders = nonCancelledOrders.filter((o) => o.paymentStatus === 'PAID');
    const grossOrderValue = nonCancelledOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const totalPaidOrderValue = paidOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const totalCouponDiscounts = nonCancelledOrders.reduce((s, o) => s + Number(o.discountAmount || 0), 0);
    const totalWalletFees = nonCancelledOrders.reduce((s, o) => s + Number(o.walletPlatformFee || 0), 0);
    const totalWalletFeeGst = nonCancelledOrders.reduce((s, o) => s + Number(o.walletGstAmount || 0), 0);

    const custInvoices = invoices.filter((i) => i.invoiceType === 'CUSTOMER_INVOICE');
    const commInvoices = invoices.filter((i) => i.invoiceType === 'COMMISSION_INVOICE');

    const productGstOutput = custInvoices.reduce((s, i) => s + Number(i.gstAmount || 0), 0);
    const productCgst = custInvoices.reduce((s, i) => s + Number(i.cgstAmount || 0), 0);
    const productSgst = custInvoices.reduce((s, i) => s + Number(i.sgstAmount || 0), 0);
    const productIgst = custInvoices.reduce((s, i) => s + Number(i.igstAmount || 0), 0);

    const platformCommissionEarned = commInvoices.reduce((s, i) => s + Number(i.commissionAmount || 0), 0);
    const platformCommissionGst = commInvoices.reduce((s, i) => s + Number(i.commissionGstAmount || 0), 0);

    const confirmedAdvisorPlans = planPayments
      .filter((p) => p.status === 'CONFIRMED')
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const confirmedFarmerPlans = farmerPlanPayments
      .filter((p) => p.status === 'CONFIRMED')
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const confirmedGardenerPlans = gardenerPlanPayments
      .filter((p) => p.status === 'CONFIRMED')
      .reduce((s, p) => s + Number(p.amount || 0), 0);

    // 2. Seller Payouts & Sec 52 TCS Summary
    const pendingSellerPayout = sellerPayouts
      .filter((p) => p.status === 'PENDING' || p.status === 'PROCESSING')
      .reduce((s, p) => s + Number(p.netPayoutAmount || 0), 0);
    const settledSellerPayout = sellerPayouts
      .filter((p) => p.status === 'SETTLED')
      .reduce((s, p) => s + Number(p.netPayoutAmount || 0), 0);
    const totalSec52Tcs = sellerPayouts.reduce((s, p) => s + Number(p.totalTcsAmount || 0), 0);

    // 3. Dynamic TDS Summary (Sec 194-O Vendors, Sec 194-H Agents, Sec 194-J Advisors/Trainers)
    const tdsEntries: Array<{
      deducteeId: string;
      deducteeName: string;
      role: string;
      section: string;
      panMasked: string | null;
      panMissing: boolean;
      grossAmount: number;
      tdsRate: number;
      tdsAmount: number;
    }> = [];

    // Aggregate per vendor (194-O)
    const vendorAgg = new Map<string, { name: string; pan?: string | null; gross: number }>();
    for (const p of sellerPayouts) {
      const storeId = p.sellerStoreId;
      const cur = vendorAgg.get(storeId) || {
        name: p.sellerStore?.legalName || p.sellerStore?.storeName || 'Seller',
        pan: p.sellerStore?.panNumber,
        gross: 0,
      };
      cur.gross += Number(p.totalGrossAmount || 0);
      vendorAgg.set(storeId, cur);
    }
    for (const [id, v] of vendorAgg.entries()) {
      const calc = computeTdsDeduction({ grossAmount: v.gross, section: '194O', panNumber: v.pan });
      tdsEntries.push({
        deducteeId: id,
        deducteeName: v.name,
        role: 'SELLER',
        section: calc.effectiveSection,
        panMasked: maskPan(v.pan),
        panMissing: !calc.panAvailable,
        grossAmount: calc.grossAmount,
        tdsRate: calc.tdsRate,
        tdsAmount: calc.tdsAmount,
      });
    }

    // Aggregate per agent/advisor/trainer commission (194-H vs 194-J)
    const partnerAgg = new Map<string, { name: string; role: string; pan?: string | null; gross: number }>();
    for (const tx of commissionWallets) {
      const u = tx.user;
      if (!u) continue;
      const cur = partnerAgg.get(u.id) || {
        name: u.name,
        role: u.role,
        pan: u.panNumber,
        gross: 0,
      };
      cur.gross += Number(tx.amount || 0);
      partnerAgg.set(u.id, cur);
    }
    for (const [id, pt] of partnerAgg.entries()) {
      const sec = pt.role === Role.ADVISOR || pt.role === Role.TECHNICAL_TRAINER ? '194J' : '194H';
      const calc = computeTdsDeduction({ grossAmount: pt.gross, section: sec, panNumber: pt.pan });
      tdsEntries.push({
        deducteeId: id,
        deducteeName: pt.name,
        role: pt.role,
        section: calc.effectiveSection,
        panMasked: maskPan(pt.pan),
        panMissing: !calc.panAvailable,
        grossAmount: calc.grossAmount,
        tdsRate: calc.tdsRate,
        tdsAmount: calc.tdsAmount,
      });
    }

    const totalTds194O = tdsEntries.filter((e) => e.section.startsWith('194O')).reduce((s, e) => s + e.tdsAmount, 0);
    const totalTds194H = tdsEntries.filter((e) => e.section.startsWith('194H')).reduce((s, e) => s + e.tdsAmount, 0);
    const totalTds194J = tdsEntries.filter((e) => e.section.startsWith('194J')).reduce((s, e) => s + e.tdsAmount, 0);
    const panMissingDeductees = tdsEntries.filter((e) => e.panMissing).length;

    // 4. KYC & License Expiry Readiness Audit
    const storeComplianceAudit = stores.map((st) => {
      const issues: string[] = [];
      if (st.sellerType === 'COMMERCIAL' && !isValidGstin(st.gstin)) {
        issues.push('Valid Commercial GSTIN missing');
      }
      if (!isValidPan(st.panNumber)) issues.push('Valid 10-char PAN missing');
      if (!st.bankAccountNo || !st.bankIfsc) issues.push('Bank A/c or IFSC missing');
      if (!st.chequeDocUrl) issues.push('Cancelled Cheque copy missing');
      if (!st.aadhaarFrontUrl) issues.push('Aadhaar document missing');
      if (st.wantsToSellFood && (!st.fssaiNo || !st.fssaiCertificateUrl)) {
        issues.push('FSSAI No/Certificate missing');
      }
      if (st.fssaiExpiryDate && new Date(st.fssaiExpiryDate) < now) {
        issues.push('FSSAI License EXPIRED');
      }
      if (st.agriLicenseExpiryDate && new Date(st.agriLicenseExpiryDate) < now) {
        issues.push('Agri License EXPIRED');
      }
      if ((st as any).seedLicenseExpiry && new Date((st as any).seedLicenseExpiry) < now) {
        issues.push('Seed License EXPIRED');
      }
      if ((st as any).pesticideLicenseExpiry && new Date((st as any).pesticideLicenseExpiry) < now) {
        issues.push('Pesticide License EXPIRED');
      }
      return {
        storeId: st.id,
        storeName: st.storeName,
        legalName: st.legalName || st.storeName,
        sellerType: st.sellerType,
        kycStatus: st.kycStatus,
        gstin: st.gstin || null,
        panMasked: maskPan(st.panNumber),
        ownerName: st.seller?.name,
        ownerMobile: st.seller?.mobile,
        cashfreeOnboarded: Boolean(st.cashfreeVendorId),
        issues,
        isCompliant: issues.length === 0 && st.kycStatus === SellerKycStatus.VERIFIED,
      };
    });

    const partnerKycAudit = advisorsAndAgents.map((u) => {
      const missing: string[] = [];
      if (!isValidPan(u.panNumber)) missing.push('Valid PAN (triggers 20% 206AA TDS)');
      if (!u.bankAccountNumber || !u.bankIfsc) missing.push('Bank A/c / IFSC');
      if (!u.aadhaarLast4 && !u.aadhaarDocUrl) missing.push('Aadhaar Proof');
      return {
        userId: u.id,
        name: u.name,
        kingId: u.kingId,
        mobile: u.mobile,
        role: u.role,
        panMasked: maskPan(u.panNumber),
        hasBank: Boolean(u.bankAccountNumber && u.bankIfsc),
        hasAadhaar: Boolean(u.aadhaarLast4 || u.aadhaarDocUrl),
        missing,
        isKycReady: missing.length === 0,
      };
    });

    const pm = integrations.projectMasterData;
    const rawCompanyGstin = process.env.COMPANY_GSTIN || pm?.taxGst?.gstNumber || integrations.about?.gstin;
    const rawCompanyPan = pm?.taxGst?.panNumber || pm?.companyPan || integrations.about?.pan;
    const rawCompanyTan = pm?.companyTan;

    const companyRegistryReadiness = {
      companyLegalName: pm?.companyLegalName || 'FARMSKING TECHNOLOGIES PRIVATE LIMITED',
      cin: pm?.cinNumber || 'U62013PB2026PTC070389',
      rocJurisdiction: pm?.rocJurisdiction || 'ROC Punjab and Chandigarh',
      registeredAddress: pm?.registeredAddress || 'C/o BALDEV SINGH, VILLAGE BOOH, Kapurthala, Kapurthala, Kapurthala - 144601, Punjab, India',
      operationalHq: pm?.operationalHq || 'Main Market, Makhu, Tehsil Zira, District Ferozepur, Punjab - 142044, India',
      gstinConfigured: isRealStatutoryId(rawCompanyGstin),
      gstin: isRealStatutoryId(rawCompanyGstin) ? rawCompanyGstin : null,
      panConfigured: isRealStatutoryId(rawCompanyPan),
      pan: isRealStatutoryId(rawCompanyPan) ? maskPan(rawCompanyPan) : null,
      tanConfigured: isRealStatutoryId(rawCompanyTan),
      tan: isRealStatutoryId(rawCompanyTan) ? rawCompanyTan : null,
      grievanceOfficerName: pm?.grievanceOfficerName || 'Surinder Singh',
      grievanceOfficerEmail: pm?.grievanceOfficerEmail || 'grievance@farmsking.in',
      supportPhone: pm?.primaryMobile || '+91 95776 22000',
      supportEmail: pm?.supportEmail || 'support@farmsking.in',
      paymentGateways: {
        activeGateway: integrations.gateway?.activeGateway || 'PHONEPE',
        isSandbox: integrations.gateway?.isSandbox ?? true,
        cashfreeConfigured: Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY && process.env.CASHFREE_SECRET_KEY !== 'TEST_SECRET_KEY'),
        razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
        phonepeConfigured: Boolean(process.env.PHONEPE_CLIENT_ID && process.env.PHONEPE_CLIENT_SECRET),
        shiprocketConfigured: Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_WEBHOOK_SECRET),
      },
    };

    const userWalletBalances = new Map<string, number>();
    for (const row of walletStats) {
      const amt = Number(row._sum?.amount || 0);
      const prev = userWalletBalances.get(row.userId) || 0;
      userWalletBalances.set(
        row.userId,
        row.type === WalletTransactionType.CREDIT ? prev + amt : prev - amt,
      );
    }
    let walletLiabilityTotal = 0;
    let activeWalletsCount = 0;
    for (const bal of userWalletBalances.values()) {
      if (bal > 0) {
        walletLiabilityTotal += bal;
        activeWalletsCount += 1;
      }
    }

    return {
      generatedAt: now.toISOString(),
      financialYear,
      currentQuarter: quarter,
      taxRatesApplied: {
        tcsSec52RatePercent: ECOMMERCE_TCS_RATE_PERCENT,
        tds194OWithPanPercent: TDS_RATES.SEC_194O_WITH_PAN,
        tds194OWithoutPanPercent: TDS_RATES.SEC_194O_NO_PAN_206AA,
        tds194HWithPanPercent: TDS_RATES.SEC_194H_WITH_PAN,
        tds194HWithoutPanPercent: TDS_RATES.SEC_194H_NO_PAN_206AA,
        tds194JWithPanPercent: TDS_RATES.SEC_194J_WITH_PAN,
        tds194JWithoutPanPercent: TDS_RATES.SEC_194J_NO_PAN_206AA,
      },
      financialAccounts: {
        totalOrdersCount: nonCancelledOrders.length,
        paidOrdersCount: paidOrders.length,
        grossOrderValue: Number(grossOrderValue.toFixed(2)),
        totalPaidOrderValue: Number(totalPaidOrderValue.toFixed(2)),
        totalCouponDiscounts: Number(totalCouponDiscounts.toFixed(2)),
        totalWalletFees: Number(totalWalletFees.toFixed(2)),
        totalWalletFeeGst: Number(totalWalletFeeGst.toFixed(2)),
        planSubscriptionRevenue: Number((confirmedAdvisorPlans + confirmedFarmerPlans + confirmedGardenerPlans).toFixed(2)),
        productGstOutput: Number(productGstOutput.toFixed(2)),
        productCgst: Number(productCgst.toFixed(2)),
        productSgst: Number(productSgst.toFixed(2)),
        productIgst: Number(productIgst.toFixed(2)),
        platformCommissionEarned: Number(platformCommissionEarned.toFixed(2)),
        platformCommissionGst: Number(platformCommissionGst.toFixed(2)),
        pendingSellerPayout: Number(pendingSellerPayout.toFixed(2)),
        settledSellerPayout: Number(settledSellerPayout.toFixed(2)),
        totalSec52Tcs: Number(totalSec52Tcs.toFixed(2)),
        walletLiabilityTotal: Number(walletLiabilityTotal.toFixed(2)),
        activeWalletsCount,
        legacyWithdrawalsCount: withdrawals.length,
      },
      tdsSummary: {
        totalTds194O: Number(totalTds194O.toFixed(2)),
        totalTds194H: Number(totalTds194H.toFixed(2)),
        totalTds194J: Number(totalTds194J.toFixed(2)),
        totalTdsLiability: Number((totalTds194O + totalTds194H + totalTds194J).toFixed(2)),
        panMissingDeductees,
        deductees: tdsEntries,
        recordedChallanRows: tdsLedgers,
      },
      gstr8Count: gstr8Reports.length,
      gstr8Reports: gstr8Reports.slice(0, 50),
      invoices: invoices.slice(0, 60),
      kycComplianceAudit: {
        stores: storeComplianceAudit,
        nonCompliantStoresCount: storeComplianceAudit.filter((s) => !s.isCompliant).length,
        partners: partnerKycAudit,
        nonCompliantPartnersCount: partnerKycAudit.filter((p) => !p.isKycReady).length,
        tradersCount: traders.length,
        tradersWithoutGstinCount: traders.filter((t) => !isValidGstin(t.gstin)).length,
      },
      companyRegistryReadiness,
      statutoryRecords,
    };
  }

  /** Export GSTR-8 Monthly CSV across all GST-registered Seller Stores using statutory 0.5% TCS */
  async exportGstr8Csv(month: number, year: number): Promise<string> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const stores = await this.prisma.sellerStore.findMany({
      select: { id: true, gstin: true, legalName: true, storeName: true, pickupState: true },
    });

    const records: Gstr8Record[] = [];

    for (const store of stores) {
      if (!isValidGstin(store.gstin)) continue;

      const items = await this.prisma.customerOrderItem.findMany({
        where: {
          sellerStoreId: store.id,
          order: {
            orderDate: { gte: startDate, lte: endDate },
            status: { not: 'CANCELLED' },
          },
        },
        include: {
          product: { select: { gstPercentage: true } },
          order: { select: { deliveryAddress: true } },
        },
      });

      if (items.length === 0) continue;

      let totalGross = 0;
      let totalNetTaxable = 0;
      let cgstTcs = 0;
      let sgstTcs = 0;
      let igstTcs = 0;

      for (const item of items) {
        const sub = Number(item.subtotal ?? Number(item.price) * item.quantity);
        const gstPct = Number(item.product?.gstPercentage ?? 0);
        const netTaxable = gstPct > 0 ? Number((sub / (1 + gstPct / 100)).toFixed(2)) : sub;
        const tcs = Number((netTaxable * 0.005).toFixed(2));
        const isInter = detectInterStateSupply(store.pickupState, item.order?.deliveryAddress);

        totalGross += sub;
        totalNetTaxable += netTaxable;
        if (isInter) {
          igstTcs += tcs;
        } else {
          const half = Number((tcs / 2).toFixed(2));
          cgstTcs += half;
          sgstTcs += Number((tcs - half).toFixed(2));
        }
      }

      records.push({
        gstin: store.gstin!,
        legalName: store.legalName || store.storeName,
        tradeName: store.storeName,
        month,
        year,
        totalGrossSales: Number(totalGross.toFixed(2)),
        totalSalesReturn: 0,
        netTaxableValue: Number(totalNetTaxable.toFixed(2)),
        cgstTcsAmount: Number(cgstTcs.toFixed(2)),
        sgstTcsAmount: Number(sgstTcs.toFixed(2)),
        igstTcsAmount: Number(igstTcs.toFixed(2)),
        totalTcsAmount: Number((cgstTcs + sgstTcs + igstTcs).toFixed(2)),
      });
    }

    return convertGstr8ToCsv(records);
  }

  /** Export Income Tax TDS Register CSV for CA Form 26Q quarterly filing */
  async exportTdsCsv(sectionFilter?: string): Promise<string> {
    const summary = await this.getCaSummary();
    const filter = (sectionFilter || 'ALL').toUpperCase();
    const rows = summary.tdsSummary.deductees.filter(
      (d) => filter === 'ALL' || d.section.startsWith(filter),
    );

    const headers = [
      'Deductee ID',
      'Deductee Name',
      'Role',
      'Section',
      'PAN Status',
      'PAN (Masked)',
      'Gross Payable (INR)',
      'TDS Rate (%)',
      'TDS Amount (INR)',
    ];

    const lines = rows.map((r) => [
      `"${r.deducteeId}"`,
      `"${r.deducteeName.replace(/"/g, '""')}"`,
      `"${r.role}"`,
      `"${r.section}"`,
      r.panMissing ? 'MISSING_206AA' : 'VALID',
      `"${r.panMasked || 'NOT_FURNISHED'}"`,
      r.grossAmount.toFixed(2),
      r.tdsRate.toFixed(2),
      r.tdsAmount.toFixed(2),
    ]);

    return [headers.join(','), ...lines.map((l) => l.join(','))].join('\n');
  }

  async listRecords() {
    await this.ensureInitialStatutoryRecords();
    return this.prisma.statutoryComplianceRecord.findMany({
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createRecord(actor: AuthUser, dto: CreateComplianceRecordDto) {
    return this.prisma.statutoryComplianceRecord.create({
      data: {
        category: dto.category,
        title: dto.title.trim(),
        authority: dto.authority?.trim() || null,
        referenceNo: dto.referenceNo?.trim() || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        filedDate: dto.filedDate ? new Date(dto.filedDate) : null,
        status: dto.status || 'PENDING',
        assignedTo: dto.assignedTo || 'ADVOCATE',
        documentUrl: dto.documentUrl?.trim() || null,
        notes: dto.notes?.trim() || null,
        updatedById: actor.id,
      },
    });
  }

  async updateRecord(actor: AuthUser, id: string, dto: UpdateComplianceRecordDto) {
    const existing = await this.prisma.statutoryComplianceRecord.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Compliance record not found.');
    }
    return this.prisma.statutoryComplianceRecord.update({
      where: { id },
      data: {
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.authority !== undefined ? { authority: dto.authority?.trim() || null } : {}),
        ...(dto.referenceNo !== undefined ? { referenceNo: dto.referenceNo?.trim() || null } : {}),
        ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null } : {}),
        ...(dto.filedDate !== undefined ? { filedDate: dto.filedDate ? new Date(dto.filedDate) : null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.assignedTo !== undefined ? { assignedTo: dto.assignedTo } : {}),
        ...(dto.documentUrl !== undefined ? { documentUrl: dto.documentUrl?.trim() || null } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
        updatedById: actor.id,
      },
    });
  }

  /**
   * Master statutory & legal document catalog arranged datewise
   * Covers approved Certificate of Incorporation, e-MoA, e-AoA, AGILE-PRO-S, INC-9, Name Approval & Office NOC
   */
  getStatutoryDocumentsCatalog() {
    return [
      {
        id: 'doc-flex-board-nov-2026',
        date: '18/11/2026',
        orderDate: '2026-11-18',
        title: 'Official Corporate Office Flex Board Design (Section 12(3))',
        category: 'Statutory Board',
        authority: 'Ministry of Corporate Affairs (Companies Act 2013)',
        referenceNo: 'CIN: U62013PB2026PTC070389 | PAN: AAHCF3566C',
        status: 'READY TO PRINT',
        fileSize: '554 KB',
        fileName: '15_OFFICIAL_CORPORATE_FLEX_BOARD_REGISTERED_OFFICE.html',
        downloadKey: 'corporate-flex-board',
        remarks: 'Official registered office nameboard design matching CA drafting with verified logo, CIN, PAN, TAN, Registered Office & contact numbers for flex printing and MCA / GST site photo verification.',
      },
      {
        id: 'doc-coi-nov-2026',
        date: '18/11/2026',
        orderDate: '2026-11-18',
        title: 'Certificate of Incorporation (SPICe+ Part B Approval)',
        category: 'MCA / ROC',
        authority: 'Central Registration Centre, Ministry of Corporate Affairs',
        referenceNo: 'SRN: AC7349109 | CIN: U62013PB2026PTC070389',
        status: 'APPROVED / PERMANENT',
        fileSize: '74.1 KB',
        fileName: '14_OFFICIAL_CERTIFICATE_OF_INCORPORATION_MCA.pdf',
        downloadKey: 'certificate-of-incorporation',
        remarks: 'Official Government Certificate of Incorporation establishing FARMSKING TECHNOLOGIES PRIVATE LIMITED. Allots CIN, PAN (AAHCF3566C), TAN (AMRF11527F).',
      },
      {
        id: 'doc-spice-b-signed-nov-2026',
        date: '18/11/2026',
        orderDate: '2026-11-18',
        title: 'Form SPICe+ Part B — Master Incorporation Application (Signed)',
        category: 'MCA / ROC',
        authority: 'Ministry of Corporate Affairs (MCA V3)',
        referenceNo: 'SRN: AC7349109 (Resubmission Approved)',
        status: 'APPROVED / FILED',
        fileSize: '8.28 MB',
        fileName: 'SPICE + Part B_AC7349109 signed.pdf',
        downloadKey: 'spice-part-b-signed',
        remarks: 'Final DSC-signed master incorporation form with director shareholding, authorized capital (₹1,00,000), PAN, TAN, and registered office records.',
      },
      {
        id: 'doc-inc-33-emoa-nov-2026',
        date: '18/11/2026',
        orderDate: '2026-11-18',
        title: 'Form INC-33 — Approved e-MoA (Memorandum of Association)',
        category: 'MCA / ROC',
        authority: 'Registrar of Companies (MCA V3)',
        referenceNo: 'SRN: 1-28403906940 (Linked Form Approved)',
        status: 'APPROVED / PERMANENT',
        fileSize: '1.09 MB',
        fileName: 'INC-33_1-28403906940 signed.pdf',
        downloadKey: 'inc-33-emoa-signed',
        remarks: 'Company Constitution. Clause III Main Objects: AI Crop Doctor, Live Mandi, Agritech E-commerce, Satellite Telemetry. Essential for Corporate Bank Account, DPIIT & GST.',
      },
      {
        id: 'doc-inc-34-eaoa-nov-2026',
        date: '18/11/2026',
        orderDate: '2026-11-18',
        title: 'Form INC-34 — Approved e-AoA (Articles of Association)',
        category: 'MCA / ROC',
        authority: 'Registrar of Companies (MCA V3)',
        referenceNo: 'SRN: 1-28403906929 (Linked Form Approved)',
        status: 'APPROVED / PERMANENT',
        fileSize: '330.6 KB',
        fileName: 'INC-34_1-28403906929 signed.pdf',
        downloadKey: 'inc-34-eaoa-signed',
        remarks: 'Internal governance constitution, share transfer protocols, borrowing powers, and Director statutory authorities. Required for Corporate Bank Account & Board Resolutions.',
      },
      {
        id: 'doc-agile-pro-s-nov-2026',
        date: '18/11/2026',
        orderDate: '2026-11-18',
        title: 'Form AGILE-PRO-S — Statutory Multi-Agency Linked Application',
        category: 'MCA / Multi-Agency',
        authority: 'MCA / EPFO / ESIC / Professional Tax / Banking',
        referenceNo: 'SRN: 1-28403906920 (Linked Form Approved)',
        status: 'APPROVED / FILED',
        fileSize: '3.61 MB',
        fileName: '1-28403906920 signed.pdf',
        downloadKey: 'agile-pro-s-signed',
        remarks: 'Integrated statutory application for EPFO registration, ESIC, Professional Tax, and Corporate Current Bank Account lead integration.',
      },
      {
        id: 'doc-inc-9-declaration-nov-2026',
        date: '18/11/2026',
        orderDate: '2026-11-18',
        title: 'Form INC-9 — Statutory Directors & Subscribers Declaration',
        category: 'MCA / ROC',
        authority: 'Ministry of Corporate Affairs',
        referenceNo: 'SRN: 1-28403906952 (Linked Form Approved)',
        status: 'APPROVED / FILED',
        fileSize: '1.71 MB',
        fileName: '1-28403906952 signed.pdf',
        downloadKey: 'inc-9-declaration-signed',
        remarks: 'Statutory legal declaration signed via Class-3 DSC by First Directors Bakhshish Singh & Gagandeep Kaur affirming full compliance under Companies Act 2013.',
      },
      {
        id: 'doc-name-approval-oct-2026',
        date: '22/10/2026',
        orderDate: '2026-10-22',
        title: 'Central Registration Centre Name Approval Letter',
        category: 'MCA / CRC',
        authority: 'Central Registration Centre, Manesar (MCA)',
        referenceNo: 'SRN: AC6979718',
        status: 'APPROVED / EXCLUSIVE',
        fileSize: '26.1 KB',
        fileName: '01_SPICe_Part_A_Approved_Name_AC6979718.pdf',
        downloadKey: 'name-approval-letter',
        remarks: 'Exclusive statutory reservation of corporate name FARMSKING TECHNOLOGIES PRIVATE LIMITED under Rule 8 of Companies (Incorporation) Rules 2014.',
      },
      {
        id: 'doc-reg-office-noc-oct-2026',
        date: '22/10/2026',
        orderDate: '2026-10-22',
        title: 'Registered Office Landowner NOC & Utility Proof',
        category: 'Statutory Office',
        authority: 'Landowner / BSNL Punjab Circle',
        referenceNo: 'C/o BALDEV SINGH, VILLAGE BOOH, Kapurthala - 144601',
        status: 'VERIFIED / ATTACHED',
        fileSize: '1.24 MB',
        fileName: '03_Registered_Office_NOC_Signed_By_Bakhshish_Singh.pdf',
        downloadKey: 'registered-office-noc',
        remarks: 'Landowner No-Objection Certificate and latest BSNL telecom utility bill verifying statutory registered office address at Village Booh, Kapurthala, Punjab - 144601.',
      },
    ];
  }

  getStatutoryDocumentFilePath(downloadKey: string): string | null {
    const possibleRoots = [
      path.resolve(process.cwd(), 'Govt', 'docs'),
      path.resolve(process.cwd(), '..', 'Govt', 'docs'),
      'D:\\farmsking\\Govt\\docs',
    ];
    const base = possibleRoots.find((p) => fs.existsSync(p));
    if (!base) return null;

    const keyMap: Record<string, string> = {
      'corporate-flex-board': path.join(base, '01_Company_Registration_MCA', '15_OFFICIAL_CORPORATE_FLEX_BOARD_REGISTERED_OFFICE.html'),
      'certificate-of-incorporation': path.join(base, '01_Company_Registration_MCA', '14_OFFICIAL_CERTIFICATE_OF_INCORPORATION_MCA.pdf'),
      'spice-part-b-signed': path.join(base, '01_Company_Registration_MCA', '00_OFFICIAL_UPLOADED_SIGNED_MCA_FORMS', 'FINAL_APPROVED_RESUBMISSION_NOV_2026', 'SPICE + Part B_AC7349109 signed.pdf'),
      'inc-33-emoa-signed': path.join(base, '01_Company_Registration_MCA', '00_OFFICIAL_UPLOADED_SIGNED_MCA_FORMS', 'FINAL_APPROVED_RESUBMISSION_NOV_2026', 'INC-33_1-28403906940 signed.pdf'),
      'inc-34-eaoa-signed': path.join(base, '01_Company_Registration_MCA', '00_OFFICIAL_UPLOADED_SIGNED_MCA_FORMS', 'FINAL_APPROVED_RESUBMISSION_NOV_2026', 'INC-34_1-28403906929 signed.pdf'),
      'agile-pro-s-signed': path.join(base, '01_Company_Registration_MCA', '00_OFFICIAL_UPLOADED_SIGNED_MCA_FORMS', 'FINAL_APPROVED_RESUBMISSION_NOV_2026', '1-28403906920 signed.pdf'),
      'inc-9-declaration-signed': path.join(base, '01_Company_Registration_MCA', '00_OFFICIAL_UPLOADED_SIGNED_MCA_FORMS', 'FINAL_APPROVED_RESUBMISSION_NOV_2026', '1-28403906952 signed.pdf'),
      'name-approval-letter': path.join(base, '01_Company_Registration_MCA', '01_SPICe_Part_A_Approved_Name_AC6979718.pdf'),
      'registered-office-noc': path.join(base, '01_Company_Registration_MCA', '03_Registered_Office_NOC_Signed_By_Bakhshish_Singh.pdf'),
    };

    const target = keyMap[downloadKey];
    return target && fs.existsSync(target) ? target : null;
  }
}
