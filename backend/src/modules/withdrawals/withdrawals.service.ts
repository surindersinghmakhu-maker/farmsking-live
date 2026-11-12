import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, WithdrawalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ApproveWithdrawalDto } from './dto/approve-withdrawal.dto';
import { hasActiveRole } from '../../common/utils/auth-user.util';
import {
  ADVISOR_PROFILE_FIELDS,
  BUSINESS_PARTNER_PROFILE_FIELDS,
  getAdvisorPayoutProfileStatus,
  getPartnerProfileStatus,
} from '../../common/utils/partner-profile.util';

@Injectable()
export class WithdrawalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly appSettingsService: AppSettingsService,
  ) {}

  /** Calculate platform fee + GST on a withdrawal amount */
  private async calcWithdrawalCharges(amount: number) {
    const s = await this.appSettingsService.get();
    const taxEnabled = (s as any).walletTaxEnabled ?? true;
    if (!taxEnabled) {
      return { platformFee: 0, gstAmount: 0, netPayable: amount };
    }
    const feeRate = ((s as any).withdrawalPlatformFeePercent ?? 2.0) / 100;
    const gstRate = ((s as any).withdrawalGstPercent ?? 18.0) / 100;
    const platformFee = parseFloat((amount * feeRate).toFixed(2));
    const gstAmount = parseFloat((platformFee * gstRate).toFixed(2));
    const netPayable = parseFloat((amount - platformFee - gstAmount).toFixed(2));
    return { platformFee, gstAmount, netPayable };
  }

  /** Blocks withdrawal until the caller's payout profile is complete. */
  private async assertPayoutProfileComplete(user: AuthUser) {
    const isAdvisor = hasActiveRole(user, Role.ADVISOR);
    const isPartner = hasActiveRole(user, Role.AGENT);

    if (isAdvisor || isPartner) {
      const fields = isAdvisor ? ADVISOR_PROFILE_FIELDS : BUSINESS_PARTNER_PROFILE_FIELDS;
      const record = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: Object.fromEntries(fields.map((f) => [f, true])) as Record<(typeof fields)[number], true>,
      });
      if (!record) {
        throw new NotFoundException('User not found.');
      }
      const status = isAdvisor ? getAdvisorPayoutProfileStatus(record) : getPartnerProfileStatus(record);
      if (!status.profileComplete) {
        throw new BadRequestException(
          `Complete your profile before withdrawing — missing: ${status.missingFields.join(', ')}.`,
        );
      }
    } else {
      // For Admins and Employees (Manager, Operator, Supervisor, Labour, Trainer)
      const record = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { upiId: true, bankAccountNumber: true, bankIfsc: true },
      });
      if (!record || (!record.upiId && (!record.bankAccountNumber || !record.bankIfsc))) {
        throw new BadRequestException(
          'Please configure your UPI ID or Bank Account details in your profile before requesting a withdrawal.',
        );
      }
    }
  }

  async create(user: AuthUser, dto: CreateWithdrawalDto) {
    throw new ForbiddenException(
      'Wallet balance withdrawals are strictly disabled across the platform. Wallet balance can be utilized directly for platform services, crop care plans, and purchases.',
    );
  }

    listMine(user: AuthUser) {
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

  private async findOneOrThrow(id: string) {
    const request = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException('Withdrawal request not found.');
    }
    return request;
  }

  /** Admin approves — may edit the payout amount — which debits the partner's wallet atomically. */
  async approve(admin: AuthUser, id: string, dto: ApproveWithdrawalDto) {
    const request = await this.findOneOrThrow(id);
    if (request.status !== WithdrawalStatus.PENDING) {
      throw new ConflictException('This withdrawal request has already been processed.');
    }

    const approvedAmount = dto.approvedAmount ?? Number(request.requestedAmount);
    const { platformFee, gstAmount, netPayable } = await this.calcWithdrawalCharges(approvedAmount);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT "id" FROM "users" WHERE "id" = ${request.businessPartnerId} FOR UPDATE`;

      const [credits, debits] = await Promise.all([
        tx.walletTransaction.aggregate({
          where: { userId: request.businessPartnerId, type: 'CREDIT' },
          _sum: { amount: true },
        }),
        tx.walletTransaction.aggregate({
          where: { userId: request.businessPartnerId, type: 'DEBIT' },
          _sum: { amount: true },
        }),
      ]);
      const balance = Number(credits._sum.amount ?? 0) - Number(debits._sum.amount ?? 0);
      if (approvedAmount > balance) {
        throw new BadRequestException(`Approved amount exceeds the partner's wallet balance of ₹${balance.toFixed(2)}.`);
      }

      const claimed = await tx.withdrawalRequest.updateMany({
        where: { id, status: WithdrawalStatus.PENDING },
        data: {
          status: WithdrawalStatus.APPROVED,
          approvedAmount,
          platformFeeAmount: platformFee,
          gstAmount: gstAmount,
          netPayableAmount: netPayable,
          processedAt: new Date(),
          processedById: admin.id,
          notes: dto.notes,
        },
      });
      if (claimed.count === 0) {
        throw new ConflictException('This withdrawal request has already been processed.');
      }

      await tx.walletTransaction.create({
        data: {
          userId: request.businessPartnerId,
          type: 'DEBIT',
          amount: approvedAmount,
          reason: `Withdrawal payout approved (Platform fee: ₹${platformFee} + GST: ₹${gstAmount} | Net: ₹${netPayable})`,
          withdrawalRequestId: id,
        },
      });

      return tx.withdrawalRequest.findUniqueOrThrow({ where: { id } });
    });

    return { ...updated, platformFeeAmount: platformFee, gstAmount, netPayableAmount: netPayable };
  }

  async reject(admin: AuthUser, id: string, notes?: string) {
    const request = await this.findOneOrThrow(id);
    if (request.status !== WithdrawalStatus.PENDING) {
      throw new ConflictException('This withdrawal request has already been processed.');
    }

    return this.prisma.withdrawalRequest.update({
      where: { id },
      data: { status: WithdrawalStatus.REJECTED, processedAt: new Date(), processedById: admin.id, notes },
    });
  }
}
