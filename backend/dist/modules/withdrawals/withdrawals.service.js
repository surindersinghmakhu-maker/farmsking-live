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
const partner_profile_util_1 = require("../../common/utils/partner-profile.util");
let WithdrawalsService = class WithdrawalsService {
    prisma;
    walletService;
    constructor(prisma, walletService) {
        this.prisma = prisma;
        this.walletService = walletService;
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
        await this.assertPayoutProfileComplete(user);
        const balance = await this.walletService.getBalance(user.id);
        if (dto.requestedAmount > balance) {
            throw new common_1.BadRequestException(`Requested amount exceeds your wallet balance of ₹${balance.toFixed(2)}.`);
        }
        return this.prisma.withdrawalRequest.create({
            data: { businessPartnerId: user.id, requestedAmount: dto.requestedAmount },
        });
    }
    listMine(user) {
        return this.prisma.withdrawalRequest.findMany({
            where: { businessPartnerId: user.id },
            orderBy: { requestedAt: 'desc' },
        });
    }
    listAll() {
        return this.prisma.withdrawalRequest.findMany({
            include: { businessPartner: { select: { id: true, name: true, mobile: true } } },
            orderBy: { requestedAt: 'desc' },
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
        const updated = await this.prisma.withdrawalRequest.update({
            where: { id },
            data: {
                status: client_1.WithdrawalStatus.APPROVED,
                approvedAmount,
                processedAt: new Date(),
                processedById: admin.id,
                notes: dto.notes,
            },
        });
        await this.walletService.debit(request.businessPartnerId, approvedAmount, `Withdrawal payout approved`, { withdrawalRequestId: id });
        return updated;
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
        wallet_service_1.WalletService])
], WithdrawalsService);
//# sourceMappingURL=withdrawals.service.js.map