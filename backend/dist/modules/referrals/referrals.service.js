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
exports.ReferralsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
let ReferralsService = class ReferralsService {
    prisma;
    walletService;
    constructor(prisma, walletService) {
        this.prisma = prisma;
        this.walletService = walletService;
    }
    async linkReferralOnSignUp(referredUserId, referrerKingId) {
        if (!referrerKingId)
            return null;
        const referrer = await this.prisma.user.findFirst({
            where: {
                kingId: referrerKingId.trim(),
                deletedAt: null,
            },
        });
        if (!referrer || referrer.id === referredUserId) {
            return null;
        }
        const existing = await this.prisma.userReferral.findUnique({
            where: { referredUserId },
        });
        if (existing)
            return existing;
        const directRef = await this.prisma.userReferral.create({
            data: {
                referrerId: referrer.id,
                referredUserId,
                level: 1,
                trustScoreBonus: 10,
            },
        });
        const grandparentRef = await this.prisma.userReferral.findUnique({
            where: { referredUserId: referrer.id },
        });
        if (grandparentRef) {
            await this.prisma.userReferral.create({
                data: {
                    referrerId: grandparentRef.referrerId,
                    referredUserId,
                    level: 2,
                    trustScoreBonus: 5,
                },
            }).catch(() => null);
        }
        await this.checkAndRewardMilestoneFreeCoupon(referrer.id).catch(() => null);
        return directRef;
    }
    async creditLifetimeRoyalty(sourceUserId, purchaseAmount, royaltyType, referenceCode) {
        if (!purchaseAmount || purchaseAmount <= 0)
            return;
        const referrals = await this.prisma.userReferral.findMany({
            where: { referredUserId: sourceUserId },
            include: { referrer: { select: { id: true, name: true, kingId: true } } },
        });
        const sourceUser = await this.prisma.user.findUnique({
            where: { id: sourceUserId },
            select: { name: true, kingId: true },
        });
        const sourceLabel = sourceUser ? `${sourceUser.name} (${sourceUser.kingId || 'Farmer'})` : 'Referred Farmer';
        for (const ref of referrals) {
            let rate = 0;
            if (royaltyType === 'PLAN_PURCHASE') {
                rate = ref.level === 1 ? 0.01 : 0.005;
            }
            else {
                rate = ref.level === 1 ? 0.0001 : 0.00005;
            }
            const royaltyAmount = Math.round(purchaseAmount * rate * 100) / 100;
            if (royaltyAmount > 0) {
                await this.prisma.referralRoyalty.create({
                    data: {
                        userId: ref.referrerId,
                        sourceUserId,
                        amount: royaltyAmount,
                        royaltyType,
                        referenceCode: referenceCode || null,
                    },
                });
                const label = royaltyType === 'PLAN_PURCHASE' ? (ref.level === 1 ? '1%' : '0.5%') : (ref.level === 1 ? '0.01%' : '0.005%');
                await this.walletService.credit(ref.referrerId, royaltyAmount, `Lifetime Royalty (${label}) for ${royaltyType === 'PLAN_PURCHASE' ? 'plan renewal' : 'shopping'} by ${sourceLabel}`, { relatedUserId: sourceUserId });
            }
        }
    }
    async checkAndRewardMilestoneFreeCoupon(referrerId, planTier = client_1.FarmerSubscriptionPlan.PRO) {
        const threshold = 20;
        const directCount = await this.prisma.userReferral.count({
            where: { referrerId, level: 1 },
        });
        if (directCount > 0 && directCount % threshold === 0) {
            const superAdmin = await this.prisma.user.findFirst({
                where: { role: client_1.Role.SUPER_ADMIN, deletedAt: null },
                select: { id: true },
            });
            if (!superAdmin)
                return;
            const prefix = planTier === client_1.FarmerSubscriptionPlan.PRO ? 'KC-LITE' : planTier === client_1.FarmerSubscriptionPlan.SMART ? 'KC-PRO' : 'KC-FREE';
            const code = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
            return this.prisma.farmerPlanCoupon.create({
                data: {
                    code,
                    category: client_1.PlanCouponCategory.FARMER_PLAN,
                    plan: planTier,
                    daysGranted: 365,
                    assignedFarmerId: referrerId,
                    createdById: superAdmin.id,
                    createdByRole: client_1.Role.SUPER_ADMIN,
                    generationCostAmount: null,
                },
            });
        }
    }
    async getMyReferralNetwork(user) {
        const directReferrals = await this.prisma.userReferral.findMany({
            where: { referrerId: user.id, level: 1 },
            include: {
                referredUser: {
                    select: { id: true, name: true, kingId: true, mobile: true, createdAt: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const extendedReferrals = await this.prisma.userReferral.findMany({
            where: { referrerId: user.id, level: 2 },
            include: {
                referredUser: {
                    select: { id: true, name: true, kingId: true, createdAt: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const royalties = await this.prisma.referralRoyalty.findMany({
            where: { userId: user.id },
            include: {
                sourceUser: { select: { id: true, name: true, kingId: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const totalRoyaltiesEarned = royalties.reduce((sum, r) => sum + Number(r.amount), 0);
        const currentUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { kingId: true },
        });
        const inviteKingId = currentUser?.kingId || user.id;
        const inviteUrl = `https://farmsking.com/invite?ref=${inviteKingId}`;
        return {
            kingId: inviteKingId,
            inviteUrl,
            directCount: directReferrals.length,
            extendedCount: extendedReferrals.length,
            totalNetworkCount: directReferrals.length + extendedReferrals.length,
            totalRoyaltiesEarned: Math.round(totalRoyaltiesEarned * 100) / 100,
            directReferrals,
            extendedReferrals,
            royaltiesHistory: royalties,
        };
    }
};
exports.ReferralsService = ReferralsService;
exports.ReferralsService = ReferralsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService])
], ReferralsService);
//# sourceMappingURL=referrals.service.js.map