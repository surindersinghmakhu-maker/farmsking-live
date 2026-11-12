import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShiprocketService } from '../shiprocket/shiprocket.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateSellerStoreDto, UpdateSellerKycDto, UpdateSellerSettingsDto } from './dto/seller-store.dto';
import { Prisma, Role, SellerKycStatus, SellerPayoutStatus, SellerType, SubOrderStatus, SettlementStatus, NotificationType } from '@prisma/client';
import { ADMIN_STAFF_ROLES, FARM_STAFF_ROLES, assertRoleCombinationAllowed, getActiveRolesList } from '../../common/utils/role-policy.util';
import {
  ECOMMERCE_TCS_RATE,
  IFSC_REGEX,
  detectInterStateSupply,
  isValidGstin,
  isValidPan,
} from '../../common/utils/tax-compliance.util';

@Injectable()
export class SellerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shiprocketService: ShiprocketService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Register a new Seller Store for the authenticated user */
  async registerStore(user: AuthUser, dto: CreateSellerStoreDto) {
    const accountRecord = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (accountRecord) {
      const activeRoles = getActiveRolesList(accountRecord);
      if (activeRoles.some((r) => FARM_STAFF_ROLES.includes(r) || ADMIN_STAFF_ROLES.includes(r))) {
        throw new ForbiddenException(
          'Supervisor, Labour Worker, and Admin Panel Staff accounts cannot register a Marketplace Seller store. Please use a dedicated mobile number.',
        );
      }
    }

    const existingStore = await this.prisma.sellerStore.findUnique({
      where: { sellerId: user.id },
    });
    if (existingStore) {
      throw new ConflictException('A seller store already exists for this user.');
    }

    const existingSlug = await this.prisma.sellerStore.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new ConflictException('Store slug is already taken. Please choose another.');
    }

    const resolvedType = dto.sellerType || SellerType.FARMER;

    // Mandatory upfront legal & tax KYC validation before onboarding review
    if (!isValidPan(dto.panNumber)) {
      throw new BadRequestException('A valid 10-character PAN Number is mandatory for all Marketplace Sellers under Income Tax Section 194-O / 206AA.');
    }
    if (resolvedType === SellerType.COMMERCIAL && !isValidGstin(dto.gstin)) {
      throw new BadRequestException('A valid 15-character GSTIN is mandatory for Commercial Sellers under CGST Section 24.');
    }
    if (dto.gstin?.trim() && !isValidGstin(dto.gstin)) {
      throw new BadRequestException('Entered GSTIN format is invalid. Please provide a valid 15-character GSTIN.');
    }
    if (!dto.bankAccountNo?.trim() || !dto.bankIfsc?.trim() || !IFSC_REGEX.test(dto.bankIfsc.trim().toUpperCase())) {
      throw new BadRequestException('Valid Bank Account Number and 11-character IFSC Code are mandatory for nodal payouts.');
    }
    if (!dto.pickupAddress?.trim() || !dto.pickupPincode?.trim() || !/^\d{6}$/.test(dto.pickupPincode.trim())) {
      throw new BadRequestException('Full Pickup Warehouse Address and 6-digit Pincode are mandatory for courier pickup.');
    }
    if (!dto.panDocUrl || !dto.chequeDocUrl || !dto.aadhaarFrontUrl) {
      throw new BadRequestException('PAN Card copy, Cancelled Cheque/Passbook, and Aadhaar proof are mandatory at registration.');
    }
    if (resolvedType === SellerType.COMMERCIAL && !dto.gstDocUrl) {
      throw new BadRequestException('GST Registration Certificate upload is mandatory for Commercial Sellers.');
    }

    if (dto.wantsToSellFood) {
      if (!dto.fssaiNo || !/^\d{14}$/.test(dto.fssaiNo.trim())) {
        throw new BadRequestException('FSSAI License Number must be a valid 14-digit numeric code when listing food products.');
      }
      if (!dto.fssaiCertificateUrl) {
        throw new BadRequestException('FSSAI Certificate document upload is required when listing food products.');
      }
      if (dto.fssaiExpiryDate && new Date(dto.fssaiExpiryDate) < new Date()) {
        throw new BadRequestException('FSSAI License Expiry Date cannot be in the past.');
      }
    }
    const now = new Date();
    if (dto.agriLicenseExpiryDate && new Date(dto.agriLicenseExpiryDate) < now) {
      throw new BadRequestException('Agri Inputs License Expiry Date cannot be in the past.');
    }
    if (dto.seedLicenseExpiry && new Date(dto.seedLicenseExpiry) < now) {
      throw new BadRequestException('Seed License Expiry Date cannot be in the past.');
    }
    if (dto.pesticideLicenseExpiry && new Date(dto.pesticideLicenseExpiry) < now) {
      throw new BadRequestException('Pesticide License Expiry Date cannot be in the past.');
    }
    if (dto.fertilizerLicenseExpiry && new Date(dto.fertilizerLicenseExpiry) < now) {
      throw new BadRequestException('Fertilizer License Expiry Date cannot be in the past.');
    }

    // Create Seller Store
    const store = await this.prisma.sellerStore.create({
      data: {
        sellerId: user.id,
        storeName: dto.storeName.trim(),
        slug: dto.slug.trim().toLowerCase(),
        sellerType: resolvedType,
        legalName: dto.legalName?.trim() || dto.storeName.trim(),
        gstin: dto.gstin?.trim().toUpperCase() || null,
        isCompositionDealer: Boolean(dto.isCompositionDealer),
        gstEnrolmentId: dto.gstEnrolmentId?.trim() || null,
        panNumber: dto.panNumber?.trim().toUpperCase(),
        aadhaarLast4: dto.aadhaarLast4?.trim() || null,
        upiId: dto.upiId?.trim() || null,
        bankAccountNo: dto.bankAccountNo.trim(),
        bankIfsc: dto.bankIfsc.trim().toUpperCase(),
        bankBeneficiaryName: dto.bankBeneficiaryName?.trim() || dto.legalName?.trim() || dto.storeName.trim(),
        pickupAddress: dto.pickupAddress.trim(),
        pickupCity: dto.pickupCity?.trim() || null,
        pickupState: dto.pickupState?.trim() || 'Punjab',
        pickupPincode: dto.pickupPincode.trim(),
        wantsToSellFood: dto.wantsToSellFood || false,
        fssaiNo: dto.fssaiNo ? dto.fssaiNo.trim() : null,
        fssaiCertificateUrl: dto.fssaiCertificateUrl,
        fssaiExpiryDate: dto.fssaiExpiryDate ? new Date(dto.fssaiExpiryDate) : null,
        agriLicenseNo: dto.agriLicenseNo?.trim() || null,
        agriLicenseExpiryDate: dto.agriLicenseExpiryDate ? new Date(dto.agriLicenseExpiryDate) : null,
        seedLicenseNo: dto.seedLicenseNo?.trim() || null,
        seedLicenseExpiry: dto.seedLicenseExpiry ? new Date(dto.seedLicenseExpiry) : null,
        seedLicenseDocUrl: dto.seedLicenseDocUrl || null,
        pesticideLicenseNo: dto.pesticideLicenseNo?.trim() || null,
        pesticideLicenseExpiry: dto.pesticideLicenseExpiry ? new Date(dto.pesticideLicenseExpiry) : null,
        pesticideLicenseDocUrl: dto.pesticideLicenseDocUrl || null,
        fertilizerLicenseNo: dto.fertilizerLicenseNo?.trim() || null,
        fertilizerLicenseExpiry: dto.fertilizerLicenseExpiry ? new Date(dto.fertilizerLicenseExpiry) : null,
        fertilizerLicenseDocUrl: dto.fertilizerLicenseDocUrl || null,
        gstDocUrl: dto.gstDocUrl,
        panDocUrl: dto.panDocUrl,
        chequeDocUrl: dto.chequeDocUrl,
        aadhaarFrontUrl: dto.aadhaarFrontUrl,
        aadhaarBackUrl: dto.aadhaarBackUrl,
        tradeLicenseUrl: dto.tradeLicenseUrl,
        additionalDoc1Title: dto.additionalDoc1Title || (dto.sellerPhotoUrl ? 'Seller Photo' : undefined),
        additionalDoc1Url: dto.additionalDoc1Url || dto.sellerPhotoUrl,
        additionalDoc2Title: dto.additionalDoc2Title || (dto.logoDocUrl ? 'Business Logo' : undefined),
        additionalDoc2Url: dto.additionalDoc2Url || dto.logoDocUrl,
        sellerAgreementAcceptedAt: dto.termsAccepted === false ? null : new Date(),
        sellerAgreementVersion: '2026.11',
        shiprocketPickupNickname: `FK_LOC_${user.id.substring(0, 8)}`,
        kycStatus: SellerKycStatus.SUBMITTED,
      },
    });

    // Grant SELLER role to User if not present (and reactivate if previously deactivated)
    if (accountRecord) {
      const roles = accountRecord.roles || [];
      const nextDeactivated = (accountRecord.deactivatedRoles || []).filter((r) => r !== Role.SELLER);
      if (!roles.includes(Role.SELLER) || nextDeactivated.length !== (accountRecord.deactivatedRoles || []).length) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            roles: roles.includes(Role.SELLER) ? roles : { push: Role.SELLER },
            deactivatedRoles: nextDeactivated,
          },
        });
      }
    }

    return store;
  }

  /** Get Seller Store for current user (includes payouts & recent catalog for seller ledger/dashboard) */
  async getMyStore(user: AuthUser) {
    const store = await this.prisma.sellerStore.findUnique({
      where: { sellerId: user.id },
      include: {
        payouts: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        products: {
          orderBy: { createdAt: 'desc' },
          take: 150,
        },
        _count: {
          select: {
            products: true,
            orderItems: true,
            payouts: true,
          },
        },
      },
    });
    if (!store) {
      throw new NotFoundException('Seller store not found. Please register first.');
    }
    return {
      ...store,
      sellerPhotoUrl: store.additionalDoc1Url || null,
      logoDocUrl: store.additionalDoc2Url || null,
    };
  }

  /** Update Seller Store KYC or Address Info / Resubmit Application */
  async updateKyc(user: AuthUser, dto: UpdateSellerKycDto) {
    const store = await this.getMyStore(user);

    if (store.kycStatus === SellerKycStatus.BLOCKED) {
      throw new ForbiddenException('Your seller store is currently blocked by compliance. Please contact FarmsKing Admin Support.');
    }

    if (dto.wantsToSellFood) {
      if (!dto.fssaiNo || !/^\d{14}$/.test(dto.fssaiNo.trim())) {
        throw new BadRequestException('FSSAI License Number must be a valid 14-digit numeric code when listing food products.');
      }
    }

    const {
      sellerPhotoUrl,
      logoDocUrl,
      termsAccepted,
      agriLicenseExpiryDate,
      seedLicenseExpiry,
      pesticideLicenseExpiry,
      fertilizerLicenseExpiry,
      ...schemaFields
    } = dto;
    const nextKycStatus =
      store.kycStatus === SellerKycStatus.VERIFIED ? SellerKycStatus.VERIFIED : SellerKycStatus.SUBMITTED;

    return this.prisma.sellerStore.update({
      where: { id: store.id },
      data: {
        ...schemaFields,
        ...(schemaFields.gstin ? { gstin: schemaFields.gstin.trim().toUpperCase() } : {}),
        ...(schemaFields.panNumber ? { panNumber: schemaFields.panNumber.trim().toUpperCase() } : {}),
        ...(schemaFields.bankIfsc ? { bankIfsc: schemaFields.bankIfsc.trim().toUpperCase() } : {}),
        additionalDoc1Title: schemaFields.additionalDoc1Title || (sellerPhotoUrl ? 'Seller Photo' : undefined),
        additionalDoc1Url: schemaFields.additionalDoc1Url || sellerPhotoUrl,
        additionalDoc2Title: schemaFields.additionalDoc2Title || (logoDocUrl ? 'Business Logo' : undefined),
        additionalDoc2Url: schemaFields.additionalDoc2Url || logoDocUrl,
        fssaiExpiryDate: dto.fssaiExpiryDate ? new Date(dto.fssaiExpiryDate) : undefined,
        agriLicenseExpiryDate: agriLicenseExpiryDate ? new Date(agriLicenseExpiryDate) : undefined,
        seedLicenseExpiry: seedLicenseExpiry ? new Date(seedLicenseExpiry) : undefined,
        pesticideLicenseExpiry: pesticideLicenseExpiry ? new Date(pesticideLicenseExpiry) : undefined,
        fertilizerLicenseExpiry: fertilizerLicenseExpiry ? new Date(fertilizerLicenseExpiry) : undefined,
        ...(termsAccepted ? { sellerAgreementAcceptedAt: new Date(), sellerAgreementVersion: '2026.11' } : {}),
        kycStatus: nextKycStatus,
        rejectionReason: null,
      },
    });
  }

  /** Get Dashboard Statistics for Seller */
  async getDashboardStats(user: AuthUser) {
    const store = await this.getMyStore(user);

    const [productsCount, totalOrderItems, pendingPayouts, settledPayouts] = await Promise.all([
      this.prisma.product.count({ where: { sellerStoreId: store.id, isActive: true } }),
      this.prisma.customerOrderItem.count({ where: { sellerStoreId: store.id } }),
      this.prisma.sellerPayout.aggregate({
        where: { sellerStoreId: store.id, status: SellerPayoutStatus.PENDING },
        _sum: { netPayoutAmount: true },
      }),
      this.prisma.sellerPayout.aggregate({
        where: { sellerStoreId: store.id, status: SellerPayoutStatus.SETTLED },
        _sum: { netPayoutAmount: true },
      }),
    ]);

    return {
      storeName: store.storeName,
      sellerType: store.sellerType,
      kycStatus: store.kycStatus,
      rejectionReason: store.rejectionReason,
      commissionRate: store.commissionRate,
      rtoBearer: store.rtoBearer,
      rtoSharedVendorRatio: store.rtoSharedVendorRatio,
      catalogApprovalMode: store.catalogApprovalMode,
      isFssaiApproved: store.isFssaiApproved,
      activeProducts: productsCount,
      totalOrders: totalOrderItems,
      pendingPayoutsAmount: pendingPayouts._sum.netPayoutAmount || 0,
      settledPayoutsAmount: settledPayouts._sum.netPayoutAmount || 0,
    };
  }

  /** Admin: List all registered Seller Stores */
  async listStoresForAdmin(kycStatus?: string) {
    let whereClause: any = {};
    if (kycStatus && kycStatus !== 'ALL') {
      if (kycStatus === 'PENDING') {
        whereClause = {
          kycStatus: {
            in: [SellerKycStatus.PENDING, SellerKycStatus.SUBMITTED],
          },
        };
      } else if (Object.values(SellerKycStatus).includes(kycStatus as SellerKycStatus)) {
        whereClause = { kycStatus: kycStatus as SellerKycStatus };
      }
    }
    const stores = await this.prisma.sellerStore.findMany({
      where: whereClause,
      include: {
        seller: {
          select: { id: true, name: true, mobile: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (stores.length === 0) return [];

    const storeIds = stores.map((s) => s.id);
    const [payoutsGrouped, subOrdersGrouped] = await Promise.all([
      this.prisma.sellerPayout.groupBy({
        by: ['sellerStoreId', 'status'],
        where: { sellerStoreId: { in: storeIds } },
        _sum: { totalGrossAmount: true, totalCommissionAmount: true, totalTcsAmount: true, netPayoutAmount: true },
      }),
      this.prisma.subOrder.groupBy({
        by: ['sellerStoreId', 'settlementStatus'],
        where: { sellerStoreId: { in: storeIds }, orderStatus: { not: SubOrderStatus.CANCELLED } },
        _sum: { subtotal: true, commissionAmount: true, vendorNetPayout: true },
      }),
    ]);

    const metricsMap = new Map<string, {
      grossSales: number;
      commissionAmount: number;
      tcsAmount: number;
      settledBalance: number;
      pendingBalance: number;
      heldBalance: number;
    }>();

    for (const sid of storeIds) {
      metricsMap.set(sid, { grossSales: 0, commissionAmount: 0, tcsAmount: 0, settledBalance: 0, pendingBalance: 0, heldBalance: 0 });
    }
    for (const row of subOrdersGrouped) {
      const m = metricsMap.get(row.sellerStoreId);
      if (!m) continue;
      m.grossSales += Number(row._sum.subtotal || 0);
      m.commissionAmount += Number(row._sum.commissionAmount || 0);
      if (row.settlementStatus === SettlementStatus.HOLD) {
        m.heldBalance += Number(row._sum.vendorNetPayout || 0);
      }
    }
    for (const row of payoutsGrouped) {
      const m = metricsMap.get(row.sellerStoreId);
      if (!m) continue;
      m.tcsAmount += Number(row._sum.totalTcsAmount || 0);
      if (row.status === SellerPayoutStatus.SETTLED) {
        m.settledBalance += Number(row._sum.netPayoutAmount || 0);
      } else if (row.status === SellerPayoutStatus.PENDING || row.status === SellerPayoutStatus.PROCESSING) {
        m.pendingBalance += Number(row._sum.netPayoutAmount || 0);
      }
    }

    let commMap = new Map<string, any>();
    try {
      const rawCommissions: Array<{ id: string; categoryCommissions: any }> = await this.prisma.$queryRaw(
        Prisma.sql`SELECT "id", "categoryCommissions" FROM "seller_stores" WHERE "id" IN (${Prisma.join(storeIds)})`,
      );
      commMap = new Map(rawCommissions.map((r) => [r.id, r.categoryCommissions || {}]));
    } catch {
      // Optional JSONB column
    }

    return stores.map((s) => {
      const m = metricsMap.get(s.id)!;
      return {
        ...s,
        sellerPhotoUrl: s.additionalDoc1Url || null,
        logoDocUrl: s.additionalDoc2Url || null,
        categoryCommissions: commMap.get(s.id) || {},
        grossSales: Number(m.grossSales.toFixed(2)),
        commissionAmount: Number(m.commissionAmount.toFixed(2)),
        tcsAmount: Number(m.tcsAmount.toFixed(2)),
        settledBalance: Number(m.settledBalance.toFixed(2)),
        pendingBalance: Number(m.pendingBalance.toFixed(2)),
        heldBalance: Number(m.heldBalance.toFixed(2)),
      };
    });
  }

  /** Admin: Verify or Reject Seller KYC with mandatory reason & Punjabi welcome trigger */
  async verifyKycByAdmin(storeId: string, status: SellerKycStatus, commissionRate?: number, rejectionReason?: string) {
    const store = await this.prisma.sellerStore.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Seller store not found.');
    }

    if (status === SellerKycStatus.REJECTED && !rejectionReason?.trim()) {
      throw new BadRequestException('A mandatory rejection reason is required when rejecting a seller application.');
    }

    const updatedStore = await this.prisma.sellerStore.update({
      where: { id: storeId },
      data: {
        kycStatus: status,
        commissionRate: commissionRate !== undefined ? commissionRate : store.commissionRate,
        rejectionReason: status === SellerKycStatus.REJECTED ? rejectionReason : null,
        ...(status === SellerKycStatus.VERIFIED ? { kycVerifiedAt: new Date() } : {}),
      },
    });

    if (status === SellerKycStatus.VERIFIED) {
      // 0. Ensure SELLER role is active and not trapped inside deactivatedRoles
      const owner = await this.prisma.user.findUnique({ where: { id: store.sellerId } });
      if (owner) {
        const nextRoles = Array.from(new Set([...(owner.roles || []), Role.SELLER]));
        const nextDeactivated = (owner.deactivatedRoles || []).filter((r) => r !== Role.SELLER);
        const activeAfter = getActiveRolesList({ role: owner.role, roles: nextRoles, deactivatedRoles: nextDeactivated });
        try {
          assertRoleCombinationAllowed(activeAfter);
          await this.prisma.user.update({
            where: { id: owner.id },
            data: { roles: nextRoles, deactivatedRoles: nextDeactivated },
          });
        } catch (err) {
          console.warn('Could not activate SELLER role on user due to role-policy conflict:', err);
        }
      }

      // 1. Trigger Shiprocket Warehouse Pickup Registration
      try {
        await this.shiprocketService.addPickupLocation(storeId);
      } catch (err) {
        console.warn('Shiprocket pickup registration notice:', err);
      }

      // 2. Send Welcome Notification to Seller Store Owner
      const welcomeMessage = `Welcome to FarmsKing Marketplace! Your seller store application has been verified successfully. You can now start listing and selling your products across India.`;
      try {
        await this.notificationsService.create(
          store.sellerId,
          NotificationType.SYSTEM,
          '🎉 Seller Store Verification Approved!',
          welcomeMessage,
          { storeId, status: 'VERIFIED' },
        );
      } catch (err) {
        console.warn('Welcome notification notice:', err);
      }
    }

    return updatedStore;
  }

  /** Admin: Update Vendor Settings (Commission, RTO Policy, Catalog Mode, FSSAI Approval, Category Commissions) */
  async updateSellerSettings(storeId: string, dto: UpdateSellerSettingsDto) {
    const store = await this.prisma.sellerStore.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Seller store not found.');
    }

    if ((dto as any).categoryCommissions) {
      try {
        await this.prisma.$executeRawUnsafe(
          `UPDATE "seller_stores" SET "categoryCommissions" = $1::jsonb WHERE "id" = $2`,
          JSON.stringify((dto as any).categoryCommissions),
          storeId,
        );
      } catch (err) {
        console.warn('Could not update categoryCommissions:', err);
      }
    }

    return this.prisma.sellerStore.update({
      where: { id: storeId },
      data: {
        commissionRate: dto.commissionRate !== undefined ? dto.commissionRate : store.commissionRate,
        rtoBearer: dto.rtoBearer !== undefined ? dto.rtoBearer : store.rtoBearer,
        rtoSharedVendorRatio: dto.rtoSharedVendorRatio !== undefined ? dto.rtoSharedVendorRatio : store.rtoSharedVendorRatio,
        catalogApprovalMode: dto.catalogApprovalMode !== undefined ? dto.catalogApprovalMode : store.catalogApprovalMode,
        isFssaiApproved: dto.isFssaiApproved !== undefined ? dto.isFssaiApproved : store.isFssaiApproved,
      },
    });
  }

  /** CA/Admin/Accountant: Generate GSTR-8 (0.5% Section 52 CGST TCS) Summary Report */
  async generateGstr8Report(sellerStoreId: string, month: number, year: number) {
    const store = await this.prisma.sellerStore.findUnique({
      where: { id: sellerStoreId },
      select: { gstin: true, pickupState: true },
    });
    const isGstRegistered = isValidGstin(store?.gstin);

    try {
      await this.prisma.$executeRaw`
        UPDATE customer_order_items coi
        SET "sellerStoreId" = p."sellerStoreId",
            "subtotal" = coi.price * coi.quantity,
            "tcsAmount" = CASE
              WHEN ss."gstin" IS NOT NULL AND length(trim(ss."gstin")) >= 15
                THEN (
                  CASE
                    WHEN COALESCE(p."gstPercentage", 0) > 0
                      THEN ((coi.price * coi.quantity) / (1 + (p."gstPercentage" / 100.0)))
                    ELSE (coi.price * coi.quantity)
                  END
                ) * 0.005
              ELSE 0
            END
        FROM products p
        LEFT JOIN seller_stores ss ON ss.id = p."sellerStoreId"
        WHERE coi."productId" = p.id
          AND coi."sellerStoreId" IS NULL
          AND p."sellerStoreId" IS NOT NULL;
      `;
    } catch (e) {
      console.warn('GSTR-8 self-healing notice:', e);
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const items = await this.prisma.customerOrderItem.findMany({
      where: {
        sellerStoreId,
        order: {
          orderDate: { gte: startDate, lte: endDate },
          status: { not: 'CANCELLED' },
        },
      },
      include: {
        order: {
          select: { orderNumber: true, orderDate: true, paymentStatus: true, status: true, deliveryAddress: true },
        },
        product: {
          select: { name: true, hsnCode: true, gstPercentage: true },
        },
      },
    });

    let totalGrossSales = 0;
    let totalNetTaxableValue = 0;
    let cgstTcs = 0;
    let sgstTcs = 0;
    let igstTcs = 0;

    items.forEach((item) => {
      const subtotal = Number(item.subtotal ?? Number(item.price) * item.quantity);
      const gstPct = Number(item.product?.gstPercentage ?? 0);
      const netTaxable = gstPct > 0 ? Number((subtotal / (1 + gstPct / 100)).toFixed(2)) : subtotal;
      const tcs = isGstRegistered ? Number((netTaxable * ECOMMERCE_TCS_RATE).toFixed(2)) : 0;
      const isInterState = detectInterStateSupply(store?.pickupState, item.order?.deliveryAddress);

      totalGrossSales += subtotal;
      totalNetTaxableValue += netTaxable;
      if (isGstRegistered) {
        if (isInterState) {
          igstTcs += tcs;
        } else {
          const half = Number((tcs / 2).toFixed(2));
          cgstTcs += half;
          sgstTcs += Number((tcs - half).toFixed(2));
        }
      }
    });

    const netTaxableValue = Number(totalNetTaxableValue.toFixed(2));
    const totalTcsFixed = Number((cgstTcs + sgstTcs + igstTcs).toFixed(2));

    const report = await this.prisma.gstr8Report.upsert({
      where: {
        sellerStoreId_month_year: { sellerStoreId, month, year },
      },
      create: {
        sellerStoreId,
        month,
        year,
        totalGrossSales: Number(totalGrossSales.toFixed(2)),
        totalSalesReturn: 0,
        netTaxableValue,
        cgstTcs: Number(cgstTcs.toFixed(2)),
        sgstTcs: Number(sgstTcs.toFixed(2)),
        igstTcs: Number(igstTcs.toFixed(2)),
        totalTcs: totalTcsFixed,
      },
      update: {
        totalGrossSales: Number(totalGrossSales.toFixed(2)),
        netTaxableValue,
        cgstTcs: Number(cgstTcs.toFixed(2)),
        sgstTcs: Number(sgstTcs.toFixed(2)),
        igstTcs: Number(igstTcs.toFixed(2)),
        totalTcs: totalTcsFixed,
      },
    });

    return {
      ...report,
      isGstRegistered,
      itemCount: items.length,
      itemsSummary: items.map((i) => {
        const sub = Number(i.subtotal ?? Number(i.price) * i.quantity);
        return {
          productName: i.productName,
          hsnCode: i.product?.hsnCode || '120991',
          quantity: i.quantity,
          price: Number(i.price),
          subtotal: sub,
          tcsAmount: isGstRegistered ? Number(i.tcsAmount ?? sub * 0.01) : 0,
          orderNumber: i.order?.orderNumber || 'ORD',
          orderDate: i.order?.orderDate,
        };
      }),
    };
  }

  /** Seller: Get sub-orders scoped exclusively to caller's verified store */
  async getMyOrders(user: AuthUser) {
    const store = await this.prisma.sellerStore.findUnique({
      where: { sellerId: user.id },
      select: { id: true, storeName: true },
    });
    if (!store) {
      throw new NotFoundException('Seller store not found.');
    }

    const subOrders = await this.prisma.subOrder.findMany({
      where: { sellerStoreId: store.id },
      take: 150,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentMode: true,
            paymentStatus: true,
            deliveryAddress: true,
            orderDate: true,
            courierName: true,
            trackingId: true,
            customer: {
              select: { id: true, name: true, district: true, state: true, pincode: true },
            },
            items: {
              where: { sellerStoreId: store.id },
              select: {
                id: true,
                productId: true,
                productName: true,
                quantity: true,
                price: true,
                subtotal: true,
                tcsAmount: true,
              },
            },
          },
        },
      },
    });

    return subOrders;
  }

  /** Seller: Advance own SubOrder status (PLACED -> ACCEPTED -> PACKED) */
  async updateMySubOrderStatus(user: AuthUser, subOrderId: string, nextStatus: SubOrderStatus) {
    const store = await this.prisma.sellerStore.findUnique({
      where: { sellerId: user.id },
      select: { id: true, kycStatus: true },
    });
    if (!store) {
      throw new NotFoundException('Seller store not found.');
    }

    const subOrder = await this.prisma.subOrder.findUnique({ where: { id: subOrderId } });
    if (!subOrder) {
      throw new NotFoundException('Sub-order not found.');
    }
    if (subOrder.sellerStoreId !== store.id) {
      throw new ForbiddenException('You can only manage orders belonging to your own seller store.');
    }

    const allowedSellerTransitions: Record<string, SubOrderStatus[]> = {
      [SubOrderStatus.PLACED]: [SubOrderStatus.ACCEPTED, SubOrderStatus.PACKED],
      [SubOrderStatus.ACCEPTED]: [SubOrderStatus.PACKED],
    };

    const allowedNext = allowedSellerTransitions[subOrder.orderStatus] || [];
    if (!allowedNext.includes(nextStatus)) {
      throw new BadRequestException(`Cannot transition sub-order from ${subOrder.orderStatus} to ${nextStatus}.`);
    }

    return this.prisma.subOrder.update({
      where: { id: subOrderId },
      data: { orderStatus: nextStatus },
    });
  }

  /** Admin: List all SellerPayout ledger records across stores */
  async listAllPayoutsForAdmin(status?: string) {
    const where: any = {};
    if (status && Object.values(SellerPayoutStatus).includes(status as SellerPayoutStatus)) {
      where.status = status as SellerPayoutStatus;
    }
    return this.prisma.sellerPayout.findMany({
      where,
      take: 200,
      orderBy: { createdAt: 'desc' },
      include: {
        sellerStore: {
          select: {
            id: true,
            storeName: true,
            bankAccountNo: true,
            bankIfsc: true,
            bankBeneficiaryName: true,
            seller: { select: { name: true, mobile: true } },
          },
        },
      },
    });
  }

  /** Admin: Settle all PENDING payouts for a specific store with Bank UTR */
  async settleStorePendingPayoutsByAdmin(storeId: string, cashfreeUtrNo?: string) {
    const pending = await this.prisma.sellerPayout.findMany({
      where: { sellerStoreId: storeId, status: SellerPayoutStatus.PENDING },
    });
    if (pending.length === 0) {
      throw new BadRequestException('No pending payouts found for this seller store.');
    }
    const utr = cashfreeUtrNo?.trim() || `BANK-UTR-${Date.now().toString(36).toUpperCase()}`;
    const settled: any[] = [];
    for (const p of pending) {
      settled.push(await this.settlePayoutByAdmin(p.id, utr));
    }
    return { settledCount: settled.length, utr, payouts: settled };
  }

  /** Admin: Mark a SellerPayout as SETTLED and record Bank UTR */
  async settlePayoutByAdmin(payoutId: string, cashfreeUtrNo?: string) {
    const payout = await this.prisma.sellerPayout.findUnique({ where: { id: payoutId } });
    if (!payout) {
      throw new NotFoundException('Seller payout record not found.');
    }
    if (payout.status === SellerPayoutStatus.SETTLED) {
      throw new BadRequestException('This seller payout has already been settled.');
    }

    const updated = await this.prisma.sellerPayout.update({
      where: { id: payoutId },
      data: {
        status: SellerPayoutStatus.SETTLED,
        cashfreeUtrNo: cashfreeUtrNo?.trim() || payout.cashfreeUtrNo || `BANK-UTR-${Date.now().toString(36).toUpperCase()}`,
        paidAt: new Date(),
      },
    });

    // Also advance matching HOLD sub-orders whose orderNumber appears in payoutRefNo
    const refParts = payout.payoutRefNo.split('-');
    if (refParts.length >= 4 && refParts[0] === 'PAY') {
      const orderNumGuess = refParts.slice(1, -1).join('-');
      await this.prisma.subOrder.updateMany({
        where: {
          sellerStoreId: payout.sellerStoreId,
          order: { orderNumber: orderNumGuess },
          settlementStatus: SettlementStatus.HOLD,
        },
        data: {
          settlementStatus: SettlementStatus.SETTLED,
          cashfreeTransferId: updated.cashfreeUtrNo,
        },
      });
    }

    return updated;
  }
}

