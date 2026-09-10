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
exports.PartiesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const SIGN = {
    SALE_CREDIT: 1,
    SALE_PAYMENT: -1,
    EXPENSE_CREDIT: -1,
    EXPENSE_PAYMENT: 1,
};
let PartiesService = class PartiesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(user, name, address, mobile) {
        return this.prisma.party.create({
            data: { ownerId: user.id, name: name.trim(), address: address.trim(), mobile: mobile?.trim() || null },
        });
    }
    async update(user, partyId, dto) {
        const party = await this.findOwnedOrThrow(user, partyId);
        if (party.isUnified) {
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
    computeBalance(entries) {
        return entries.reduce((sum, e) => sum + SIGN[e.type] * Number(e.amount), 0);
    }
    async listMine(user) {
        const parties = await this.prisma.party.findMany({
            where: { ownerId: user.id, deletedAt: null },
            include: { ledgerEntries: { select: { id: true, type: true, amount: true, saleBillId: true, reason: true } } },
            orderBy: { name: 'asc' },
        });
        const saleBills = await this.prisma.saleBill.findMany({
            where: { farmerId: user.id },
            select: { id: true, billNo: true },
        });
        const validBillIds = new Set(saleBills.map((b) => b.id));
        return parties.map(({ ledgerEntries, ...party }) => {
            const validEntries = ledgerEntries.filter((e) => {
                if (e.saleBillId && !validBillIds.has(e.saleBillId)) {
                    this.prisma.partyLedgerEntry.delete({ where: { id: e.id } }).catch(() => { });
                    return false;
                }
                if (!e.saleBillId && (e.type === client_1.PartyLedgerEntryType.SALE_CREDIT || e.type === client_1.PartyLedgerEntryType.SALE_PAYMENT)) {
                    const matchesAnyBill = saleBills.some((b) => e.reason && e.reason.includes(b.billNo));
                    if (!matchesAnyBill) {
                        this.prisma.partyLedgerEntry.delete({ where: { id: e.id } }).catch(() => { });
                        return false;
                    }
                }
                return true;
            });
            return {
                ...party,
                balance: this.computeBalance(validEntries),
            };
        });
    }
    async findOwnedOrThrow(user, partyId) {
        const party = await this.prisma.party.findFirst({ where: { id: partyId, deletedAt: null } });
        if (party) {
            if (party.ownerId !== user.id) {
                throw new common_1.ForbiddenException('This party does not belong to you.');
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
        throw new common_1.NotFoundException('Party not found.');
    }
    async getStatement(user, partyId) {
        const party = await this.findOwnedOrThrow(user, partyId);
        const partyIds = new Set([partyId, party.id]);
        if (party.kingId) {
            partyIds.add(party.kingId);
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
                if (u.kingId)
                    partyIds.add(u.kingId);
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
        const validEntries = entries.filter((e) => {
            if (e.saleBillId && !e.saleBill) {
                this.prisma.partyLedgerEntry.delete({ where: { id: e.id } }).catch(() => { });
                return false;
            }
            return true;
        });
        const existingBillIds = new Set(validEntries.map((e) => e.saleBillId).filter((id) => Boolean(id)));
        for (const entry of entries) {
            if (!entry.saleBillId && entry.type === client_1.PartyLedgerEntryType.SALE_CREDIT) {
                const match = saleBills.find((b) => {
                    if (entry.reason && entry.reason.includes(b.billNo))
                        return true;
                    const timeDiff = Math.abs(new Date(b.createdAt).getTime() - new Date(entry.createdAt).getTime());
                    return timeDiff < 5 * 60 * 1000 && Number(b.totalAmount) === Number(entry.amount);
                });
                if (match) {
                    entry.saleBillId = match.id;
                    entry.saleBill = { id: match.id, billNo: match.billNo };
                    existingBillIds.add(match.id);
                }
            }
            else if (!entry.saleBillId && entry.type === client_1.PartyLedgerEntryType.SALE_PAYMENT) {
                const match = saleBills.find((b) => {
                    if (entry.reason && entry.reason.includes(b.billNo))
                        return true;
                    const timeDiff = Math.abs(new Date(b.createdAt).getTime() - new Date(entry.createdAt).getTime());
                    return timeDiff < 5 * 60 * 1000 && Number(b.amountReceived) === Number(entry.amount);
                });
                if (match) {
                    entry.saleBillId = match.id;
                    entry.saleBill = { id: match.id, billNo: match.billNo };
                    existingBillIds.add(match.id);
                }
            }
        }
        const extraEntries = [];
        for (const bill of saleBills) {
            if (!existingBillIds.has(bill.id)) {
                extraEntries.push({
                    id: `synth_credit_${bill.id}`,
                    partyId: party.id,
                    type: client_1.PartyLedgerEntryType.SALE_CREDIT,
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
                        type: client_1.PartyLedgerEntryType.SALE_PAYMENT,
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
        const allEntries = [...entries, ...extraEntries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return { party, balance: this.computeBalance(allEntries), entries: allEntries };
    }
    async recordSaleLedger(user, partyId, dto) {
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
        let validSaleBillId = null;
        if (dto.saleBillId) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.saleBillId);
            let bill = null;
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
                where: { saleBillId: validSaleBillId, type: client_1.PartyLedgerEntryType.SALE_CREDIT },
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
                    where: { saleBillId: validSaleBillId, type: client_1.PartyLedgerEntryType.SALE_PAYMENT },
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
                    }
                    else {
                        await this.prisma.partyLedgerEntry.create({
                            data: {
                                partyId: targetPartyId,
                                type: client_1.PartyLedgerEntryType.SALE_PAYMENT,
                                amount: dto.amountReceived,
                                reason: `Amount received against: ${dto.reason}`,
                                saleBillId: validSaleBillId,
                            },
                        });
                    }
                }
                else if (existingPaymentEntry) {
                    await this.prisma.partyLedgerEntry.delete({
                        where: { id: existingPaymentEntry.id },
                    });
                }
                return this.getStatement(user, partyId);
            }
        }
        if (!validSaleBillId) {
            try {
                const farmerObj = await this.prisma.user.findUnique({ where: { id: user.id }, select: { name: true } });
                const billNo = `FK-${Date.now().toString().slice(-6)}`;
                const createdBill = await this.prisma.saleBill.create({
                    data: {
                        farmerId: user.id,
                        billNo,
                        farmerName: farmerObj?.name || 'Farmer',
                        partyId: targetPartyId,
                        partyName: partyObj.name,
                        isCash: false,
                        amountReceivedMode: 'CASH',
                        items: [
                            {
                                cropName: dto.reason || 'Crop Sale',
                                qty: 1,
                                unit: 'item',
                                rate: Number(dto.totalAmount),
                            },
                        ],
                        totalItems: 1,
                        totalAmount: dto.totalAmount,
                        amountReceived: dto.amountReceived || 0,
                        thisSaleBalance: Math.max(0, Number(dto.totalAmount) - (Number(dto.amountReceived) || 0)),
                        previousBalance: 0,
                        netReceivable: dto.totalAmount,
                    },
                });
                validSaleBillId = createdBill.id;
            }
            catch (err) {
                console.warn('Could not auto-create SaleBill in recordSaleLedger:', err);
            }
        }
        await this.prisma.partyLedgerEntry.create({
            data: {
                partyId: targetPartyId,
                type: client_1.PartyLedgerEntryType.SALE_CREDIT,
                amount: dto.totalAmount,
                reason: dto.reason,
                saleBillId: validSaleBillId,
            },
        });
        if (dto.amountReceived && dto.amountReceived > 0) {
            await this.prisma.partyLedgerEntry.create({
                data: {
                    partyId: targetPartyId,
                    type: client_1.PartyLedgerEntryType.SALE_PAYMENT,
                    amount: dto.amountReceived,
                    reason: `Amount received against: ${dto.reason}`,
                    saleBillId: validSaleBillId,
                },
            });
        }
        return this.getStatement(user, partyId);
    }
    async nextReceiptNo(isReceived) {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = isReceived ? `R${yy}${mm}` : `Pay${yy}${mm}`;
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const countThisMonth = await this.prisma.paymentReceipt.count({
            where: {
                isReceived,
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
        });
        let nextSeq = countThisMonth + 1;
        let paddedSeq = String(nextSeq).padStart(2, '0');
        let candidate = `${prefix}${paddedSeq}`;
        let exists = await this.prisma.paymentReceipt.findFirst({ where: { receiptNo: candidate } });
        while (exists) {
            nextSeq++;
            paddedSeq = String(nextSeq).padStart(2, '0');
            candidate = `${prefix}${paddedSeq}`;
            exists = await this.prisma.paymentReceipt.findFirst({ where: { receiptNo: candidate } });
        }
        return candidate;
    }
    async recordPaymentReceived(user, partyId, dto) {
        const before = await this.getStatement(user, partyId);
        const entry = await this.prisma.partyLedgerEntry.create({
            data: {
                partyId,
                type: client_1.PartyLedgerEntryType.SALE_PAYMENT,
                amount: dto.amount,
                reason: dto.reason?.trim() || 'Payment received',
            },
        });
        const afterBeforeLink = await this.getStatement(user, partyId);
        const receipt = await this.prisma.paymentReceipt.create({
            data: {
                farmerId: user.id,
                receiptNo: await this.nextReceiptNo(true),
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
    async recordPaymentMade(user, partyId, dto) {
        const before = await this.getStatement(user, partyId);
        const entry = await this.prisma.partyLedgerEntry.create({
            data: {
                partyId,
                type: client_1.PartyLedgerEntryType.EXPENSE_PAYMENT,
                amount: dto.amount,
                reason: dto.reason?.trim() || 'Payment made',
            },
        });
        const afterBeforeLink = await this.getStatement(user, partyId);
        const receipt = await this.prisma.paymentReceipt.create({
            data: {
                farmerId: user.id,
                receiptNo: await this.nextReceiptNo(false),
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
    async recordExpenseCredit(partyId, expenseId, amount, reason) {
        await this.prisma.partyLedgerEntry.create({
            data: { partyId, type: client_1.PartyLedgerEntryType.EXPENSE_CREDIT, amount, reason, expenseId },
        });
    }
    async generateKingId() {
        let kingId = `FK-${Math.floor(100000 + Math.random() * 900000)}`;
        while (await this.prisma.unifiedParty.findUnique({ where: { kingId } })) {
            kingId = `FK-${Math.floor(100000 + Math.random() * 900000)}`;
        }
        return kingId;
    }
    async createUnifiedParty(user, dto) {
        const kingId = await this.generateKingId();
        return this.prisma.unifiedParty.create({
            data: {
                kingId,
                ownerFarmerId: user.id,
                name: dto.name.trim(),
                type: dto.type ?? client_1.PartyType.INDIVIDUAL,
                roles: dto.roles && dto.roles.length > 0 ? dto.roles : [client_1.PartyRole.CUSTOMER],
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
    async listUnifiedParties(user, role) {
        const where = { ownerFarmerId: user.id, deletedAt: null };
        if (role) {
            where.roles = { has: role };
        }
        return this.prisma.unifiedParty.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }
    async recordArhtiyaAdvance(user, dto) {
        const party = await this.prisma.unifiedParty.findFirst({
            where: { id: dto.partyId, ownerFarmerId: user.id, deletedAt: null },
        });
        if (!party)
            throw new common_1.NotFoundException('Arhtiya / Party not found.');
        return this.prisma.arhtiyaTransaction.create({
            data: {
                farmerId: user.id,
                partyId: dto.partyId,
                type: client_1.ArhtiyaTransactionType.ADVANCE_TAKEN,
                amount: dto.amount,
                interestRateMonthly: dto.interestRateMonthly ?? null,
                transactionDate: new Date(dto.transactionDate),
                notes: dto.notes?.trim() || null,
            },
        });
    }
    convertToQuintals(quantity, unit = client_1.MandiUnit.QUINTAL) {
        switch (unit) {
            case client_1.MandiUnit.BAG_50KG:
                return (quantity * 50) / 100;
            case client_1.MandiUnit.BAG_35KG:
                return (quantity * 35) / 100;
            case client_1.MandiUnit.MANN:
                return (quantity * 40) / 100;
            case client_1.MandiUnit.KG:
                return quantity / 100;
            case client_1.MandiUnit.QUINTAL:
            default:
                return quantity;
        }
    }
    async recordArhtiyaCropSale(user, dto) {
        const party = await this.prisma.unifiedParty.findFirst({
            where: { id: dto.partyId, ownerFarmerId: user.id, deletedAt: null },
        });
        if (!party)
            throw new common_1.NotFoundException('Arhtiya / Party not found.');
        const unit = dto.inputUnit ?? client_1.MandiUnit.QUINTAL;
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
                type: client_1.ArhtiyaTransactionType.CROP_SALE_CREDIT,
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
    async getArhtiyaLedgerHisab(user, partyId) {
        const party = await this.prisma.unifiedParty.findFirst({
            where: { id: partyId, ownerFarmerId: user.id, deletedAt: null },
        });
        if (!party)
            throw new common_1.NotFoundException('Arhtiya / Party not found.');
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
            if (tx.type === client_1.ArhtiyaTransactionType.ADVANCE_TAKEN && tx.interestRateMonthly) {
                const startDate = new Date(tx.transactionDate);
                const diffMs = now.getTime() - startDate.getTime();
                daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
                const monthlyRate = Number(tx.interestRateMonthly);
                const principal = Number(tx.amount);
                accruedInterest = Math.round(principal * (monthlyRate / 100) * (daysElapsed / 30) * 100) / 100;
                totalInterestAccrued += accruedInterest;
                totalAdvances += principal;
            }
            else if (tx.type === client_1.ArhtiyaTransactionType.ADVANCE_TAKEN) {
                totalAdvances += Number(tx.amount);
            }
            else if (tx.type === client_1.ArhtiyaTransactionType.CROP_SALE_CREDIT) {
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
};
exports.PartiesService = PartiesService;
exports.PartiesService = PartiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PartiesService);
//# sourceMappingURL=parties.service.js.map