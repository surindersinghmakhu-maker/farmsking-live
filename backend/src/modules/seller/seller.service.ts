import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateSellerStoreDto, UpdateSellerKycDto } from './dto/seller-store.dto';
import { Role, SellerKycStatus, SellerPayoutStatus } from '@prisma/client';

@Injectable()
export class SellerService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Create Seller Store
    const store = await this.prisma.sellerStore.create({
      data: {
        sellerId: user.id,
        storeName: dto.storeName,
        slug: dto.slug,
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
        gstDocUrl: dto.gstDocUrl,
        panDocUrl: dto.panDocUrl,
        chequeDocUrl: dto.chequeDocUrl,
        kycStatus: dto.gstin && dto.panNumber ? SellerKycStatus.SUBMITTED : SellerKycStatus.PENDING,
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

  /** Get Seller Store for current user */
  async getMyStore(user: AuthUser) {
    const store = await this.prisma.sellerStore.findUnique({
      where: { sellerId: user.id },
      include: {
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
    return store;
  }

  /** Update Seller Store KYC or Address Info / Resubmit Application */
  async updateKyc(user: AuthUser, dto: UpdateSellerKycDto) {
    const store = await this.getMyStore(user);

    return this.prisma.sellerStore.update({
      where: { id: store.id },
      data: {
        ...dto,
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
      kycStatus: store.kycStatus,
      rejectionReason: store.rejectionReason,
      commissionRate: store.commissionRate,
      activeProducts: productsCount,
      totalOrders: totalOrderItems,
      pendingPayoutsAmount: pendingPayouts._sum.netPayoutAmount || 0,
      settledPayoutsAmount: settledPayouts._sum.netPayoutAmount || 0,
    };
  }

  /** Admin: List all registered Seller Stores */
  async listStoresForAdmin(kycStatus?: SellerKycStatus) {
    return this.prisma.sellerStore.findMany({
      where: kycStatus ? { kycStatus } : {},
      include: {
        seller: {
          select: { id: true, name: true, mobile: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Admin: Verify or Reject Seller KYC with optional rejection reason */
  async verifyKycByAdmin(storeId: string, status: SellerKycStatus, commissionRate?: number, rejectionReason?: string) {
    const store = await this.prisma.sellerStore.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Seller store not found.');
    }

    return this.prisma.sellerStore.update({
      where: { id: storeId },
      data: {
        kycStatus: status,
        commissionRate: commissionRate !== undefined ? commissionRate : store.commissionRate,
        rejectionReason: status === SellerKycStatus.REJECTED ? rejectionReason : null,
      },
    });
  }

  /** CA/Admin: Generate GSTR-8 (1% GST TCS) Summary Report */
  async generateGstr8Report(sellerStoreId: string, month: number, year: number) {
    // Self-heal any order items missing sellerStoreId
    try {
      await this.prisma.$executeRaw`
        UPDATE customer_order_items coi
        SET "sellerStoreId" = p."sellerStoreId",
            "subtotal" = coi.price * coi.quantity,
            "tcsAmount" = (coi.price * coi.quantity) * 0.01
        FROM products p
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
      const subtotal = Number(item.subtotal || Number(item.price) * item.quantity);
      const tcs = Number(item.tcsAmount || subtotal * 0.01);
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
      itemCount: items.length,
      itemsSummary: items.map((i) => ({
        productName: i.productName,
        hsnCode: i.product?.hsnCode || '120991',
        quantity: i.quantity,
        price: Number(i.price),
        subtotal: Number(i.subtotal || Number(i.price) * i.quantity),
        tcsAmount: Number(i.tcsAmount || Number(i.price) * i.quantity * 0.01),
        orderNumber: i.order?.orderNumber || 'ORD',
        orderDate: i.order?.orderDate,
      })),
    };
  }
}
