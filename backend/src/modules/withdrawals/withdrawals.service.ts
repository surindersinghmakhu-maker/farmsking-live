import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, WithdrawalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ApproveWithdrawalDto } from './dto/approve-withdrawal.dto';
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
  ) {}

  /** Blocks withdrawal until the caller's payout profile (UPI/bank/PAN/alt mobile/email — plus display fields for Advisors) is complete. */
  private async assertPayoutProfileComplete(user: AuthUser) {
    const isAdvisor = user.role === Role.ADVISOR;
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
  }

  async create(user: AuthUser, dto: CreateWithdrawalDto) {
    await this.assertPayoutProfileComplete(user);

    const balance = await this.walletService.getBalance(user.id);
    if (dto.requestedAmount > balance) {
      throw new BadRequestException(`Requested amount exceeds your wallet balance of ₹${balance.toFixed(2)}.`);
    }

    return this.prisma.withdrawalRequest.create({
      data: { businessPartnerId: user.id, requestedAmount: dto.requestedAmount },
    });
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

  /** Admin approves — may edit the payout amount — which debits the partner's wallet by that amount. */
  async approve(admin: AuthUser, id: string, dto: ApproveWithdrawalDto) {
    const request = await this.findOneOrThrow(id);
    if (request.status !== WithdrawalStatus.PENDING) {
      throw new ConflictException('This withdrawal request has already been processed.');
    }

    const approvedAmount = dto.approvedAmount ?? Number(request.requestedAmount);
    const balance = await this.walletService.getBalance(request.businessPartnerId);
    if (approvedAmount > balance) {
      throw new BadRequestException(`Approved amount exceeds the partner's wallet balance of ₹${balance.toFixed(2)}.`);
    }

    const updated = await this.prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: WithdrawalStatus.APPROVED,
        approvedAmount,
        processedAt: new Date(),
        processedById: admin.id,
        notes: dto.notes,
      },
    });

    await this.walletService.debit(
      request.businessPartnerId,
      approvedAmount,
      `Withdrawal payout approved`,
      { withdrawalRequestId: id },
    );

    return updated;
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
