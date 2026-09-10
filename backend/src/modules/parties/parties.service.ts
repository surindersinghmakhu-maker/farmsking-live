import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ArhtiyaTransactionType, MandiUnit, PartyLedgerEntryType, PartyRole, PartyType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { RecordSaleLedgerDto } from './dto/record-sale-ledger.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { CreateUnifiedPartyDto } from './dto/create-unified-party.dto';
import { RecordArhtiyaAdvanceDto } from './dto/record-arhtiya-advance.dto';
import { RecordArhtiyaCropSaleDto } from './dto/record-arhtiya-crop-sale.dto';


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

  async update(user: AuthUser, partyId: string, dto: { name?: string; address?: string; mobile?: string }) {
    const party = await this.findOwnedOrThrow(user, partyId);
    if ((party as any).isUnified) {
      return this.prisma.unifiedParty.update({
        where: { id: party.id },
        data: {
          ...(dto.name && { name: dto.name.trim() }),
          ...(dto.address !== undefined && { address: dto.address.trim() }),
          ...(dto.mobile !== undefined && { mobile: dto.mobile.trim() || null }),
        },
      });
    }
    return this.prisma.party.update({
      where: { id: party.id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.address !== undefined && { address: dto.address.trim() }),
        ...(dto.mobile !== undefined && { mobile: dto.mobile.trim() || null }),
      },
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
    if (party) {
      if (party.ownerId !== user.id) {
        throw new ForbiddenException('This party does not belong to you.');
      }
      return { ...party, isUnified: false };
    }

    const unified = await this.prisma.unifiedParty.findFirst({
      where: {
        OR: [{ id: partyId }, { kingId: partyId }],
        ownerFarmerId: user.id,
        deletedAt: null,
      },
    });

    if (unified) {
      return {
        id: unified.id,
        ownerId: unified.ownerFarmerId,
        name: unified.name,
        address: unified.address || '',
        mobile: unified.mobile || null,
        createdAt: unified.createdAt,
        kingId: unified.kingId,
        isUnified: true,
      };
    }

    throw new NotFoundException('Party not found.');
  }

  async getStatement(user: AuthUser, partyId: string) {
    const party = await this.findOwnedOrThrow(user, partyId);

    const partyIds = new Set<string>([partyId, party.id]);
    if ((party as any).kingId) {
      partyIds.add((party as any).kingId);
    }

    if (party.mobile) {
      const matchParties = await this.prisma.party.findMany({
        where: { ownerId: user.id, mobile: party.mobile, deletedAt: null },
        select: { id: true },
      });
      matchParties.forEach((p) => partyIds.add(p.id));

      const matchUnified = await this.prisma.unifiedParty.findMany({
        where: { ownerFarmerId: user.id, mobile: party.mobile, deletedAt: null },
        select: { id: true, kingId: true },
      });
      matchUnified.forEach((u) => {
        partyIds.add(u.id);
        if (u.kingId) partyIds.add(u.kingId);
      });
    }

    const entries = await this.prisma.partyLedgerEntry.findMany({
      where: {
        partyId: { in: Array.from(partyIds) },
      },
      include: {
        saleBill: {
          select: {
            id: true,
            billNo: true,
          },
        },
        paymentReceipt: {
          select: {
            id: true,
            receiptNo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const existingBillIds = new Set(
      entries.map((e) => e.saleBillId).filter((id): id is string => Boolean(id))
    );

    const saleBills = await this.prisma.saleBill.findMany({
      where: {
        farmerId: user.id,
        OR: [
          { partyId: { in: Array.from(partyIds) } },
          { partyName: { equals: party.name, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const extraEntries: any[] = [];
    for (const bill of saleBills) {
      if (!existingBillIds.has(bill.id)) {
        extraEntries.push({
          id: `synth_credit_${bill.id}`,
          partyId: party.id,
          type: PartyLedgerEntryType.SALE_CREDIT,
          amount: bill.totalAmount,
          reason: `Sale Bill #${bill.billNo}`,
          saleBillId: bill.id,
          saleBill: {
            id: bill.id,
            billNo: bill.billNo,
          },
          createdAt: bill.createdAt,
        });

        if (Number(bill.amountReceived) > 0) {
          extraEntries.push({
            id: `synth_pay_${bill.id}`,
            partyId: party.id,
            type: PartyLedgerEntryType.SALE_PAYMENT,
            amount: bill.amountReceived,
            reason: `Amount received against: Sale Bill #${bill.billNo}`,
            saleBillId: bill.id,
            saleBill: {
              id: bill.id,
              billNo: bill.billNo,
            },
            createdAt: bill.createdAt,
          });
        }
      }
    }

    const allEntries = [...entries, ...extraEntries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { party, balance: this.computeBalance(allEntries), entries: allEntries };
  }

  async recordSaleLedger(user: AuthUser, partyId: string, dto: RecordSaleLedgerDto) {
    const partyObj = await this.findOwnedOrThrow(user, partyId);

    let targetPartyId = partyObj.id;
    const dbParty = await this.prisma.party.findFirst({ where: { id: partyObj.id, ownerId: user.id, deletedAt: null } });
    if (!dbParty) {
      let existingParty = await this.prisma.party.findFirst({
        where: { ownerId: user.id, name: partyObj.name, deletedAt: null },
      });
      if (!existingParty) {
        existingParty = await this.prisma.party.create({
          data: { ownerId: user.id, name: partyObj.name, mobile: partyObj.mobile, address: partyObj.address },
        });
      }
      targetPartyId = existingParty.id;
    }

    let validSaleBillId: string | null = null;
    if (dto.saleBillId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.saleBillId);
      let bill: any = null;
      if (isUuid) {
        bill = await this.prisma.saleBill.findUnique({ where: { id: dto.saleBillId } }).catch(() => null);
      }
      if (!bill) {
        bill = await this.prisma.saleBill.findFirst({ where: { farmerId: user.id, billNo: dto.saleBillId } }).catch(() => null);
      }
      if (bill) {
        validSaleBillId = bill.id;
      }
    }

    if (validSaleBillId) {
      const existingCreditEntry = await this.prisma.partyLedgerEntry.findFirst({
        where: { saleBillId: validSaleBillId, type: PartyLedgerEntryType.SALE_CREDIT },
      });

      if (existingCreditEntry) {
        await this.prisma.partyLedgerEntry.update({
          where: { id: existingCreditEntry.id },
          data: {
            partyId: targetPartyId,
            amount: dto.totalAmount,
            reason: dto.reason,
          },
        });

        const existingPaymentEntry = await this.prisma.partyLedgerEntry.findFirst({
          where: { saleBillId: validSaleBillId, type: PartyLedgerEntryType.SALE_PAYMENT },
        });

        if (dto.amountReceived && dto.amountReceived > 0) {
          if (existingPaymentEntry) {
            await this.prisma.partyLedgerEntry.update({
              where: { id: existingPaymentEntry.id },
              data: {
                partyId: targetPartyId,
                amount: dto.amountReceived,
                reason: `Amount received against: ${dto.reason}`,
              },
            });
          } else {
            await this.prisma.partyLedgerEntry.create({
              data: {
                partyId: targetPartyId,
                type: PartyLedgerEntryType.SALE_PAYMENT,
                amount: dto.amountReceived,
                reason: `Amount received against: ${dto.reason}`,
                saleBillId: validSaleBillId,
              },
            });
          }
        } else if (existingPaymentEntry) {
          await this.prisma.partyLedgerEntry.delete({
            where: { id: existingPaymentEntry.id },
          });
        }

        return this.getStatement(user, partyId);
      }
    }

    await this.prisma.partyLedgerEntry.create({
      data: {
        partyId: targetPartyId,
        type: PartyLedgerEntryType.SALE_CREDIT,
        amount: dto.totalAmount,
        reason: dto.reason,
        saleBillId: validSaleBillId,
      },
    });

    if (dto.amountReceived && dto.amountReceived > 0) {
      await this.prisma.partyLedgerEntry.create({
        data: {
          partyId: targetPartyId,
          type: PartyLedgerEntryType.SALE_PAYMENT,
          amount: dto.amountReceived,
          reason: `Amount received against: ${dto.reason}`,
          saleBillId: validSaleBillId,
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

  // ─── Unified Party System & King ID ───────────────────────────────────────

  private async generateKingId(): Promise<string> {
    let kingId = `FK-${Math.floor(100000 + Math.random() * 900000)}`;
    while (await this.prisma.unifiedParty.findUnique({ where: { kingId } })) {
      kingId = `FK-${Math.floor(100000 + Math.random() * 900000)}`;
    }
    return kingId;
  }

  async createUnifiedParty(user: AuthUser, dto: CreateUnifiedPartyDto) {
    const kingId = await this.generateKingId();
    return this.prisma.unifiedParty.create({
      data: {
        kingId,
        ownerFarmerId: user.id,
        name: dto.name.trim(),
        type: dto.type ?? PartyType.INDIVIDUAL,
        roles: dto.roles && dto.roles.length > 0 ? dto.roles : [PartyRole.CUSTOMER],
        mandiName: dto.mandiName?.trim() || null,
        shopNumber: dto.shopNumber?.trim() || null,
        mobile: dto.mobile?.trim() || null,
        address: dto.address?.trim() || null,
        village: dto.village?.trim() || null,
        district: dto.district?.trim() || null,
        state: dto.state?.trim() || null,
      },
    });
  }

  async listUnifiedParties(user: AuthUser, role?: PartyRole) {
    const where: any = { ownerFarmerId: user.id, deletedAt: null };
    if (role) {
      where.roles = { has: role };
    }
    return this.prisma.unifiedParty.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  // ─── Arhtiya Management Module ───────────────────────────────────────────

  async recordArhtiyaAdvance(user: AuthUser, dto: RecordArhtiyaAdvanceDto) {
    const party = await this.prisma.unifiedParty.findFirst({
      where: { id: dto.partyId, ownerFarmerId: user.id, deletedAt: null },
    });
    if (!party) throw new NotFoundException('Arhtiya / Party not found.');

    return this.prisma.arhtiyaTransaction.create({
      data: {
        farmerId: user.id,
        partyId: dto.partyId,
        type: ArhtiyaTransactionType.ADVANCE_TAKEN,
        amount: dto.amount,
        interestRateMonthly: dto.interestRateMonthly ?? null,
        transactionDate: new Date(dto.transactionDate),
        notes: dto.notes?.trim() || null,
      },
    });
  }

  /** Convert input unit to Quintals */
  private convertToQuintals(quantity: number, unit: MandiUnit = MandiUnit.QUINTAL): number {
    switch (unit) {
      case MandiUnit.BAG_50KG:
        return (quantity * 50) / 100;
      case MandiUnit.BAG_35KG:
        return (quantity * 35) / 100;
      case MandiUnit.MANN:
        return (quantity * 40) / 100;
      case MandiUnit.KG:
        return quantity / 100;
      case MandiUnit.QUINTAL:
      default:
        return quantity;
    }
  }

  async recordArhtiyaCropSale(user: AuthUser, dto: RecordArhtiyaCropSaleDto) {
    const party = await this.prisma.unifiedParty.findFirst({
      where: { id: dto.partyId, ownerFarmerId: user.id, deletedAt: null },
    });
    if (!party) throw new NotFoundException('Arhtiya / Party not found.');

    const unit = dto.inputUnit ?? MandiUnit.QUINTAL;
    const quantityQuintals = this.convertToQuintals(dto.inputQuantity, unit);
    const grossAmount = Math.round(quantityQuintals * dto.ratePerQuintal * 100) / 100;

    const commissionPercent = dto.commissionPercent ?? 0;
    const commissionAmount = Math.round(((grossAmount * commissionPercent) / 100) * 100) / 100;
    const otherCharges = dto.otherCharges ?? 0;
    const netAmount = Math.max(0, Math.round((grossAmount - commissionAmount - otherCharges) * 100) / 100);

    return this.prisma.arhtiyaTransaction.create({
      data: {
        farmerId: user.id,
        partyId: dto.partyId,
        type: ArhtiyaTransactionType.CROP_SALE_CREDIT,
        amount: netAmount,
        transactionDate: new Date(dto.transactionDate),
        cropCycleId: dto.cropCycleId || null,
        cropName: dto.cropName.trim(),
        inputUnit: unit,
        inputQuantity: dto.inputQuantity,
        quantityQuintals,
        ratePerQuintal: dto.ratePerQuintal,
        grossAmount,
        commissionPercent,
        commissionAmount,
        otherCharges,
        netAmount,
        jFormNumber: dto.jFormNumber?.trim() || null,
        jFormDate: dto.jFormDate ? new Date(dto.jFormDate) : null,
        jFormPhotoUrl: dto.jFormPhotoUrl?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
    });
  }

  /** Calculate net settlement, auto interest, and transaction ledger for an Arhtiya */
  async getArhtiyaLedgerHisab(user: AuthUser, partyId: string) {
    const party = await this.prisma.unifiedParty.findFirst({
      where: { id: partyId, ownerFarmerId: user.id, deletedAt: null },
    });
    if (!party) throw new NotFoundException('Arhtiya / Party not found.');

    const transactions = await this.prisma.arhtiyaTransaction.findMany({
      where: { partyId, farmerId: user.id },
      orderBy: { transactionDate: 'asc' },
    });

    const now = new Date();
    let totalAdvances = 0;
    let totalInterestAccrued = 0;
    let totalCropSalesNet = 0;

    const processedTransactions = transactions.map((tx) => {
      let accruedInterest = 0;
      let daysElapsed = 0;

      if (tx.type === ArhtiyaTransactionType.ADVANCE_TAKEN && tx.interestRateMonthly) {
        const startDate = new Date(tx.transactionDate);
        const diffMs = now.getTime() - startDate.getTime();
        daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        const monthlyRate = Number(tx.interestRateMonthly);
        const principal = Number(tx.amount);
        accruedInterest = Math.round(principal * (monthlyRate / 100) * (daysElapsed / 30) * 100) / 100;
        totalInterestAccrued += accruedInterest;
        totalAdvances += principal;
      } else if (tx.type === ArhtiyaTransactionType.ADVANCE_TAKEN) {
        totalAdvances += Number(tx.amount);
      } else if (tx.type === ArhtiyaTransactionType.CROP_SALE_CREDIT) {
        totalCropSalesNet += Number(tx.netAmount || tx.amount);
      }

      return {
        ...tx,
        accruedInterest,
        daysElapsed,
      };
    });

    const totalDebt = totalAdvances + totalInterestAccrued;
    const netBalance = Math.round((totalCropSalesNet - totalDebt) * 100) / 100;

    return {
      party,
      totalAdvances: Math.round(totalAdvances * 100) / 100,
      totalInterestAccrued: Math.round(totalInterestAccrued * 100) / 100,
      totalDebt: Math.round(totalDebt * 100) / 100,
      totalCropSalesNet: Math.round(totalCropSalesNet * 100) / 100,
      netBalance,
      status: netBalance >= 0 ? 'RECEIVABLE_FROM_ARHTIYA' : 'OWED_TO_ARHTIYA',
      transactions: processedTransactions,
    };
  }
}

