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

  /** Admin/Super Admin: Comprehensive report of all issued bonuses, statistics & user bonus ledgers. */
  async getAdminBonusReport() {
    const bonusTxs = await this.prisma.walletTransaction.findMany({
      where: {
        type: WalletTransactionType.CREDIT,
        OR: [
          { reason: { contains: 'Welcome' } },
          { reason: { contains: 'Referral' } },
          { reason: { contains: 'Bonus' } },
          { reason: { contains: 'Offer' } },
          { reason: { contains: 'Reward' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: {
        user: { select: { id: true, name: true, mobile: true, kingId: true, role: true } },
        relatedUser: { select: { id: true, name: true, mobile: true, kingId: true, role: true } },
      },
    });

    let totalWelcome = 0, countWelcome = 0;
    let totalReferralSignup = 0, countReferralSignup = 0;
    let totalReferralPlan = 0, countReferralPlan = 0;
    let totalOtherBonus = 0, countOtherBonus = 0;

    const formattedTxs = bonusTxs.map((tx) => {
      const r = tx.reason.toLowerCase();
      let category: 'WELCOME' | 'REFERRAL_SIGNUP' | 'REFERRAL_PLAN' | 'OTHER' = 'OTHER';

      if (r.includes('welcome')) {
        category = 'WELCOME';
        totalWelcome += tx.amount;
        countWelcome++;
      } else if (r.includes('referral income') || (r.includes('referral') && r.includes('joined'))) {
        category = 'REFERRAL_SIGNUP';
        totalReferralSignup += tx.amount;
        countReferralSignup++;
      } else if (r.includes('plan bonus') || (r.includes('referral') && r.includes('plan'))) {
        category = 'REFERRAL_PLAN';
        totalReferralPlan += tx.amount;
        countReferralPlan++;
      } else {
        totalOtherBonus += tx.amount;
        countOtherBonus++;
      }

      return {
        id: tx.id,
        amount: tx.amount,
        reason: tx.reason,
        createdAt: tx.createdAt,
        category,
        user: tx.user,
        relatedUser: tx.relatedUser,
      };
    });

    const totalBonusIssued = totalWelcome + totalReferralSignup + totalReferralPlan + totalOtherBonus;

    const [allCredits, allDebits] = await Promise.all([
      this.prisma.walletTransaction.aggregate({
        where: { type: WalletTransactionType.CREDIT },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: { type: WalletTransactionType.DEBIT },
        _sum: { amount: true },
      }),
    ]);

    const totalWalletLiability = Number(allCredits._sum.amount ?? 0) - Number(allDebits._sum.amount ?? 0);

    return {
      summary: {
        totalBonusIssued,
        totalWelcome,
        countWelcome,
        totalReferralSignup,
        countReferralSignup,
        totalReferralPlan,
        countReferralPlan,
        totalOtherBonus,
        countOtherBonus,
        totalWalletLiability: Math.max(0, totalWalletLiability),
        totalBonusTransactions: bonusTxs.length,
      },
      transactions: formattedTxs,
    };
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

  /**
   * Called when a referred user purchases/activates a paid plan.
   * Credits the pending referral plan bonus (default ₹50) to the referrer's wallet.
   */
  async processPaidPlanReferralBonus(referredUserId: string) {
    try {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: referredUserId },
        select: { id: true, name: true, kingId: true, referredById: true },
      });

      if (!dbUser || !dbUser.referredById) return;

      const referrerId = dbUser.referredById;

      // Check if plan bonus was already credited to referrer for this referee
      const existingPlanBonus = await this.prisma.walletTransaction.findFirst({
        where: {
          userId: referrerId,
          type: WalletTransactionType.CREDIT,
          relatedUserId: referredUserId,
          reason: { contains: 'Plan Bonus' },
        },
      });

      if (existingPlanBonus) return;

      const settings = await this.prisma.appSetting.findUnique({ where: { id: 'default' } });
      const planUpgradeBonusAmount = Number((settings as any)?.referralPaidPlanBonusAmount ?? (settings as any)?.referralPlanUpgradeBonusAmount ?? 50);

      if (planUpgradeBonusAmount > 0) {
        await this.credit(
          referrerId,
          planUpgradeBonusAmount,
          `👑 Referral Paid Plan Bonus (Referee upgraded plan: ${dbUser.name || dbUser.kingId || 'User'})`,
          { relatedUserId: referredUserId },
        );
      }
    } catch (e) {
      console.warn('Failed to process paid plan referral bonus:', e);
    }
  }

  /**
   * Generates a detailed statement of referrals and bonuses:
   * - Shows referees, their King IDs, signup date, issued bonus, pending plan bonus, and status (PENDING / SUCCESS).
   * - If the requesting user was referred by someone, includes reference info & welcome bonus statement.
   */
  async getReferralStatement(userId: string) {
    await this.ensureWelcomeBonus(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        kingId: true,
        referredById: true,
        referredBy: {
          select: {
            id: true,
            name: true,
            kingId: true,
            mobile: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const settings = await this.prisma.appSetting.findUnique({ where: { id: 'default' } });
    const signupBonusAmount = Number((settings as any)?.referralSignupBonusAmount ?? 10);
    const welcomeBonusAmount = Number((settings as any)?.newUserSignupBonusAmount ?? 10);
    const planUpgradeBonusAmount = Number((settings as any)?.referralPaidPlanBonusAmount ?? (settings as any)?.referralPlanUpgradeBonusAmount ?? 50);

    // Fetch referees (users referred by this user)
    const referees = await this.prisma.user.findMany({
      where: { referredById: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        kingId: true,
        createdAt: true,
        farmerPlan: {
          select: {
            plan: true,
            startDate: true,
          },
        },
        farmerPlanHistory: {
          select: {
            id: true,
            plan: true,
          },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch wallet transactions for these referees
    const refereeIds = referees.map((r) => r.id);
    const walletTxs = await this.prisma.walletTransaction.findMany({
      where: {
        userId,
        type: WalletTransactionType.CREDIT,
        relatedUserId: { in: refereeIds },
      },
      select: {
        amount: true,
        reason: true,
        relatedUserId: true,
        createdAt: true,
      },
    });

    const refereeStatement = referees.map((referee) => {
      const refereeTxs = walletTxs.filter((tx) => tx.relatedUserId === referee.id);
      const signupTx = refereeTxs.find((tx) => tx.reason.includes('Referral Income') || tx.reason.includes('joined'));
      const planTx = refereeTxs.find((tx) => tx.reason.includes('Plan Bonus'));

      const hasPaidPlan =
        (referee.farmerPlan && referee.farmerPlan.plan !== 'FREE') ||
        Boolean(planTx) ||
        referee.farmerPlanHistory.some((h) => h.plan !== 'FREE');

      const signupBonusIssued = signupTx ? Number(signupTx.amount) : signupBonusAmount;
      const planBonusIssued = planTx ? Number(planTx.amount) : (hasPaidPlan ? planUpgradeBonusAmount : 0);
      const issuedAmount = signupBonusIssued + planBonusIssued;
      const pendingAmount = hasPaidPlan || planTx ? 0 : planUpgradeBonusAmount;
      const status = hasPaidPlan || planTx ? 'SUCCESS' : 'PENDING';

      return {
        refereeId: referee.id,
        refereeName: referee.name || 'User',
        refereeKingId: referee.kingId || 'N/A',
        registrationDate: referee.createdAt.toISOString(),
        issuedAmount,
        signupBonusIssued,
        planBonusIssued,
        pendingAmount,
        status,
        referenceCodeUsed: referee.kingId ? `REF-${referee.kingId}` : 'DIRECT',
      };
    });

    let myReferralInfo: any = null;
    if (user.referredBy) {
      const myPlanRecord = await this.prisma.farmerPlan.findUnique({
        where: { farmerId: userId },
        select: { plan: true },
      });
      const hasPaidPlan = myPlanRecord && myPlanRecord.plan !== 'FREE';

      myReferralInfo = {
        referredByName: user.referredBy.name || 'Sponsor',
        referredByKingId: user.referredBy.kingId || 'N/A',
        referenceCode: user.referredBy.kingId ? `REF-${user.referredBy.kingId}` : 'DIRECT',
        welcomeBonusIssued: welcomeBonusAmount,
        planBonusPending: hasPaidPlan ? 0 : planUpgradeBonusAmount,
        status: hasPaidPlan ? 'SUCCESS' : 'PENDING',
      };
    }

    return {
      summary: {
        totalReferees: refereeStatement.length,
        totalIssuedBonus: refereeStatement.reduce((sum, r) => sum + r.issuedAmount, 0),
        totalPendingBonus: refereeStatement.reduce((sum, r) => sum + r.pendingAmount, 0),
        signupBonusAmount,
        welcomeBonusAmount,
        planUpgradeBonusAmount,
      },
      myReferralInfo,
      referees: refereeStatement,
    };
  }
}
