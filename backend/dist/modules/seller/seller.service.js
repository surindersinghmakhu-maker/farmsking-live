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
                additionalDoc1Title: dto.additionalDoc1Title || (dto.sellerPhotoUrl ? 'Seller Photo' : undefined),
                additionalDoc1Url: dto.additionalDoc1Url || dto.sellerPhotoUrl,
                additionalDoc2Title: dto.additionalDoc2Title || (dto.logoDocUrl ? 'Business Logo' : undefined),
                additionalDoc2Url: dto.additionalDoc2Url || dto.logoDocUrl,
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
            throw new common_1.NotFoundException('Seller store not found. Please register first.');
        }
        return {
            ...store,
            sellerPhotoUrl: store.additionalDoc1Url || null,
            logoDocUrl: store.additionalDoc2Url || null,
        };
    }
    async updateKyc(user, dto) {
        const store = await this.getMyStore(user);
        if (dto.wantsToSellFood) {
            if (!dto.fssaiNo || !/^\d{14}$/.test(dto.fssaiNo.trim())) {
                throw new common_1.BadRequestException('FSSAI License Number must be a valid 14-digit numeric code when listing food products.');
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
        const stores = await this.prisma.sellerStore.findMany({
            where: whereClause,
            include: {
                seller: {
                    select: { id: true, name: true, mobile: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (stores.length === 0)
            return [];
        const storeIds = stores.map((s) => s.id);
        const [payoutsGrouped, subOrdersGrouped] = await Promise.all([
            this.prisma.sellerPayout.groupBy({
                by: ['sellerStoreId', 'status'],
                where: { sellerStoreId: { in: storeIds } },
                _sum: { totalGrossAmount: true, totalCommissionAmount: true, totalTcsAmount: true, netPayoutAmount: true },
            }),
            this.prisma.subOrder.groupBy({
                by: ['sellerStoreId', 'settlementStatus'],
                where: { sellerStoreId: { in: storeIds }, orderStatus: { not: client_1.SubOrderStatus.CANCELLED } },
                _sum: { subtotal: true, commissionAmount: true, vendorNetPayout: true },
            }),
        ]);
        const metricsMap = new Map();
        for (const sid of storeIds) {
            metricsMap.set(sid, { grossSales: 0, commissionAmount: 0, tcsAmount: 0, settledBalance: 0, pendingBalance: 0, heldBalance: 0 });
        }
        for (const row of subOrdersGrouped) {
            const m = metricsMap.get(row.sellerStoreId);
            if (!m)
                continue;
            m.grossSales += Number(row._sum.subtotal || 0);
            m.commissionAmount += Number(row._sum.commissionAmount || 0);
            if (row.settlementStatus === client_1.SettlementStatus.HOLD) {
                m.heldBalance += Number(row._sum.vendorNetPayout || 0);
            }
        }
        for (const row of payoutsGrouped) {
            const m = metricsMap.get(row.sellerStoreId);
            if (!m)
                continue;
            m.tcsAmount += Number(row._sum.totalTcsAmount || 0);
            if (row.status === client_1.SellerPayoutStatus.SETTLED) {
                m.settledBalance += Number(row._sum.netPayoutAmount || 0);
            }
            else if (row.status === client_1.SellerPayoutStatus.PENDING || row.status === client_1.SellerPayoutStatus.PROCESSING) {
                m.pendingBalance += Number(row._sum.netPayoutAmount || 0);
            }
        }
        let commMap = new Map();
        try {
            const rawCommissions = await this.prisma.$queryRaw(client_1.Prisma.sql `SELECT "id", "categoryCommissions" FROM "seller_stores" WHERE "id" IN (${client_1.Prisma.join(storeIds)})`);
            commMap = new Map(rawCommissions.map((r) => [r.id, r.categoryCommissions || {}]));
        }
        catch {
        }
        return stores.map((s) => {
            const m = metricsMap.get(s.id);
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
        if (dto.categoryCommissions) {
            try {
                await this.prisma.$executeRawUnsafe(`UPDATE "seller_stores" SET "categoryCommissions" = $1::jsonb WHERE "id" = $2`, JSON.stringify(dto.categoryCommissions), storeId);
            }
            catch (err) {
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
    async generateGstr8Report(sellerStoreId, month, year) {
        const store = await this.prisma.sellerStore.findUnique({
            where: { id: sellerStoreId },
            select: { gstin: true },
        });
        const isGstRegistered = Boolean(store?.gstin && store.gstin.trim().length >= 15);
        try {
            await this.prisma.$executeRaw `
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
    async getMyOrders(user) {
        const store = await this.prisma.sellerStore.findUnique({
            where: { sellerId: user.id },
            select: { id: true, storeName: true },
        });
        if (!store) {
            throw new common_1.NotFoundException('Seller store not found.');
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
    async updateMySubOrderStatus(user, subOrderId, nextStatus) {
        const store = await this.prisma.sellerStore.findUnique({
            where: { sellerId: user.id },
            select: { id: true, kycStatus: true },
        });
        if (!store) {
            throw new common_1.NotFoundException('Seller store not found.');
        }
        const subOrder = await this.prisma.subOrder.findUnique({ where: { id: subOrderId } });
        if (!subOrder) {
            throw new common_1.NotFoundException('Sub-order not found.');
        }
        if (subOrder.sellerStoreId !== store.id) {
            throw new common_1.ForbiddenException('You can only manage orders belonging to your own seller store.');
        }
        const allowedSellerTransitions = {
            [client_1.SubOrderStatus.PLACED]: [client_1.SubOrderStatus.ACCEPTED, client_1.SubOrderStatus.PACKED],
            [client_1.SubOrderStatus.ACCEPTED]: [client_1.SubOrderStatus.PACKED],
        };
        const allowedNext = allowedSellerTransitions[subOrder.orderStatus] || [];
        if (!allowedNext.includes(nextStatus)) {
            throw new common_1.BadRequestException(`Cannot transition sub-order from ${subOrder.orderStatus} to ${nextStatus}.`);
        }
        return this.prisma.subOrder.update({
            where: { id: subOrderId },
            data: { orderStatus: nextStatus },
        });
    }
    async listAllPayoutsForAdmin(status) {
        const where = {};
        if (status && Object.values(client_1.SellerPayoutStatus).includes(status)) {
            where.status = status;
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
    async settleStorePendingPayoutsByAdmin(storeId, cashfreeUtrNo) {
        const pending = await this.prisma.sellerPayout.findMany({
            where: { sellerStoreId: storeId, status: client_1.SellerPayoutStatus.PENDING },
        });
        if (pending.length === 0) {
            throw new common_1.BadRequestException('No pending payouts found for this seller store.');
        }
        const utr = cashfreeUtrNo?.trim() || `BANK-UTR-${Date.now().toString(36).toUpperCase()}`;
        const settled = [];
        for (const p of pending) {
            settled.push(await this.settlePayoutByAdmin(p.id, utr));
        }
        return { settledCount: settled.length, utr, payouts: settled };
    }
    async settlePayoutByAdmin(payoutId, cashfreeUtrNo) {
        const payout = await this.prisma.sellerPayout.findUnique({ where: { id: payoutId } });
        if (!payout) {
            throw new common_1.NotFoundException('Seller payout record not found.');
        }
        const updated = await this.prisma.sellerPayout.update({
            where: { id: payoutId },
            data: {
                status: client_1.SellerPayoutStatus.SETTLED,
                cashfreeUtrNo: cashfreeUtrNo?.trim() || payout.cashfreeUtrNo || `BANK-UTR-${Date.now().toString(36).toUpperCase()}`,
                paidAt: new Date(),
            },
        });
        const refParts = payout.payoutRefNo.split('-');
        if (refParts.length >= 4 && refParts[0] === 'PAY') {
            const orderNumGuess = refParts.slice(1, -1).join('-');
            await this.prisma.subOrder.updateMany({
                where: {
                    sellerStoreId: payout.sellerStoreId,
                    order: { orderNumber: orderNumGuess },
                    settlementStatus: client_1.SettlementStatus.HOLD,
                },
                data: {
                    settlementStatus: client_1.SettlementStatus.SETTLED,
                    cashfreeTransferId: updated.cashfreeUtrNo,
                },
            });
        }
        return updated;
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