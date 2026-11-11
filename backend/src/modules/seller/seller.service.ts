import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShiprocketService } from '../shiprocket/shiprocket.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateSellerStoreDto, UpdateSellerKycDto, UpdateSellerSettingsDto } from './dto/seller-store.dto';
import { Prisma, Role, SellerKycStatus, SellerPayoutStatus, SellerType, SubOrderStatus, SettlementStatus, NotificationType } from '@prisma/client';

@Injectable()
export class SellerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shiprocketService: ShiprocketService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Register a new Seller Store for the authenticated user */
  async registerStore(user: AuthUser, dto: CreateSellerStoreDto) {
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

    if (dto.wantsToSellFood) {
      if (!dto.fssaiNo || !/^\d{14}$/.test(dto.fssaiNo.trim())) {
        throw new BadRequestException('FSSAI License Number must be a valid 14-digit numeric code when listing food products.');
      }
    }

    // Create Seller Store
    const store = await this.prisma.sellerStore.create({
      data: {
        sellerId: user.id,
        storeName: dto.storeName,
        slug: dto.slug,
        sellerType: dto.sellerType || SellerType.FARMER,
        legalName: dto.legalName,
        gstin: dto.gstin,
        panNumber: dto.panNumber,
        bankAccountNo: dto.bankAccountNo,
        bankIfsc: dto.bankIfsc,
        bankBeneficiaryName: dto.bankBeneficiaryName,
        pickupAddress: dto.pickupAddress,
        pickupCity: dto.pickupCity,
        pickupState: dto.pickupState,
        pickupPincode: dto.pickupPincode,
        wantsToSellFood: dto.wantsToSellFood || false,
        fssaiNo: dto.fssaiNo ? dto.fssaiNo.trim() : null,
        fssaiCertificateUrl: dto.fssaiCertificateUrl,
        fssaiExpiryDate: dto.fssaiExpiryDate ? new Date(dto.fssaiExpiryDate) : null,
        agriLicenseNo: dto.agriLicenseNo,
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
        shiprocketPickupNickname: `FK_LOC_${user.id.substring(0, 8)}`,
        kycStatus: SellerKycStatus.SUBMITTED,
      },
    });

    // Grant SELLER role to User if not present
    const currentUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (currentUser) {
      const roles = currentUser.roles || [];
      if (!roles.includes(Role.SELLER)) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            roles: { push: Role.SELLER },
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

    if (dto.wantsToSellFood) {
      if (!dto.fssaiNo || !/^\d{14}$/.test(dto.fssaiNo.trim())) {
        throw new BadRequestException('FSSAI License Number must be a valid 14-digit numeric code when listing food products.');
      }
    }

    const { sellerPhotoUrl, logoDocUrl, ...schemaFields } = dto;

    return this.prisma.sellerStore.update({
      where: { id: store.id },
      data: {
        ...schemaFields,
        additionalDoc1Title: schemaFields.additionalDoc1Title || (sellerPhotoUrl ? 'Seller Photo' : undefined),
        additionalDoc1Url: schemaFields.additionalDoc1Url || sellerPhotoUrl,
        additionalDoc2Title: schemaFields.additionalDoc2Title || (logoDocUrl ? 'Business Logo' : undefined),
        additionalDoc2Url: schemaFields.additionalDoc2Url || logoDocUrl,
        fssaiExpiryDate: dto.fssaiExpiryDate ? new Date(dto.fssaiExpiryDate) : undefined,
        kycStatus: SellerKycStatus.SUBMITTED,
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
      },
    });

    if (status === SellerKycStatus.VERIFIED) {
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

  /** CA/Admin: Generate GSTR-8 (1% GST TCS) Summary Report */
  async generateGstr8Report(sellerStoreId: string, month: number, year: number) {
    const store = await this.prisma.sellerStore.findUnique({
      where: { id: sellerStoreId },
      select: { gstin: true },
    });
    const isGstRegistered = Boolean(store?.gstin && store.gstin.trim().length >= 15);

    try {
      await this.prisma.$executeRaw`
        UPDATE customer_order_items coi
        SET "sellerStoreId" = p."sellerStoreId",
            "subtotal" = coi.price * coi.quantity,
            "tcsAmount" = CASE
              WHEN ss."gstin" IS NOT NULL AND length(trim(ss."gstin")) >= 15
                THEN (coi.price * coi.quantity) * 0.01
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
          select: { orderNumber: true, orderDate: true, paymentStatus: true, status: true },
        },
        product: {
          select: { name: true, hsnCode: true, gstPercentage: true },
        },
      },
    });

    let totalGrossSales = 0;
    let totalTcs = 0;

    items.forEach((item) => {
      const subtotal = Number(item.subtotal ?? Number(item.price) * item.quantity);
      const tcs = isGstRegistered ? Number(item.tcsAmount ?? subtotal * 0.01) : 0;
      totalGrossSales += subtotal;
      totalTcs += tcs;
    });

    const netTaxableValue = totalGrossSales;
    const halfTcs = Number((totalTcs / 2).toFixed(2));
    const totalTcsFixed = Number(totalTcs.toFixed(2));

    const report = await this.prisma.gstr8Report.upsert({
      where: {
        sellerStoreId_month_year: { sellerStoreId, month, year },
      },
      create: {
        sellerStoreId,
        month,
        year,
        totalGrossSales,
        totalSalesReturn: 0,
        netTaxableValue,
        cgstTcs: halfTcs,
        sgstTcs: halfTcs,
        igstTcs: 0,
        totalTcs: totalTcsFixed,
      },
      update: {
        totalGrossSales,
        netTaxableValue,
        cgstTcs: halfTcs,
        sgstTcs: halfTcs,
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

