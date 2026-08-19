import { Injectable, NotFoundException } from '@nestjs/common';
import { WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  credit(userId: string, amount: number, reason: string, meta?: { couponRedemptionId?: string; withdrawalRequestId?: string; relatedUserId?: string }) {
    return this.prisma.walletTransaction.create({
      data: { userId, type: WalletTransactionType.CREDIT, amount, reason, ...meta },
    });
  }

  debit(userId: string, amount: number, reason: string, meta?: { couponRedemptionId?: string; withdrawalRequestId?: string; relatedUserId?: string }) {
    return this.prisma.walletTransaction.create({
      data: { userId, type: WalletTransactionType.DEBIT, amount, reason, ...meta },
    });
  }

  async getBalance(userId: string): Promise<number> {
    const [credits, debits] = await Promise.all([
      this.prisma.walletTransaction.aggregate({
        where: { userId, type: WalletTransactionType.CREDIT },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: { userId, type: WalletTransactionType.DEBIT },
        _sum: { amount: true },
      }),
    ]);
    return Number(credits._sum.amount ?? 0) - Number(debits._sum.amount ?? 0);
  }

  async getMyWallet(user: AuthUser) {
    return this.getWalletForUser(user.id);
  }

  /** Admin: full ledger for any partner/advisor wallet — same shape as getMyWallet, just not scoped to the caller. */
  async getWalletForUser(userId: string) {
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

  /** Admin/Super Admin manual top-up — adds balance to any user's wallet (cash top-up, goodwill credit, correction). */
  async adminCreditWallet(admin: AuthUser, userId: string, amount: number, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    await this.credit(userId, amount, reason?.trim() || `Manual credit by admin (${admin.id})`);
    return this.getWalletForUser(userId);
  }

  /** Admin/Super Admin manual deduction — corrects an over-credit or reclaims balance from any user's wallet. */
  async adminDebitWallet(admin: AuthUser, userId: string, amount: number, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    await this.debit(userId, amount, reason?.trim() || `Manual debit by admin (${admin.id})`);
    return this.getWalletForUser(userId);
  }
}
