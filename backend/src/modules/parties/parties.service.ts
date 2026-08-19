import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PartyLedgerEntryType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { RecordSaleLedgerDto } from './dto/record-sale-ledger.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

/** Sign each ledger entry type contributes to a party's balance: + = party owes the farmer, - = farmer owes the party. */
const SIGN: Record<PartyLedgerEntryType, 1 | -1> = {
  SALE_CREDIT: 1,
  SALE_PAYMENT: -1,
  EXPENSE_CREDIT: -1,
  EXPENSE_PAYMENT: 1,
};

@Injectable()
export class PartiesService {
  constructor(private readonly prisma: PrismaService) {}

  create(user: AuthUser, name: string, address: string, mobile?: string) {
    return this.prisma.party.create({
      data: { ownerId: user.id, name: name.trim(), address: address.trim(), mobile: mobile?.trim() || null },
    });
  }

  private computeBalance(entries: { type: PartyLedgerEntryType; amount: unknown }[]): number {
    return entries.reduce((sum, e) => sum + SIGN[e.type] * Number(e.amount), 0);
  }

  async listMine(user: AuthUser) {
    const parties = await this.prisma.party.findMany({
      where: { ownerId: user.id, deletedAt: null },
      include: { ledgerEntries: { select: { type: true, amount: true } } },
      orderBy: { name: 'asc' },
    });

    return parties.map(({ ledgerEntries, ...party }) => ({
      ...party,
      balance: this.computeBalance(ledgerEntries),
    }));
  }

  private async findOwnedOrThrow(user: AuthUser, partyId: string) {
    const party = await this.prisma.party.findFirst({ where: { id: partyId, deletedAt: null } });
    if (!party) {
      throw new NotFoundException('Party not found.');
    }
    if (party.ownerId !== user.id) {
      throw new ForbiddenException('This party does not belong to you.');
    }
    return party;
  }

  async getStatement(user: AuthUser, partyId: string) {
    const party = await this.findOwnedOrThrow(user, partyId);
    const entries = await this.prisma.partyLedgerEntry.findMany({
      where: { partyId },
      orderBy: { createdAt: 'desc' },
    });
    return { party, balance: this.computeBalance(entries), entries };
  }

  async recordSaleLedger(user: AuthUser, partyId: string, dto: RecordSaleLedgerDto) {
    await this.findOwnedOrThrow(user, partyId);

    await this.prisma.partyLedgerEntry.create({
      data: {
        partyId,
        type: PartyLedgerEntryType.SALE_CREDIT,
        amount: dto.totalAmount,
        reason: dto.reason,
        saleBillId: dto.saleBillId,
      },
    });

    if (dto.amountReceived && dto.amountReceived > 0) {
      await this.prisma.partyLedgerEntry.create({
        data: {
          partyId,
          type: PartyLedgerEntryType.SALE_PAYMENT,
          amount: dto.amountReceived,
          reason: `Amount received against: ${dto.reason}`,
        },
      });
    }

    return this.getStatement(user, partyId);
  }

  private nextReceiptNo(): string {
    return `RCT-${Date.now().toString().slice(-8)}`;
  }

  /** Farmer records a payment RECEIVED from a party — reduces what that party owes (receivable). */
  async recordPaymentReceived(user: AuthUser, partyId: string, dto: RecordPaymentDto) {
    const before = await this.getStatement(user, partyId);
    const entry = await this.prisma.partyLedgerEntry.create({
      data: {
        partyId,
        type: PartyLedgerEntryType.SALE_PAYMENT,
        amount: dto.amount,
        reason: dto.reason?.trim() || 'Payment received',
      },
    });
    const afterBeforeLink = await this.getStatement(user, partyId);
    const receipt = await this.prisma.paymentReceipt.create({
      data: {
        farmerId: user.id,
        receiptNo: this.nextReceiptNo(),
        partyId,
        partyName: before.party.name,
        isReceived: true,
        previousBalance: before.balance,
        paymentAmount: dto.amount,
        netBalance: afterBeforeLink.balance,
      },
    });
    await this.prisma.partyLedgerEntry.update({ where: { id: entry.id }, data: { paymentReceiptId: receipt.id } });
    const after = await this.getStatement(user, partyId);
    return { ...after, receiptNo: receipt.receiptNo };
  }

  /** Farmer records a payment MADE to a party — reduces what the farmer owes them (payable). */
  async recordPaymentMade(user: AuthUser, partyId: string, dto: RecordPaymentDto) {
    const before = await this.getStatement(user, partyId);
    const entry = await this.prisma.partyLedgerEntry.create({
      data: {
        partyId,
        type: PartyLedgerEntryType.EXPENSE_PAYMENT,
        amount: dto.amount,
        reason: dto.reason?.trim() || 'Payment made',
      },
    });
    const afterBeforeLink = await this.getStatement(user, partyId);
    const receipt = await this.prisma.paymentReceipt.create({
      data: {
        farmerId: user.id,
        receiptNo: this.nextReceiptNo(),
        partyId,
        partyName: before.party.name,
        isReceived: false,
        previousBalance: before.balance,
        paymentAmount: dto.amount,
        netBalance: afterBeforeLink.balance,
      },
    });
    await this.prisma.partyLedgerEntry.update({ where: { id: entry.id }, data: { paymentReceiptId: receipt.id } });
    const after = await this.getStatement(user, partyId);
    return { ...after, receiptNo: receipt.receiptNo };
  }

  /** Internal helper — called by ExpensesService when a CREDIT-mode expense is saved against a party. */
  async recordExpenseCredit(partyId: string, expenseId: string, amount: number, reason: string) {
    await this.prisma.partyLedgerEntry.create({
      data: { partyId, type: PartyLedgerEntryType.EXPENSE_CREDIT, amount, reason, expenseId },
    });
  }
}
