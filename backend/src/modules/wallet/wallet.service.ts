import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappBotService } from '../whatsapp/whatsapp.service';
import { AuthUser } from '../../common/types/auth-user.type';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly whatsappBotService?: WhatsappBotService,
  ) {}

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
      const stdReferralBonus = Number((settings as any)?.referralSignupBonusAmount ?? 10);
      const stdNewUserBonus = Number((settings as any)?.newUserSignupBonusAmount ?? 10);
      const partnerReferralBonus = Number((settings as any)?.partnerReferralCommissionAmount ?? 100);
      const partnerRefereeBonus = Number((settings as any)?.partnerRefereeSignupBonusAmount ?? 20);

      const referrer = dbUser.referredById
        ? await this.prisma.user.findUnique({
            where: { id: dbUser.referredById },
            select: { id: true, role: true, roles: true },
          })
        : null;

      const isPartner = referrer?.role === 'BUSINESS_PARTNER' || (Array.isArray(referrer?.roles) && referrer.roles.includes('BUSINESS_PARTNER'));

      // Check scheme active status and expiration date
      const todayStr = new Date().toISOString().split('T')[0];
      const isStdSchemeActive = ((settings as any)?.referralOfferSchemeEnabled ?? false) &&
        (!((settings as any)?.referralOfferExpiryDate) || (settings as any).referralOfferExpiryDate >= todayStr);

      const isPartnerSchemeActive = ((settings as any)?.partnerOfferSchemeEnabled ?? false) &&
        (!((settings as any)?.partnerOfferExpiryDate) || (settings as any).partnerOfferExpiryDate >= todayStr);

      const isSchemeActive = isPartner ? isPartnerSchemeActive : isStdSchemeActive;
      if (!isSchemeActive) return;

      const activeNewUserBonus = isPartner ? partnerRefereeBonus : stdNewUserBonus;

      // Welcome bonus is ONLY granted if user signed up with a valid referral/coupon code (referredById is present)
      if (dbUser.referredById && !existingWelcomeTx && activeNewUserBonus > 0) {
        await this.credit(
          userId,
          activeNewUserBonus,
          '🎁 Welcome Offer Bonus (Referral Signup)',
          { relatedUserId: dbUser.referredById },
        );
      }

      if (dbUser.referredById) {
        const activeBonus = isPartner ? partnerReferralBonus : stdReferralBonus;

        if (activeBonus > 0) {
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
              activeBonus,
              `🎉 Referral Income (${isPartner ? 'Business Partner Commission' : 'New user joined'}: ${dbUser.name || dbUser.kingId || 'User'})`,
              { relatedUserId: userId },
            );
          }
        }
      }
    } catch (e) {
      console.warn('Failed to ensure welcome bonus:', e);
    }
  }

  /**
   * Bulk self-healing sync: loops over all users who signed up via referral
   * and ensures both referee and referrer have received their wallet credits.
   */
  async syncAllUserReferralBonuses() {
    try {
      const referredUsers = await this.prisma.user.findMany({
        where: { referredById: { not: null }, deletedAt: null },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
        take: 500, // Process only the 500 most recent referrals to avoid OOM
      });

      for (const u of referredUsers) {
        await this.ensureWelcomeBonus(u.id);
      }
    } catch (e) {
      console.warn('Failed to sync all referral bonuses:', e);
    }
  }

  async getMyWallet(user: AuthUser) {
    await this.ensureWelcomeBonus(user.id);
    return this.getWalletForUser(user.id);
  }

  /** Admin: full ledger for any partner/advisor wallet — same shape as getMyWallet, just not scoped to the caller. */
  async getWalletForUser(userId: string) {
    const [balance, transactions, allCredits] = await Promise.all([
      this.getBalance(userId),
      this.prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: { relatedUser: { select: { id: true, name: true, kingId: true, mobile: true } } },
      }),
      this.prisma.walletTransaction.findMany({
        where: { userId, type: WalletTransactionType.CREDIT },
        select: { amount: true, reason: true },
      }),
    ]);

    let welcomeEarnings = 0;
    let referralEarnings = 0;
    let commissionEarnings = 0;

    for (const tx of allCredits) {
      const amt = Number(tx.amount || 0);
      const r = tx.reason.toLowerCase();
      if (r.includes('welcome')) {
        welcomeEarnings += amt;
      } else if (r.includes('referral') || r.includes('joined') || r.includes('plan bonus')) {
        referralEarnings += amt;
      } else {
        commissionEarnings += amt;
      }
    }

    return {
      balance,
      welcomeEarnings,
      referralEarnings,
      commissionEarnings,
      transactions,
    };
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
      const numAmt = Number(tx.amount || 0);
      const r = tx.reason.toLowerCase();
      let category: 'WELCOME' | 'REFERRAL_SIGNUP' | 'REFERRAL_PLAN' | 'OTHER' = 'OTHER';

      if (r.includes('welcome')) {
        category = 'WELCOME';
        totalWelcome += numAmt;
        countWelcome++;
      } else if (r.includes('referral income') || (r.includes('referral') && r.includes('joined'))) {
        category = 'REFERRAL_SIGNUP';
        totalReferralSignup += numAmt;
        countReferralSignup++;
      } else if (r.includes('plan bonus') || (r.includes('referral') && r.includes('plan'))) {
        category = 'REFERRAL_PLAN';
        totalReferralPlan += numAmt;
        countReferralPlan++;
      } else {
        totalOtherBonus += numAmt;
        countOtherBonus++;
      }

      return {
        id: tx.id,
        amount: numAmt,
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

  /** Admin/Super Admin: Comprehensive Automated Wallet, Withdrawal & Financial Audit Report */
  async getAdminAutomatedReport() {
    // 1. Fetch all non-deleted users with payout profiles
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        mobile: true,
        kingId: true,
        role: true,
        upiId: true,
        bankAccountNumber: true,
        bankIfsc: true,
        createdAt: true,
      },
    });

    const userIds = users.map((u) => u.id);

    // 2. Aggregate Credits and Debits per user
    const [credits, debits, withdrawals, manualTxs, inAppUseTxs, creditTxs] = await Promise.all([
      this.prisma.walletTransaction.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds }, type: WalletTransactionType.CREDIT },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds }, type: WalletTransactionType.DEBIT },
        _sum: { amount: true },
      }),
      this.prisma.withdrawalRequest.findMany({
        include: {
          businessPartner: { select: { id: true, name: true, mobile: true, kingId: true, upiId: true, bankAccountNumber: true, bankIfsc: true } },
        },
        orderBy: { requestedAt: 'desc' },
      }),
      this.prisma.walletTransaction.findMany({
        where: {
          OR: [
            { reason: { contains: 'Manual', mode: 'insensitive' } },
            { reason: { contains: 'Admin', mode: 'insensitive' } },
            { reason: { contains: 'Deduct', mode: 'insensitive' } },
            { reason: { contains: 'Credit', mode: 'insensitive' } },
            { reason: { contains: 'Adjustment', mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
        include: { user: { select: { id: true, name: true, mobile: true, kingId: true, role: true } } },
      }),
      this.prisma.walletTransaction.findMany({
        where: {
          type: WalletTransactionType.DEBIT,
          OR: [
            { reason: { contains: 'Plan', mode: 'insensitive' } },
            { reason: { contains: 'Store', mode: 'insensitive' } },
            { reason: { contains: 'Purchase', mode: 'insensitive' } },
            { reason: { contains: 'Coupon', mode: 'insensitive' } },
            { reason: { contains: 'Service', mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
        include: { user: { select: { id: true, name: true, mobile: true, kingId: true, role: true } } },
      }),
      this.prisma.walletTransaction.findMany({
        where: { userId: { in: userIds }, type: WalletTransactionType.CREDIT },
        select: { userId: true, amount: true, reason: true },
      }),
    ]);

    const creditMap = new Map(credits.map((c) => [c.userId, Number(c._sum.amount ?? 0)]));
    const debitMap = new Map(debits.map((d) => [d.userId, Number(d._sum.amount ?? 0)]));

    const welcomeMap = new Map<string, number>();
    const referralMap = new Map<string, number>();
    const commissionMap = new Map<string, number>();

    creditTxs.forEach((tx) => {
      const amt = Number(tx.amount || 0);
      const r = tx.reason.toLowerCase();
      if (r.includes('welcome')) {
        welcomeMap.set(tx.userId, (welcomeMap.get(tx.userId) || 0) + amt);
      } else if (r.includes('referral') || r.includes('joined') || r.includes('plan bonus')) {
        referralMap.set(tx.userId, (referralMap.get(tx.userId) || 0) + amt);
      } else {
        commissionMap.set(tx.userId, (commissionMap.get(tx.userId) || 0) + amt);
      }
    });

    // Users with active balance (>0)
    const activeBalanceUsers = users
      .map((u) => {
        const totalCredit = creditMap.get(u.id) || 0;
        const totalDebit = debitMap.get(u.id) || 0;
        const balance = totalCredit - totalDebit;
        const welcomeEarnings = welcomeMap.get(u.id) || 0;
        const referralEarnings = referralMap.get(u.id) || 0;
        const commissionEarnings = commissionMap.get(u.id) || 0;
        return { ...u, balance, totalCredit, totalDebit, welcomeEarnings, referralEarnings, commissionEarnings };
      })
      .filter((u) => u.balance > 0)
      .sort((a, b) => b.balance - a.balance);

    // Summary calculations
    const totalSystemLiability = activeBalanceUsers.reduce((sum, u) => sum + u.balance, 0);

    let totalPendingWithdrawals = 0;
    let countPendingWithdrawals = 0;
    let totalApprovedWithdrawals = 0;
    let countApprovedWithdrawals = 0;
    let totalRejectedWithdrawals = 0;
    let countRejectedWithdrawals = 0;

    withdrawals.forEach((w) => {
      const amt = Number(w.approvedAmount || w.requestedAmount || 0);
      if (w.status === 'PENDING') {
        totalPendingWithdrawals += Number(w.requestedAmount || 0);
        countPendingWithdrawals++;
      } else if (w.status === 'APPROVED') {
        totalApprovedWithdrawals += amt;
        countApprovedWithdrawals++;
      } else if (w.status === 'REJECTED') {
        totalRejectedWithdrawals += Number(w.requestedAmount || 0);
        countRejectedWithdrawals++;
      }
    });

    const totalManualCredits = manualTxs
      .filter((t) => t.type === WalletTransactionType.CREDIT)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalManualDebits = manualTxs
      .filter((t) => t.type === WalletTransactionType.DEBIT)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalInAppSpending = inAppUseTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalActiveBalanceUsers: activeBalanceUsers.length,
        totalSystemLiability,
        totalWithdrawalsCount: withdrawals.length,
        totalPendingWithdrawals,
        countPendingWithdrawals,
        totalApprovedWithdrawals,
        countApprovedWithdrawals,
        totalRejectedWithdrawals,
        countRejectedWithdrawals,
        totalManualCredits,
        totalManualDebits,
        totalInAppSpending,
      },
      activeBalanceUsers,
      withdrawals,
      manualTransactions: manualTxs,
      inAppUsageTransactions: inAppUseTxs,
    };
  }


  /** Admin/Super Admin manual top-up — adds balance to any user's wallet (cash top-up, goodwill credit, trainer fee, correction). */
  async adminCreditWallet(admin: AuthUser, userId: string, amount: number, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const creditReason = reason?.trim() || `Manual credit by admin (${admin.id})`;
    await this.credit(userId, amount, creditReason);

    // Send automated WhatsApp notification if mobile number is present
    if (user.mobile && this.whatsappBotService) {
      try {
        const formattedAmount = `₹${Number(amount).toLocaleString('en-IN')}`;
        const isTrainerOrStaff = (user.role as string) === 'TECHNICAL_STAFF' || (Array.isArray((user as any).roles) && (user as any).roles.includes('TECHNICAL_STAFF'));
        const title = isTrainerOrStaff ? '🎓 *FarmsKing Technical Staff Payout*' : '💳 *FarmsKing Wallet Credit Notice*';

        const message = `${title}\n\nHello *${user.name || 'User'}*,\nAdmin has credited *${formattedAmount}* to your FarmsKing Wallet.\n\n📌 *Reason / Note*: ${creditReason}\n\nYour updated wallet balance is now ready for withdrawal or in-app usage. Thank you!`;

        await this.whatsappBotService.sendDirectTextMessage(user.mobile, message);
      } catch (err) {
        console.warn('Failed to send WhatsApp credit alert:', err);
      }
    }

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
      const referrer = await this.prisma.user.findUnique({
        where: { id: referrerId },
        select: { id: true, role: true, roles: true },
      });
      const isPartner = referrer?.role === 'BUSINESS_PARTNER' || (Array.isArray(referrer?.roles) && referrer.roles.includes('BUSINESS_PARTNER'));

      const stdPlanBonus = Number((settings as any)?.referralPaidPlanBonusAmount ?? (settings as any)?.referralPlanUpgradeBonusAmount ?? 50);
      const partnerPlanBonus = Number((settings as any)?.partnerReferralPaidPlanBonusAmount ?? 100);
      const activePlanBonus = isPartner ? partnerPlanBonus : stdPlanBonus;

      if (activePlanBonus > 0) {
        await this.credit(
          referrerId,
          activePlanBonus,
          `👑 Referral Paid Plan Bonus (${isPartner ? 'Business Partner Bonus' : 'Referee upgraded plan'}: ${dbUser.name || dbUser.kingId || 'User'})`,
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
    const planUpgradeBonusAmount = Number((settings as any)?.referralPaidPlanBonusAmount ?? (settings as any)?.referralPlanUpgradeBonusAmount ?? 0);

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

  /** Admin/Super Admin: Comprehensive list of all users and their wallet balances, total credits & debits. */
  async getAdminAllWallets(search?: string, role?: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };

    if (role && role !== 'ALL') {
      where.role = role as any;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { mobile: { contains: q } },
        { kingId: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          mobile: true,
          kingId: true,
          role: true,
          roles: true,
          upiId: true,
          bankAccountNumber: true,
          bankIfsc: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const userIds = users.map((u) => u.id);

    const [credits, debits, pendingWithdrawals, creditTxs] = await Promise.all([
      this.prisma.walletTransaction.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds }, type: WalletTransactionType.CREDIT },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds }, type: WalletTransactionType.DEBIT },
        _sum: { amount: true },
      }),
      this.prisma.withdrawalRequest.findMany({
        where: { businessPartnerId: { in: userIds }, status: 'PENDING' },
        select: { businessPartnerId: true, requestedAmount: true, id: true },
      }),
      this.prisma.walletTransaction.findMany({
        where: { userId: { in: userIds }, type: WalletTransactionType.CREDIT },
        select: { userId: true, amount: true, reason: true },
      }),
    ]);

    const creditMap = new Map(credits.map((c) => [c.userId, Number(c._sum.amount ?? 0)]));
    const debitMap = new Map(debits.map((d) => [d.userId, Number(d._sum.amount ?? 0)]));
    const pendingMap = new Map<string, number>();

    pendingWithdrawals.forEach((pw) => {
      const current = pendingMap.get(pw.businessPartnerId) || 0;
      pendingMap.set(pw.businessPartnerId, current + Number(pw.requestedAmount || 0));
    });

    const welcomeMap = new Map<string, number>();
    const referralMap = new Map<string, number>();
    const commissionMap = new Map<string, number>();

    creditTxs.forEach((tx) => {
      const amt = Number(tx.amount || 0);
      const r = tx.reason.toLowerCase();
      if (r.includes('welcome')) {
        welcomeMap.set(tx.userId, (welcomeMap.get(tx.userId) || 0) + amt);
      } else if (r.includes('referral') || r.includes('joined') || r.includes('plan bonus')) {
        referralMap.set(tx.userId, (referralMap.get(tx.userId) || 0) + amt);
      } else {
        commissionMap.set(tx.userId, (commissionMap.get(tx.userId) || 0) + amt);
      }
    });

    const items = users.map((u) => {
      const totalCredit = creditMap.get(u.id) || 0;
      const totalDebit = debitMap.get(u.id) || 0;
      const balance = totalCredit - totalDebit;
      const pendingWithdrawal = pendingMap.get(u.id) || 0;
      const welcomeEarnings = welcomeMap.get(u.id) || 0;
      const referralEarnings = referralMap.get(u.id) || 0;
      const commissionEarnings = commissionMap.get(u.id) || 0;

      return {
        ...u,
        balance,
        totalCredit,
        totalDebit,
        pendingWithdrawal,
        welcomeEarnings,
        referralEarnings,
        commissionEarnings,
      };
    });

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items,
    };
  }
}
