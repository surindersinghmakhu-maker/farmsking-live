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
exports.CouponSettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const SINGLETON_ID = 'default';
let CouponSettingsService = class CouponSettingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async get() {
        return this.prisma.couponSystemSetting.upsert({
            where: { id: SINGLETON_ID },
            update: {},
            create: { id: SINGLETON_ID },
        });
    }
    async update(admin, dto) {
        const fields = {};
        const keys = [
            'partnerCouponDiscountPercent',
            'partnerCouponCommissionPercent',
            'partnerCouponMinOrderAmount',
            'partnerCouponMaxDiscountCap',
            'partnerCouponValidityDays',
            'referralCommissionPercent',
            'referralDiscountPercent',
            'referralMaxDiscountCap',
            'referralOrderLimit',
            'referralCouponValidityDays',
            'commissionCouponDiscountPercent',
            'commissionCouponCommissionPercent',
            'commissionCouponMinOrderAmount',
            'commissionCouponMaxDiscountCap',
            'commissionCouponValidityDays',
            'inviteCouponDiscountPercent',
            'inviteCouponCommissionPercent',
            'inviteCouponValidityDays',
            'inviteCouponUsageLimit',
        ];
        for (const key of keys) {
            if (dto[key] !== undefined)
                fields[key] = dto[key];
        }
        return this.prisma.couponSystemSetting.upsert({
            where: { id: SINGLETON_ID },
            create: { id: SINGLETON_ID, ...fields, updatedById: admin.id },
            update: { ...fields, updatedById: admin.id },
        });
    }
};
exports.CouponSettingsService = CouponSettingsService;
exports.CouponSettingsService = CouponSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CouponSettingsService);
//# sourceMappingURL=coupon-settings.service.js.map