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
const chat_gateway_1 = require("../chat/chat.gateway");
const effective_farmer_util_1 = require("../../common/utils/effective-farmer.util");
const SIGN = {
    SALE_CREDIT: 1,
    SALE_PAYMENT: -1,
    EXPENSE_CREDIT: -1,
    EXPENSE_PAYMENT: 1,
};
let PartiesService = class PartiesService {
    constructor(prisma, chatGateway) {
        this.prisma = prisma;
        this.chatGateway = chatGateway;
    }
    getFarmerId(user) {
        return (0, effective_farmer_util_1.getEffectiveFarmerId)(user);
    }
    create(user, name, address, mobile) {
        return this.prisma.party.create({
            data: { ownerId: this.getFarmerId(user), name: name.trim(), address: address.trim(), mobile: mobile?.trim() || null },
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
            where: { ownerId: this.getFarmerId(user), deletedAt: null },
            include: { ledgerEntries: { select: { id: true, type: true, amount: true, saleBillId: true, reason: true } } },
            orderBy: { name: 'asc' },
        });
        return parties.map(({ ledgerEntries, ...party }) => {
            return {
                ...party,
                balance: this.computeBalance(ledgerEntries),
            };
        });
    }
    async findOwnedOrThrow(user, partyId) {
        const ownerId = this.getFarmerId(user);
        const party = await this.prisma.party.findFirst({ where: { id: partyId, deletedAt: null } });
        if (party) {
            if (party.ownerId !== ownerId) {
                throw new common_1.ForbiddenException('This party does not belong to you.');
            }
            return { ...party, isUnified: false };
        }
        const unified = await this.prisma.unifiedParty.findFirst({
            where: {
                OR: [{ id: partyId }, { kingId: partyId }],
                ownerFarmerId: ownerId,
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
                where: { ownerId: this.getFarmerId(user), mobile: party.mobile, deletedAt: null },
                select: { id: true },
            });
            matchParties.forEach((p) => partyIds.add(p.id));
            const matchUnified = await this.prisma.unifiedParty.findMany({
                where: { ownerFarmerId: this.getFarmerId(user), mobile: party.mobile, deletedAt: null },
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
                farmerId: this.getFarmerId(user),
                OR: [
                    { partyId: { in: Array.from(partyIds) } },
                    { partyName: { equals: party.name, mode: 'insensitive' } },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });
        const validEntries = entries;
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
        const farmerId = this.getFarmerId(user);
        let targetPartyId = partyObj.id;
        const dbParty = await this.prisma.party.findFirst({ where: { id: partyObj.id, ownerId: farmerId, deletedAt: null } });
        if (!dbParty) {
            let existingParty = await this.prisma.party.findFirst({
                where: { ownerId: farmerId, name: partyObj.name, deletedAt: null },
            });
            if (!existingParty) {
                existingParty = await this.prisma.party.create({
                    data: { ownerId: farmerId, name: partyObj.name, mobile: partyObj.mobile, address: partyObj.address },
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
                bill = await this.prisma.saleBill.findFirst({ where: { farmerId, billNo: dto.saleBillId } }).catch(() => null);
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
                const farmerObj = await this.prisma.user.findUnique({ where: { id: farmerId }, select: { name: true } });
                const billNo = `FK-${Date.now().toString().slice(-6)}`;
                const createdBill = await this.prisma.saleBill.create({
                    data: {
                        farmerId,
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
        this.chatGateway.broadcastMarketRateUpdate({ source: 'farmer_sale_ledger' });
        return this.getStatement(user, partyId);
    }
    async nextReceiptNo(farmerId) {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `${yy}${mm}`;
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const countThisMonth = await this.prisma.paymentReceipt.count({
            where: {
                farmerId,
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
        });
        let nextSeq = countThisMonth + 1;
        let paddedSeq = String(nextSeq).padStart(2, '0');
        let candidate = `${prefix}-${paddedSeq}`;
        let exists = await this.prisma.paymentReceipt.findFirst({
            where: { farmerId, receiptNo: candidate },
        });
        while (exists) {
            nextSeq++;
            paddedSeq = String(nextSeq).padStart(2, '0');
            candidate = `${prefix}-${paddedSeq}`;
            exists = await this.prisma.paymentReceipt.findFirst({
                where: { farmerId, receiptNo: candidate },
            });
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
        const farmerId = this.getFarmerId(user);
        const receipt = await this.prisma.paymentReceipt.create({
            data: {
                farmerId,
                receiptNo: await this.nextReceiptNo(farmerId),
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
        const farmerId = this.getFarmerId(user);
        const receipt = await this.prisma.paymentReceipt.create({
            data: {
                farmerId,
                receiptNo: await this.nextReceiptNo(farmerId),
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
                ownerFarmerId: this.getFarmerId(user),
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
        const where = { ownerFarmerId: this.getFarmerId(user), deletedAt: null };
        if (role) {
            where.roles = { has: role };
        }
        return this.prisma.unifiedParty.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }
    async recordArhtiyaAdvance(user, dto) {
        const farmerId = this.getFarmerId(user);
        const party = await this.prisma.unifiedParty.findFirst({
            where: { id: dto.partyId, ownerFarmerId: farmerId, deletedAt: null },
        });
        if (!party)
            throw new common_1.NotFoundException('Arhtiya / Party not found.');
        return this.prisma.arhtiyaTransaction.create({
            data: {
                farmerId,
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
        const farmerId = this.getFarmerId(user);
        const party = await this.prisma.unifiedParty.findFirst({
            where: { id: dto.partyId, ownerFarmerId: farmerId, deletedAt: null },
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
        const tx = await this.prisma.arhtiyaTransaction.create({
            data: {
                farmerId,
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
        this.chatGateway.broadcastMarketRateUpdate({ source: 'arhtiya_crop_sale', transactionId: tx.id });
        return tx;
    }
    async getArhtiyaLedgerHisab(user, partyId) {
        const farmerId = this.getFarmerId(user);
        const party = await this.prisma.unifiedParty.findFirst({
            where: { id: partyId, ownerFarmerId: farmerId, deletedAt: null },
        });
        if (!party)
            throw new common_1.NotFoundException('Arhtiya / Party not found.');
        const transactions = await this.prisma.arhtiyaTransaction.findMany({
            where: { partyId, farmerId },
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
    async clearAllEntries(user) {
        throw new common_1.ForbiddenException('Clearing transaction entries has been permanently disabled to protect your financial records.');
    }
    async clearPartyEntries(user, partyId) {
        throw new common_1.ForbiddenException('Clearing transaction entries has been permanently disabled to protect your financial records.');
    }
    async lookupBuyerStatement(buyerMobile, farmerMobileOrKingId) {
        const rawFarmerDigits = farmerMobileOrKingId.replace(/\D/g, '');
        const cleanFarmerMobile = rawFarmerDigits.slice(-10);
        const cleanFarmerInput = farmerMobileOrKingId.trim();
        const rawBuyerDigits = buyerMobile.replace(/\D/g, '');
        const cleanBuyerMobile = rawBuyerDigits.slice(-10);
        if (cleanBuyerMobile.length !== 10) {
            throw new common_1.NotFoundException('Please provide a valid 10-digit buyer mobile number.');
        }
        const farmer = await this.prisma.user.findFirst({
            where: {
                OR: [
                    ...(cleanFarmerMobile.length === 10
                        ? [
                            { mobile: cleanFarmerMobile },
                            { mobile: `+91${cleanFarmerMobile}` },
                            { mobile: { endsWith: cleanFarmerMobile } },
                        ]
                        : []),
                    { kingId: { equals: cleanFarmerInput, mode: 'insensitive' } },
                ],
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                mobile: true,
                kingId: true,
                village: true,
                district: true,
                state: true,
                farmName: true,
            },
        });
        if (!farmer) {
            throw new common_1.NotFoundException('Farmer account not found with this mobile or King ID.');
        }
        const party = await this.prisma.party.findFirst({
            where: {
                ownerId: farmer.id,
                OR: [
                    { mobile: cleanBuyerMobile },
                    { mobile: `+91${cleanBuyerMobile}` },
                    { mobile: { endsWith: cleanBuyerMobile } },
                ],
                deletedAt: null,
            },
        });
        const unifiedParty = await this.prisma.unifiedParty.findFirst({
            where: {
                ownerFarmerId: farmer.id,
                OR: [
                    { mobile: cleanBuyerMobile },
                    { mobile: `+91${cleanBuyerMobile}` },
                    { mobile: { endsWith: cleanBuyerMobile } },
                ],
                deletedAt: null,
            },
        });
        if (!party && !unifiedParty) {
            return {
                found: false,
                farmer: {
                    name: farmer.name,
                    farmName: farmer.farmName || farmer.name,
                    mobile: farmer.mobile,
                    kingId: farmer.kingId,
                    village: farmer.village,
                    district: farmer.district,
                },
                buyerMobile: cleanBuyerMobile,
                message: 'No bills or ledger found between this buyer mobile and farmer.',
            };
        }
        const partyTargetId = party ? party.id : unifiedParty.id;
        const fakeAuthUser = {
            id: farmer.id,
            mobile: farmer.mobile,
            name: farmer.name,
            role: client_1.Role.FARMER,
            roles: [client_1.Role.FARMER],
            deactivatedRoles: [],
            kingId: farmer.kingId,
        };
        const statement = await this.getStatement(fakeAuthUser, partyTargetId);
        let arhtiyaHisab = null;
        if (unifiedParty) {
            try {
                arhtiyaHisab = await this.getArhtiyaLedgerHisab(fakeAuthUser, unifiedParty.id);
            }
            catch (_) { }
        }
        return {
            found: true,
            farmer: {
                id: farmer.id,
                name: farmer.name,
                farmName: farmer.farmName || farmer.name,
                mobile: farmer.mobile,
                kingId: farmer.kingId,
                village: farmer.village,
                district: farmer.district,
                state: farmer.state,
            },
            buyerParty: {
                name: party?.name || unifiedParty?.name,
                mobile: cleanBuyerMobile,
                address: party?.address || unifiedParty?.address,
                kingId: unifiedParty?.kingId || null,
                shopNumber: unifiedParty?.shopNumber || null,
                mandiName: unifiedParty?.mandiName || null,
            },
            statement,
            arhtiyaHisab,
        };
    }
    async getTraderMasterLedger(user) {
        const rawDigits = user.mobile.replace(/\D/g, '');
        const cleanMobile = rawDigits.slice(-10);
        const [matchingParties, matchingUnified] = await Promise.all([
            this.prisma.party.findMany({
                where: {
                    OR: [
                        { mobile: cleanMobile },
                        { mobile: user.mobile },
                        { mobile: `+91${cleanMobile}` },
                    ],
                    deletedAt: null,
                },
                include: {
                    owner: {
                        select: { id: true, name: true, mobile: true, kingId: true, village: true, district: true, state: true, farmName: true },
                    },
                    ledgerEntries: {
                        select: { id: true, type: true, amount: true, createdAt: true, reason: true },
                    },
                },
            }),
            this.prisma.unifiedParty.findMany({
                where: {
                    OR: [
                        { mobile: cleanMobile },
                        { mobile: user.mobile },
                        { mobile: `+91${cleanMobile}` },
                        { userId: user.id },
                    ],
                    deletedAt: null,
                },
                include: {
                    ownerFarmer: {
                        select: { id: true, name: true, mobile: true, kingId: true, village: true, district: true, state: true, farmName: true },
                    },
                    arhtiyaTransactions: {
                        select: { id: true, type: true, amount: true, transactionDate: true, cropName: true, netAmount: true },
                    },
                },
            }),
        ]);
        const farmerMap = new Map();
        for (const p of matchingParties) {
            if (!p.owner)
                continue;
            const farmerId = p.owner.id;
            if (!farmerMap.has(farmerId)) {
                farmerMap.set(farmerId, {
                    farmerId,
                    farmerName: p.owner.name,
                    farmName: p.owner.farmName || p.owner.name,
                    farmerMobile: p.owner.mobile,
                    kingId: p.owner.kingId,
                    location: [p.owner.village, p.owner.district, p.owner.state].filter(Boolean).join(', '),
                    totalPurchases: 0,
                    totalPaid: 0,
                    balanceDue: 0,
                    billCount: 0,
                    lastTransactionDate: null,
                });
            }
            const record = farmerMap.get(farmerId);
            for (const entry of p.ledgerEntries) {
                const amt = Number(entry.amount);
                if (entry.type === client_1.PartyLedgerEntryType.SALE_CREDIT) {
                    record.totalPurchases += amt;
                    record.balanceDue += amt;
                    record.billCount += 1;
                }
                else if (entry.type === client_1.PartyLedgerEntryType.SALE_PAYMENT) {
                    record.totalPaid += amt;
                    record.balanceDue -= amt;
                }
                if (!record.lastTransactionDate || new Date(entry.createdAt) > new Date(record.lastTransactionDate)) {
                    record.lastTransactionDate = entry.createdAt;
                }
            }
        }
        for (const u of matchingUnified) {
            if (!u.ownerFarmer)
                continue;
            const farmerId = u.ownerFarmer.id;
            if (!farmerMap.has(farmerId)) {
                farmerMap.set(farmerId, {
                    farmerId,
                    farmerName: u.ownerFarmer.name,
                    farmName: u.ownerFarmer.farmName || u.ownerFarmer.name,
                    farmerMobile: u.ownerFarmer.mobile,
                    kingId: u.ownerFarmer.kingId,
                    location: [u.ownerFarmer.village, u.ownerFarmer.district, u.ownerFarmer.state].filter(Boolean).join(', '),
                    totalPurchases: 0,
                    totalPaid: 0,
                    balanceDue: 0,
                    billCount: 0,
                    lastTransactionDate: null,
                });
            }
            const record = farmerMap.get(farmerId);
            for (const tx of u.arhtiyaTransactions) {
                const amt = Number(tx.netAmount || tx.amount);
                if (tx.type === client_1.ArhtiyaTransactionType.CROP_SALE_CREDIT) {
                    record.totalPurchases += amt;
                    record.balanceDue += amt;
                    record.billCount += 1;
                }
                else if (tx.type === client_1.ArhtiyaTransactionType.SETTLEMENT_PAYOUT) {
                    record.totalPaid += amt;
                    record.balanceDue -= amt;
                }
                if (!record.lastTransactionDate || new Date(tx.transactionDate) > new Date(record.lastTransactionDate)) {
                    record.lastTransactionDate = tx.transactionDate;
                }
            }
        }
        const farmersList = Array.from(farmerMap.values()).map((f) => ({
            ...f,
            totalPurchases: Math.round(f.totalPurchases * 100) / 100,
            totalPaid: Math.round(f.totalPaid * 100) / 100,
            balanceDue: Math.round(f.balanceDue * 100) / 100,
        }));
        const totalProcurement = farmersList.reduce((sum, f) => sum + f.totalPurchases, 0);
        const totalPaid = farmersList.reduce((sum, f) => sum + f.totalPaid, 0);
        const totalBalance = farmersList.reduce((sum, f) => sum + f.balanceDue, 0);
        const traderUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, name: true, mobile: true, kingId: true, farmName: true, district: true, state: true },
        });
        return {
            trader: {
                id: user.id,
                name: traderUser?.name || 'Trader',
                shopName: traderUser?.farmName || null,
                mobile: traderUser?.mobile || user.mobile,
                kingId: traderUser?.kingId || null,
            },
            summary: {
                totalFarmersCount: farmersList.length,
                totalProcurementAmount: Math.round(totalProcurement * 100) / 100,
                totalPaidAmount: Math.round(totalPaid * 100) / 100,
                totalBalanceDue: Math.round(totalBalance * 100) / 100,
            },
            farmers: farmersList.sort((a, b) => b.totalPurchases - a.totalPurchases),
        };
    }
};
exports.PartiesService = PartiesService;
exports.PartiesService = PartiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chat_gateway_1.ChatGateway])
], PartiesService);
//# sourceMappingURL=parties.service.js.map