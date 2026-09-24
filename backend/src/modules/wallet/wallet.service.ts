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

  /**
   * Self-healing welcome bonus verification: ensures every user gets their Welcome Signup Bonus,
   * and if they signed up via referral, ensures both customer and referrer received their wallet credit.
   */
  async ensureWelcomeBonus(userId: string) {
    try {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, kingId: true, referredById: true, deletedAt: true },
      });
      if (!dbUser || dbUser.deletedAt) return;

      const existingWelcomeTx = await this.prisma.walletTransaction.findFirst({
        where: {
          userId,
          type: WalletTransactionType.CREDIT,
          reason: { contains: 'Welcome' },
        },
      });

      const settings = await this.prisma.appSetting.findUnique({ where: { id: 'default' } });
      const referralBonus = Number((settings as any)?.referralSignupBonusAmount ?? 10);
      const newUserBonus = Number((settings as any)?.newUserSignupBonusAmount ?? 10);

      if (!existingWelcomeTx && newUserBonus > 0) {
        await this.credit(
          userId,
          newUserBonus,
          dbUser.referredById
            ? '🎁 Welcome Offer Bonus (Referral Signup)'
            : '🎁 Welcome Offer Bonus (New User Signup)',
          dbUser.referredById ? { relatedUserId: dbUser.referredById } : undefined,
        );
      }

      if (dbUser.referredById && referralBonus > 0) {
        const existingReferrerTx = await this.prisma.walletTransaction.findFirst({
          where: {
            userId: dbUser.referredById,
            type: WalletTransactionType.CREDIT,
            relatedUserId: userId,
            reason: { contains: 'Referral Income' },
          },
        });

        if (!existingReferrerTx) {
          await this.credit(
            dbUser.referredById,
            referralBonus,
            `🎉 Referral Income (New user joined: ${dbUser.name || dbUser.kingId || 'User'})`,
            { relatedUserId: userId },
          );
        }
      }
    } catch (e) {
      console.warn('Failed to ensure welcome bonus:', e);
    }
  }

  async getMyWallet(user: AuthUser) {
    await this.ensureWelcomeBonus(user.id);
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
