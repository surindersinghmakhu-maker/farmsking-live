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
exports.BasicPlanCouponsService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const DAY_MS = 24 * 60 * 60 * 1000;
const PRICE_PER_DAY = 2;
const PARTNER_RATE = 0.9;
function generateCode() {
    return `BASIC-${(0, crypto_1.randomBytes)(3).toString('hex').toUpperCase()}`;
}
const LIST_SELECT = {
    createdBy: { select: { id: true, name: true, kingId: true } },
    purchasedBy: { select: { id: true, name: true, kingId: true } },
    usedByFarmer: { select: { id: true, name: true, kingId: true } },
};
let BasicPlanCouponsService = class BasicPlanCouponsService {
    prisma;
    walletService;
    constructor(prisma, walletService) {
        this.prisma = prisma;
        this.walletService = walletService;
    }
    async create(admin, dto) {
        let code = generateCode();
        while (await this.prisma.basicPlanCoupon.findUnique({ where: { code } })) {
            code = generateCode();
        }
        return this.prisma.basicPlanCoupon.create({
            data: {
                code,
                daysGranted: dto.daysGranted,
                listPrice: dto.daysGranted * PRICE_PER_DAY,
                createdById: admin.id,
            },
        });
    }
    listAll() {
        return this.prisma.basicPlanCoupon.findMany({
            include: LIST_SELECT,
            orderBy: { createdAt: 'desc' },
        });
    }
    listAvailableForPurchase() {
        return this.prisma.basicPlanCoupon.findMany({
            where: { purchasedById: null, isUsed: false },
            include: LIST_SELECT,
            orderBy: { createdAt: 'asc' },
        });
    }
    listMinePurchased(partner) {
        return this.prisma.basicPlanCoupon.findMany({
            where: { purchasedById: partner.id },
            include: LIST_SELECT,
            orderBy: { createdAt: 'desc' },
        });
    }
    async purchase(partner, code) {
        const coupon = await this.prisma.basicPlanCoupon.findUnique({ where: { code: code.toUpperCase() } });
        if (!coupon) {
            throw new common_1.NotFoundException('Invalid coupon code.');
        }
        if (coupon.isUsed) {
            throw new common_1.BadRequestException('This coupon has already been used.');
        }
        if (coupon.purchasedById) {
            throw new common_1.BadRequestException('This coupon has already been purchased by another partner.');
        }
        const price = Number(coupon.listPrice) * PARTNER_RATE;
        const balance = await this.walletService.getBalance(partner.id);
        if (balance < price) {
            throw new common_1.BadRequestException('Insufficient wallet balance to purchase this coupon.');
        }
        await this.walletService.debit(partner.id, price, `Purchased Basic Plan coupon ${coupon.code} (${coupon.daysGranted} days)`);
        return this.prisma.basicPlanCoupon.update({
            where: { id: coupon.id },
            data: { purchasedById: partner.id, purchasePrice: price, purchasedAt: new Date() },
            include: LIST_SELECT,
        });
    }
    async redeem(farmer, code) {
        const coupon = await this.prisma.basicPlanCoupon.findUnique({ where: { code: code.toUpperCase() } });
        if (!coupon) {
            throw new common_1.NotFoundException('Invalid coupon code.');
        }
        if (coupon.isUsed) {
            throw new common_1.BadRequestException('This coupon has already been used.');
        }
        const now = new Date();
        const existingPlan = await this.prisma.farmerPlan.findUnique({ where: { farmerId: farmer.id } });
        const isPending = !!existingPlan?.endDate && existingPlan.endDate.getTime() > now.getTime();
        const baseDate = isPending ? existingPlan.endDate : now;
        const newEndDate = new Date(baseDate.getTime() + coupon.daysGranted * DAY_MS);
        const [plan] = await this.prisma.$transaction([
            this.prisma.farmerPlan.upsert({
                where: { farmerId: farmer.id },
                create: { farmerId: farmer.id, plan: client_1.FarmerSubscriptionPlan.PRO, endDate: newEndDate },
                update: { plan: client_1.FarmerSubscriptionPlan.PRO, endDate: newEndDate, expiredAt: null },
            }),
            this.prisma.basicPlanCoupon.update({
                where: { id: coupon.id },
                data: { isUsed: true, usedAt: now, usedByFarmerId: farmer.id },
            }),
        ]);
        return { plan, daysAdded: coupon.daysGranted, newEndDate };
    }
};
exports.BasicPlanCouponsService = BasicPlanCouponsService;
exports.BasicPlanCouponsService = BasicPlanCouponsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService])
], BasicPlanCouponsService);
//# sourceMappingURL=basic-plan-coupons.service.js.map