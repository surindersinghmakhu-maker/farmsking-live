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
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let WalletService = class WalletService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    credit(userId, amount, reason, meta) {
        return this.prisma.walletTransaction.create({
            data: { userId, type: client_1.WalletTransactionType.CREDIT, amount, reason, ...meta },
        });
    }
    debit(userId, amount, reason, meta) {
        return this.prisma.walletTransaction.create({
            data: { userId, type: client_1.WalletTransactionType.DEBIT, amount, reason, ...meta },
        });
    }
    async getBalance(userId) {
        const [credits, debits] = await Promise.all([
            this.prisma.walletTransaction.aggregate({
                where: { userId, type: client_1.WalletTransactionType.CREDIT },
                _sum: { amount: true },
            }),
            this.prisma.walletTransaction.aggregate({
                where: { userId, type: client_1.WalletTransactionType.DEBIT },
                _sum: { amount: true },
            }),
        ]);
        return Number(credits._sum.amount ?? 0) - Number(debits._sum.amount ?? 0);
    }
    async getMyWallet(user) {
        return this.getWalletForUser(user.id);
    }
    async getWalletForUser(userId) {
        const [balance, transactions] = await Promise.all([
            this.getBalance(userId),
            this.prisma.walletTransaction.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 200,
                include: { relatedUser: { select: { id: true, name: true, kingId: true, mobile: true } } },
            }),
        ]);
        return { balance, transactions };
    }
    async adminCreditWallet(admin, userId, amount, reason) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        await this.credit(userId, amount, reason?.trim() || `Manual credit by admin (${admin.id})`);
        return this.getWalletForUser(userId);
    }
    async adminDebitWallet(admin, userId, amount, reason) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        await this.debit(userId, amount, reason?.trim() || `Manual debit by admin (${admin.id})`);
        return this.getWalletForUser(userId);
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map