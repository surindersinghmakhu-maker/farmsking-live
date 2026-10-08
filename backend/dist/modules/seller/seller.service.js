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
exports.SellerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const shiprocket_service_1 = require("../shiprocket/shiprocket.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
let SellerService = class SellerService {
    constructor(prisma, shiprocketService, notificationsService) {
        this.prisma = prisma;
        this.shiprocketService = shiprocketService;
        this.notificationsService = notificationsService;
    }
    async registerStore(user, dto) {
        const existingStore = await this.prisma.sellerStore.findUnique({
            where: { sellerId: user.id },
        });
        if (existingStore) {
            throw new common_1.ConflictException('A seller store already exists for this user.');
        }
        const existingSlug = await this.prisma.sellerStore.findUnique({
            where: { slug: dto.slug },
        });
        if (existingSlug) {
            throw new common_1.ConflictException('Store slug is already taken. Please choose another.');
        }
        if (dto.wantsToSellFood) {
            if (!dto.fssaiNo || !/^\d{14}$/.test(dto.fssaiNo.trim())) {
                throw new common_1.BadRequestException('FSSAI License Number must be a valid 14-digit numeric code when listing food products.');
            }
        }
        const store = await this.prisma.sellerStore.create({
            data: {
                sellerId: user.id,
                storeName: dto.storeName,
                slug: dto.slug,
                sellerType: dto.sellerType || client_1.SellerType.FARMER,
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
                shiprocketPickupNickname: `FK_LOC_${user.id.substring(0, 8)}`,
                kycStatus: client_1.SellerKycStatus.SUBMITTED,
            },
        });
        const currentUser = await this.prisma.user.findUnique({ where: { id: user.id } });
        if (currentUser) {
            const roles = currentUser.roles || [];
            if (!roles.includes(client_1.Role.SELLER)) {
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        roles: { push: client_1.Role.SELLER },
                    },
                });
            }
        }
        return store;
    }
    async getMyStore(user) {
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
            throw new common_1.NotFoundException('Seller store not found. Please register first.');
        }
        return store;
    }
    async updateKyc(user, dto) {
        const store = await this.getMyStore(user);
        if (dto.wantsToSellFood) {
            if (!dto.fssaiNo || !/^\d{14}$/.test(dto.fssaiNo.trim())) {
                throw new common_1.BadRequestException('FSSAI License Number must be a valid 14-digit numeric code when listing food products.');
            }
        }
        return this.prisma.sellerStore.update({
            where: { id: store.id },
            data: {
                ...dto,
                fssaiExpiryDate: dto.fssaiExpiryDate ? new Date(dto.fssaiExpiryDate) : undefined,
                kycStatus: client_1.SellerKycStatus.SUBMITTED,
                rejectionReason: null,
            },
        });
    }
    async getDashboardStats(user) {
        const store = await this.getMyStore(user);
        const [productsCount, totalOrderItems, pendingPayouts, settledPayouts] = await Promise.all([
            this.prisma.product.count({ where: { sellerStoreId: store.id, isActive: true } }),
            this.prisma.customerOrderItem.count({ where: { sellerStoreId: store.id } }),
            this.prisma.sellerPayout.aggregate({
                where: { sellerStoreId: store.id, status: client_1.SellerPayoutStatus.PENDING },
                _sum: { netPayoutAmount: true },
            }),
            this.prisma.sellerPayout.aggregate({
                where: { sellerStoreId: store.id, status: client_1.SellerPayoutStatus.SETTLED },
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
    async listStoresForAdmin(kycStatus) {
        let whereClause = {};
        if (kycStatus && kycStatus !== 'ALL') {
            if (kycStatus === 'PENDING') {
                whereClause = {
                    kycStatus: {
                        in: [client_1.SellerKycStatus.PENDING, client_1.SellerKycStatus.SUBMITTED],
                    },
                };
            }
            else if (Object.values(client_1.SellerKycStatus).includes(kycStatus)) {
                whereClause = { kycStatus: kycStatus };
            }
        }
        return this.prisma.sellerStore.findMany({
            where: whereClause,
            include: {
                seller: {
                    select: { id: true, name: true, mobile: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async verifyKycByAdmin(storeId, status, commissionRate, rejectionReason) {
        const store = await this.prisma.sellerStore.findUnique({ where: { id: storeId } });
        if (!store) {
            throw new common_1.NotFoundException('Seller store not found.');
        }
        if (status === client_1.SellerKycStatus.REJECTED && !rejectionReason?.trim()) {
            throw new common_1.BadRequestException('A mandatory rejection reason is required when rejecting a seller application.');
        }
        const updatedStore = await this.prisma.sellerStore.update({
            where: { id: storeId },
            data: {
                kycStatus: status,
                commissionRate: commissionRate !== undefined ? commissionRate : store.commissionRate,
                rejectionReason: status === client_1.SellerKycStatus.REJECTED ? rejectionReason : null,
            },
        });
        if (status === client_1.SellerKycStatus.VERIFIED) {
            try {
                await this.shiprocketService.addPickupLocation(storeId);
            }
            catch (err) {
                console.warn('Shiprocket pickup registration notice:', err);
            }
            const welcomeMessage = `Welcome to FarmsKing Marketplace! Your seller store application has been verified successfully. You can now start listing and selling your products across India.`;
            try {
                await this.notificationsService.create(store.sellerId, client_1.NotificationType.SYSTEM, '🎉 Seller Store Verification Approved!', welcomeMessage, { storeId, status: 'VERIFIED' });
            }
            catch (err) {
                console.warn('Welcome notification notice:', err);
            }
        }
        return updatedStore;
    }
    async updateSellerSettings(storeId, dto) {
        const store = await this.prisma.sellerStore.findUnique({ where: { id: storeId } });
        if (!store) {
            throw new common_1.NotFoundException('Seller store not found.');
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
    async generateGstr8Report(sellerStoreId, month, year) {
        try {
            await this.prisma.$executeRaw `
        UPDATE customer_order_items coi
        SET "sellerStoreId" = p."sellerStoreId",
            "subtotal" = coi.price * coi.quantity,
            "tcsAmount" = (coi.price * coi.quantity) * 0.01
        FROM products p
        WHERE coi."productId" = p.id
          AND coi."sellerStoreId" IS NULL
          AND p."sellerStoreId" IS NOT NULL;
      `;
        }
        catch (e) {
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
};
exports.SellerService = SellerService;
exports.SellerService = SellerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        shiprocket_service_1.ShiprocketService,
        notifications_service_1.NotificationsService])
], SellerService);
//# sourceMappingURL=seller.service.js.map