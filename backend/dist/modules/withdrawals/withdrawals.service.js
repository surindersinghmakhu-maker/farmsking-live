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
exports.WithdrawalsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const app_settings_service_1 = require("../app-settings/app-settings.service");
const partner_profile_util_1 = require("../../common/utils/partner-profile.util");
let WithdrawalsService = class WithdrawalsService {
    constructor(prisma, walletService, appSettingsService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.appSettingsService = appSettingsService;
    }
    async calcWithdrawalCharges(amount) {
        const s = await this.appSettingsService.get();
        const taxEnabled = s.walletTaxEnabled ?? true;
        if (!taxEnabled) {
            return { platformFee: 0, gstAmount: 0, netPayable: amount };
        }
        const feeRate = (s.withdrawalPlatformFeePercent ?? 2.0) / 100;
        const gstRate = (s.withdrawalGstPercent ?? 18.0) / 100;
        const platformFee = parseFloat((amount * feeRate).toFixed(2));
        const gstAmount = parseFloat((platformFee * gstRate).toFixed(2));
        const netPayable = parseFloat((amount - platformFee - gstAmount).toFixed(2));
        return { platformFee, gstAmount, netPayable };
    }
    async assertPayoutProfileComplete(user) {
        const isAdvisor = user.role === client_1.Role.ADVISOR;
        const fields = isAdvisor ? partner_profile_util_1.ADVISOR_PROFILE_FIELDS : partner_profile_util_1.BUSINESS_PARTNER_PROFILE_FIELDS;
        const record = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: Object.fromEntries(fields.map((f) => [f, true])),
        });
        if (!record) {
            throw new common_1.NotFoundException('User not found.');
        }
        const status = isAdvisor ? (0, partner_profile_util_1.getAdvisorPayoutProfileStatus)(record) : (0, partner_profile_util_1.getPartnerProfileStatus)(record);
        if (!status.profileComplete) {
            throw new common_1.BadRequestException(`Complete your profile before withdrawing — missing: ${status.missingFields.join(', ')}.`);
        }
    }
    async create(user, dto) {
        if (dto.requestedAmount < 50) {
            throw new common_1.BadRequestException('Minimum withdrawal limit is ₹50.');
        }
        await this.assertPayoutProfileComplete(user);
        const balance = await this.walletService.getBalance(user.id);
        if (dto.requestedAmount > balance) {
            throw new common_1.BadRequestException(`Requested amount exceeds your wallet balance of ₹${balance.toFixed(2)}.`);
        }
        const { platformFee, gstAmount, netPayable } = await this.calcWithdrawalCharges(dto.requestedAmount);
        return this.prisma.withdrawalRequest.create({
            data: {
                businessPartnerId: user.id,
                requestedAmount: dto.requestedAmount,
                platformFeeAmount: platformFee,
                gstAmount: gstAmount,
                netPayableAmount: netPayable,
                platformExpense: true,
            },
        });
    }
    listMine(user) {
        return this.prisma.withdrawalRequest.findMany({
            where: { businessPartnerId: user.id },
            orderBy: { requestedAt: 'desc' },
        });
    }
    async listAll() {
        const requests = await this.prisma.withdrawalRequest.findMany({
            include: {
                businessPartner: {
                    select: {
                        id: true,
                        name: true,
                        mobile: true,
                        kingId: true,
                        upiId: true,
                        bankAccountNumber: true,
                        bankIfsc: true,
                    },
                },
            },
            orderBy: { requestedAt: 'desc' },
        });
        const partnerIds = Array.from(new Set(requests.map((r) => r.businessPartnerId)));
        const [credits, debits, creditTxs] = await Promise.all([
            this.prisma.walletTransaction.groupBy({
                by: ['userId'],
                where: { userId: { in: partnerIds }, type: 'CREDIT' },
                _sum: { amount: true },
            }),
            this.prisma.walletTransaction.groupBy({
                by: ['userId'],
                where: { userId: { in: partnerIds }, type: 'DEBIT' },
                _sum: { amount: true },
            }),
            this.prisma.walletTransaction.findMany({
                where: { userId: { in: partnerIds }, type: 'CREDIT' },
                select: { userId: true, amount: true, reason: true },
            }),
        ]);
        const creditMap = new Map(credits.map((c) => [c.userId, Number(c._sum.amount ?? 0)]));
        const debitMap = new Map(debits.map((d) => [d.userId, Number(d._sum.amount ?? 0)]));
        const welcomeMap = new Map();
        const referralMap = new Map();
        const commissionMap = new Map();
        creditTxs.forEach((tx) => {
            const amt = Number(tx.amount || 0);
            const r = tx.reason.toLowerCase();
            if (r.includes('welcome')) {
                welcomeMap.set(tx.userId, (welcomeMap.get(tx.userId) || 0) + amt);
            }
            else if (r.includes('referral') || r.includes('joined') || r.includes('plan bonus')) {
                referralMap.set(tx.userId, (referralMap.get(tx.userId) || 0) + amt);
            }
            else {
                commissionMap.set(tx.userId, (commissionMap.get(tx.userId) || 0) + amt);
            }
        });
        return requests.map((r) => {
            const totalCredit = creditMap.get(r.businessPartnerId) || 0;
            const totalDebit = debitMap.get(r.businessPartnerId) || 0;
            const balance = totalCredit - totalDebit;
            const welcomeEarnings = welcomeMap.get(r.businessPartnerId) || 0;
            const referralEarnings = referralMap.get(r.businessPartnerId) || 0;
            const commissionEarnings = commissionMap.get(r.businessPartnerId) || 0;
            return {
                ...r,
                partnerWallet: {
                    balance,
                    totalCredit,
                    totalDebit,
                    welcomeEarnings,
                    referralEarnings,
                    commissionEarnings,
                },
            };
        });
    }
    async findOneOrThrow(id) {
        const request = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
        if (!request) {
            throw new common_1.NotFoundException('Withdrawal request not found.');
        }
        return request;
    }
    async approve(admin, id, dto) {
        const request = await this.findOneOrThrow(id);
        if (request.status !== client_1.WithdrawalStatus.PENDING) {
            throw new common_1.ConflictException('This withdrawal request has already been processed.');
        }
        const approvedAmount = dto.approvedAmount ?? Number(request.requestedAmount);
        const balance = await this.walletService.getBalance(request.businessPartnerId);
        if (approvedAmount > balance) {
            throw new common_1.BadRequestException(`Approved amount exceeds the partner's wallet balance of ₹${balance.toFixed(2)}.`);
        }
        const { platformFee, gstAmount, netPayable } = await this.calcWithdrawalCharges(approvedAmount);
        const updated = await this.prisma.withdrawalRequest.update({
            where: { id },
            data: {
                status: client_1.WithdrawalStatus.APPROVED,
                approvedAmount,
                platformFeeAmount: platformFee,
                gstAmount: gstAmount,
                netPayableAmount: netPayable,
                processedAt: new Date(),
                processedById: admin.id,
                notes: dto.notes,
            },
        });
        await this.walletService.debit(request.businessPartnerId, approvedAmount, `Withdrawal payout approved (Platform fee: ₹${platformFee} + GST: ₹${gstAmount} | Net: ₹${netPayable})`, { withdrawalRequestId: id });
        return { ...updated, platformFeeAmount: platformFee, gstAmount, netPayableAmount: netPayable };
    }
    async reject(admin, id, notes) {
        const request = await this.findOneOrThrow(id);
        if (request.status !== client_1.WithdrawalStatus.PENDING) {
            throw new common_1.ConflictException('This withdrawal request has already been processed.');
        }
        return this.prisma.withdrawalRequest.update({
            where: { id },
            data: { status: client_1.WithdrawalStatus.REJECTED, processedAt: new Date(), processedById: admin.id, notes },
        });
    }
};
exports.WithdrawalsService = WithdrawalsService;
exports.WithdrawalsService = WithdrawalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        app_settings_service_1.AppSettingsService])
], WithdrawalsService);
//# sourceMappingURL=withdrawals.service.js.map