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
exports.KingConnectService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let KingConnectService = class KingConnectService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findTargetUser(kingId, mobile) {
        if (!kingId && !mobile) {
            throw new common_1.BadRequestException('Provide kingId or mobile to search.');
        }
        const user = await this.prisma.user.findFirst({
            where: kingId
                ? { kingId, deletedAt: null }
                : { mobile: mobile, deletedAt: null },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found with that King ID or mobile.');
        return user;
    }
    async getOrCreateLink(userAId, userBId) {
        const existing = await this.prisma.kingConnectLink.findFirst({
            where: {
                OR: [
                    { initiatorId: userAId, receiverId: userBId },
                    { initiatorId: userBId, receiverId: userAId },
                ],
            },
        });
        return existing;
    }
    async sendConnectRequest(user, dto) {
        const target = await this.findTargetUser(dto.kingId, dto.mobile);
        if (target.id === user.id)
            throw new common_1.BadRequestException('You cannot connect with yourself.');
        const existing = await this.getOrCreateLink(user.id, target.id);
        if (existing) {
            if (existing.status === 'ACCEPTED')
                throw new common_1.BadRequestException('Already connected.');
            if (existing.status === 'PENDING')
                throw new common_1.BadRequestException('Request already pending.');
            if (existing.status === 'BLOCKED')
                throw new common_1.ForbiddenException('This connection is blocked.');
        }
        return this.prisma.kingConnectLink.create({
            data: {
                initiatorId: user.id,
                receiverId: target.id,
                status: client_1.KingConnectStatus.PENDING,
            },
            include: { receiver: { select: { id: true, name: true, kingId: true, mobile: true } } },
        });
    }
    async respondToConnect(user, linkId, dto) {
        const link = await this.prisma.kingConnectLink.findUnique({ where: { id: linkId } });
        if (!link)
            throw new common_1.NotFoundException('Connect request not found.');
        if (link.receiverId !== user.id)
            throw new common_1.ForbiddenException('Not your request to respond to.');
        if (link.status !== 'PENDING')
            throw new common_1.BadRequestException('Request already handled.');
        return this.prisma.kingConnectLink.update({
            where: { id: linkId },
            data: { status: dto.response === 'ACCEPTED' ? client_1.KingConnectStatus.ACCEPTED : client_1.KingConnectStatus.DECLINED },
            include: { initiator: { select: { id: true, name: true, kingId: true } } },
        });
    }
    async listMyConnections(user) {
        return this.prisma.kingConnectLink.findMany({
            where: {
                OR: [{ initiatorId: user.id }, { receiverId: user.id }],
                status: client_1.KingConnectStatus.ACCEPTED,
            },
            include: {
                initiator: { select: { id: true, name: true, kingId: true, mobile: true, role: true } },
                receiver: { select: { id: true, name: true, kingId: true, mobile: true, role: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async listPendingConnectionRequests(user) {
        return this.prisma.kingConnectLink.findMany({
            where: { receiverId: user.id, status: client_1.KingConnectStatus.PENDING },
            include: {
                initiator: { select: { id: true, name: true, kingId: true, mobile: true, role: true, village: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async toggleAutoAccept(user, linkId) {
        const link = await this.prisma.kingConnectLink.findUnique({ where: { id: linkId } });
        if (!link || link.status !== 'ACCEPTED')
            throw new common_1.NotFoundException('Active connection not found.');
        const isInitiator = link.initiatorId === user.id;
        const isReceiver = link.receiverId === user.id;
        if (!isInitiator && !isReceiver)
            throw new common_1.ForbiddenException('Not your connection.');
        const updateData = isInitiator
            ? { initiatorAutoAccept: !link.initiatorAutoAccept }
            : { receiverAutoAccept: !link.receiverAutoAccept };
        return this.prisma.kingConnectLink.update({ where: { id: linkId }, data: updateData });
    }
    expiresAt() {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d;
    }
    async createSyncRequest(user, dto) {
        const receiver = await this.findTargetUser(dto.receiverKingId, undefined);
        const link = await this.prisma.kingConnectLink.findFirst({
            where: {
                OR: [
                    { initiatorId: user.id, receiverId: receiver.id },
                    { initiatorId: receiver.id, receiverId: user.id },
                ],
                status: client_1.KingConnectStatus.ACCEPTED,
            },
        });
        if (!link)
            throw new common_1.BadRequestException('You are not connected to this user. Send a connect request first.');
        const myAutoAccept = link.initiatorId === user.id ? link.receiverAutoAccept : link.initiatorAutoAccept;
        const syncReq = await this.prisma.p2pLedgerSyncRequest.create({
            data: {
                linkId: link.id,
                senderId: user.id,
                receiverId: receiver.id,
                transactionType: dto.transactionType,
                amount: dto.amount,
                reason: dto.reason,
                refBillNo: dto.refBillNo,
                notes: dto.notes,
                status: myAutoAccept ? client_1.SyncRequestStatus.ACCEPTED : client_1.SyncRequestStatus.PENDING,
                isVerified: myAutoAccept,
                expiresAt: this.expiresAt(),
                acceptedAt: myAutoAccept ? new Date() : null,
            },
        });
        if (myAutoAccept) {
            await this.createReceiverLedgerEntry(receiver.id, user.id, dto.transactionType, dto.amount, dto.reason, link.id);
        }
        return syncReq;
    }
    async createReceiverLedgerEntry(receiverId, senderId, transactionType, amount, reason, linkId) {
        let receiverParty = await this.prisma.party.findFirst({
            where: { ownerId: receiverId, mobile: undefined },
        });
        const sender = await this.prisma.user.findUnique({ where: { id: senderId } });
        if (!sender)
            return;
        receiverParty = await this.prisma.party.findFirst({
            where: { ownerId: receiverId, name: sender.name, deletedAt: null },
        });
        if (!receiverParty) {
            receiverParty = await this.prisma.party.create({
                data: {
                    ownerId: receiverId,
                    name: sender.name,
                    mobile: sender.mobile,
                    address: `King Connect (${sender.kingId || sender.mobile})`,
                },
            });
        }
        const reversedType = this.reverseTransactionType(transactionType);
        await this.prisma.partyLedgerEntry.create({
            data: {
                partyId: receiverParty.id,
                type: reversedType,
                amount,
                reason: `[King Connect ✅] ${reason}`,
            },
        });
    }
    reverseTransactionType(type) {
        switch (type) {
            case client_1.PartyLedgerEntryType.SALE_CREDIT:
                return client_1.PartyLedgerEntryType.EXPENSE_CREDIT;
            case client_1.PartyLedgerEntryType.SALE_PAYMENT:
                return client_1.PartyLedgerEntryType.EXPENSE_PAYMENT;
            case client_1.PartyLedgerEntryType.EXPENSE_CREDIT:
                return client_1.PartyLedgerEntryType.SALE_CREDIT;
            case client_1.PartyLedgerEntryType.EXPENSE_PAYMENT:
                return client_1.PartyLedgerEntryType.SALE_PAYMENT;
        }
    }
    async respondToSyncRequest(user, syncId, dto) {
        const syncReq = await this.prisma.p2pLedgerSyncRequest.findUnique({
            where: { id: syncId },
            include: { link: true },
        });
        if (!syncReq)
            throw new common_1.NotFoundException('Sync request not found.');
        if (syncReq.receiverId !== user.id)
            throw new common_1.ForbiddenException('Not your request to respond to.');
        if (syncReq.status !== 'PENDING')
            throw new common_1.BadRequestException('This sync request has already been handled.');
        if (dto.response === 'ACCEPTED') {
            await this.createReceiverLedgerEntry(user.id, syncReq.senderId, syncReq.transactionType, Number(syncReq.amount), syncReq.reason, syncReq.linkId);
            const newCount = syncReq.link.acceptedCount + 1;
            let newTrustLevel = syncReq.link.trustLevel;
            if (newCount >= 10)
                newTrustLevel = client_1.TrustLevel.TRUSTED;
            else if (newCount >= 3)
                newTrustLevel = client_1.TrustLevel.BASIC;
            await this.prisma.kingConnectLink.update({
                where: { id: syncReq.linkId },
                data: { acceptedCount: newCount, trustLevel: newTrustLevel },
            });
            return this.prisma.p2pLedgerSyncRequest.update({
                where: { id: syncId },
                data: { status: client_1.SyncRequestStatus.ACCEPTED, isVerified: true, acceptedAt: new Date() },
            });
        }
        else if (dto.response === 'COUNTER_PROPOSED') {
            if (!dto.counterAmount)
                throw new common_1.BadRequestException('counterAmount is required for a counter proposal.');
            return this.prisma.p2pLedgerSyncRequest.update({
                where: { id: syncId },
                data: {
                    status: client_1.SyncRequestStatus.COUNTER_PROPOSED,
                    counterAmount: dto.counterAmount,
                    counterNote: dto.counterNote,
                },
            });
        }
        else {
            return this.prisma.p2pLedgerSyncRequest.update({
                where: { id: syncId },
                data: {
                    status: client_1.SyncRequestStatus.REJECTED,
                    rejectionReason: dto.rejectionReason,
                    rejectedAt: new Date(),
                },
            });
        }
    }
    async listPendingSyncRequests(user) {
        return this.prisma.p2pLedgerSyncRequest.findMany({
            where: { receiverId: user.id, status: client_1.SyncRequestStatus.PENDING },
            include: {
                sender: { select: { id: true, name: true, kingId: true, mobile: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async listSyncHistory(user) {
        return this.prisma.p2pLedgerSyncRequest.findMany({
            where: {
                OR: [{ senderId: user.id }, { receiverId: user.id }],
                status: { not: client_1.SyncRequestStatus.PENDING },
            },
            include: {
                sender: { select: { id: true, name: true, kingId: true } },
                receiver: { select: { id: true, name: true, kingId: true } },
            },
            orderBy: { updatedAt: 'desc' },
            take: 100,
        });
    }
    async createDemandRequest(user, dto) {
        const farmer = await this.findTargetUser(dto.farmerKingId, undefined);
        const link = await this.prisma.kingConnectLink.findFirst({
            where: {
                OR: [
                    { initiatorId: user.id, receiverId: farmer.id },
                    { initiatorId: farmer.id, receiverId: user.id },
                ],
                status: client_1.KingConnectStatus.ACCEPTED,
            },
        });
        if (!link)
            throw new common_1.BadRequestException('You must be connected to this farmer to send a demand.');
        return this.prisma.demandRequest.create({
            data: {
                linkId: link.id,
                requesterId: user.id,
                farmerId: farmer.id,
                cropName: dto.cropName,
                quantity: dto.quantity,
                unit: dto.unit,
                offeredPrice: dto.offeredPrice ?? null,
                requiredByDate: dto.requiredByDate ? new Date(dto.requiredByDate) : null,
                notes: dto.notes ?? null,
                expiresAt: this.expiresAt(),
            },
            include: {
                requester: { select: { id: true, name: true, kingId: true } },
                farmer: { select: { id: true, name: true, kingId: true } },
            },
        });
    }
    async respondToDemand(user, demandId, dto) {
        const demand = await this.prisma.demandRequest.findUnique({ where: { id: demandId } });
        if (!demand)
            throw new common_1.NotFoundException('Demand request not found.');
        if (demand.farmerId !== user.id)
            throw new common_1.ForbiddenException('Only the farmer can respond to demands.');
        if (demand.status !== 'PENDING')
            throw new common_1.BadRequestException('This demand has already been handled.');
        let newStatus;
        const updateData = { status: newStatus };
        if (dto.response === 'ACCEPTED') {
            newStatus = client_1.DemandStatus.ACCEPTED;
            updateData.status = newStatus;
        }
        else if (dto.response === 'PARTIALLY_ACCEPTED') {
            if (!dto.acceptedQty)
                throw new common_1.BadRequestException('acceptedQty is required for partial accept.');
            newStatus = client_1.DemandStatus.PARTIALLY_ACCEPTED;
            updateData.status = newStatus;
            updateData.acceptedQty = dto.acceptedQty;
            updateData.counterNote = dto.counterNote;
        }
        else {
            newStatus = client_1.DemandStatus.REJECTED;
            updateData.status = newStatus;
            updateData.rejectionReason = dto.rejectionReason;
        }
        return this.prisma.demandRequest.update({
            where: { id: demandId },
            data: updateData,
            include: {
                requester: { select: { id: true, name: true, kingId: true } },
            },
        });
    }
    async listDemands(user, type) {
        const where = type === 'incoming'
            ? { farmerId: user.id, status: client_1.DemandStatus.PENDING }
            : { requesterId: user.id };
        return this.prisma.demandRequest.findMany({
            where,
            include: {
                requester: { select: { id: true, name: true, kingId: true, mobile: true } },
                farmer: { select: { id: true, name: true, kingId: true, mobile: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createPaymentRequest(user, dto) {
        const receiver = await this.findTargetUser(dto.receiverKingId, undefined);
        const link = await this.prisma.kingConnectLink.findFirst({
            where: {
                OR: [
                    { initiatorId: user.id, receiverId: receiver.id },
                    { initiatorId: receiver.id, receiverId: user.id },
                ],
                status: client_1.KingConnectStatus.ACCEPTED,
            },
        });
        if (!link)
            throw new common_1.BadRequestException('You must be connected to send a payment request.');
        return this.prisma.kingPaymentRequest.create({
            data: {
                linkId: link.id,
                senderId: user.id,
                receiverId: receiver.id,
                amount: dto.amount,
                reason: dto.reason,
                refBillNo: dto.refBillNo ?? null,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
                notes: dto.notes ?? null,
                expiresAt: this.expiresAt(),
            },
            include: {
                sender: { select: { id: true, name: true, kingId: true } },
                receiver: { select: { id: true, name: true, kingId: true } },
            },
        });
    }
    async respondToPaymentRequest(user, requestId, dto) {
        const payReq = await this.prisma.kingPaymentRequest.findUnique({ where: { id: requestId } });
        if (!payReq)
            throw new common_1.NotFoundException('Payment request not found.');
        if (payReq.receiverId !== user.id)
            throw new common_1.ForbiddenException('Not your payment request to respond to.');
        if (payReq.status !== 'PENDING' && payReq.status !== 'POSTPONED') {
            throw new common_1.BadRequestException('This payment request has already been handled.');
        }
        const updateData = {};
        if (dto.response === 'ACCEPTED') {
            updateData.status = client_1.PaymentRequestStatus.ACCEPTED;
            updateData.acceptedAmount = payReq.amount;
        }
        else if (dto.response === 'PARTIALLY_ACCEPTED') {
            if (!dto.acceptedAmount)
                throw new common_1.BadRequestException('acceptedAmount is required for partial accept.');
            updateData.status = client_1.PaymentRequestStatus.PARTIALLY_ACCEPTED;
            updateData.acceptedAmount = dto.acceptedAmount;
        }
        else if (dto.response === 'POSTPONED') {
            if (!dto.postponedDate)
                throw new common_1.BadRequestException('postponedDate is required to postpone.');
            updateData.status = client_1.PaymentRequestStatus.POSTPONED;
            updateData.postponedDate = new Date(dto.postponedDate);
        }
        else {
            updateData.status = client_1.PaymentRequestStatus.REJECTED;
            updateData.rejectionReason = dto.rejectionReason;
        }
        return this.prisma.kingPaymentRequest.update({
            where: { id: requestId },
            data: updateData,
            include: {
                sender: { select: { id: true, name: true, kingId: true } },
            },
        });
    }
    async listPaymentRequests(user, type) {
        const where = type === 'incoming'
            ? { receiverId: user.id }
            : { senderId: user.id };
        return this.prisma.kingPaymentRequest.findMany({
            where,
            include: {
                sender: { select: { id: true, name: true, kingId: true, mobile: true } },
                receiver: { select: { id: true, name: true, kingId: true, mobile: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getActivityFeed(user) {
        const [syncSent, syncReceived, demandsSent, demandsReceived, paymentsSent, paymentsReceived, connections] = await Promise.all([
            this.prisma.p2pLedgerSyncRequest.findMany({
                where: { senderId: user.id },
                include: { receiver: { select: { id: true, name: true, kingId: true } } },
                orderBy: { createdAt: 'desc' },
                take: 30,
            }),
            this.prisma.p2pLedgerSyncRequest.findMany({
                where: { receiverId: user.id },
                include: { sender: { select: { id: true, name: true, kingId: true } } },
                orderBy: { createdAt: 'desc' },
                take: 30,
            }),
            this.prisma.demandRequest.findMany({
                where: { requesterId: user.id },
                include: { farmer: { select: { id: true, name: true, kingId: true } } },
                orderBy: { createdAt: 'desc' },
                take: 20,
            }),
            this.prisma.demandRequest.findMany({
                where: { farmerId: user.id },
                include: { requester: { select: { id: true, name: true, kingId: true } } },
                orderBy: { createdAt: 'desc' },
                take: 20,
            }),
            this.prisma.kingPaymentRequest.findMany({
                where: { senderId: user.id },
                include: { receiver: { select: { id: true, name: true, kingId: true } } },
                orderBy: { createdAt: 'desc' },
                take: 20,
            }),
            this.prisma.kingPaymentRequest.findMany({
                where: { receiverId: user.id },
                include: { sender: { select: { id: true, name: true, kingId: true } } },
                orderBy: { createdAt: 'desc' },
                take: 20,
            }),
            this.prisma.kingConnectLink.findMany({
                where: {
                    OR: [{ initiatorId: user.id }, { receiverId: user.id }],
                },
                include: {
                    initiator: { select: { id: true, name: true, kingId: true } },
                    receiver: { select: { id: true, name: true, kingId: true } },
                },
                orderBy: { updatedAt: 'desc' },
                take: 20,
            }),
        ]);
        const events = [
            ...syncSent.map((s) => ({ ...s, eventType: 'SYNC_SENT', direction: 'outgoing' })),
            ...syncReceived.map((s) => ({ ...s, eventType: 'SYNC_RECEIVED', direction: 'incoming' })),
            ...demandsSent.map((d) => ({ ...d, eventType: 'DEMAND_SENT', direction: 'outgoing' })),
            ...demandsReceived.map((d) => ({ ...d, eventType: 'DEMAND_RECEIVED', direction: 'incoming' })),
            ...paymentsSent.map((p) => ({ ...p, eventType: 'PAYMENT_REQUEST_SENT', direction: 'outgoing' })),
            ...paymentsReceived.map((p) => ({ ...p, eventType: 'PAYMENT_REQUEST_RECEIVED', direction: 'incoming' })),
            ...connections.map((c) => ({ ...c, eventType: 'CONNECTION', direction: 'both' })),
        ];
        events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return events.slice(0, 80);
    }
    async getSharedLedger(user, linkId) {
        const link = await this.prisma.kingConnectLink.findUnique({
            where: { id: linkId },
            include: {
                initiator: { select: { id: true, name: true, kingId: true, mobile: true } },
                receiver: { select: { id: true, name: true, kingId: true, mobile: true } },
            },
        });
        if (!link)
            throw new common_1.NotFoundException('Connection not found.');
        if (link.initiatorId !== user.id && link.receiverId !== user.id) {
            throw new common_1.ForbiddenException('Not your connection.');
        }
        const syncRequests = await this.prisma.p2pLedgerSyncRequest.findMany({
            where: { linkId, status: client_1.SyncRequestStatus.ACCEPTED },
            include: {
                sender: { select: { name: true, kingId: true } },
                receiver: { select: { name: true, kingId: true } },
            },
            orderBy: { acceptedAt: 'asc' },
        });
        const paymentRequests = await this.prisma.kingPaymentRequest.findMany({
            where: {
                linkId,
                status: { in: [client_1.PaymentRequestStatus.ACCEPTED, client_1.PaymentRequestStatus.PARTIALLY_ACCEPTED] },
            },
            include: {
                sender: { select: { name: true, kingId: true } },
                receiver: { select: { name: true, kingId: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
        return {
            link,
            syncRequests,
            paymentRequests,
            generatedAt: new Date(),
        };
    }
    async expireStaleRequests() {
        const now = new Date();
        const [syncs, demands, payments] = await Promise.all([
            this.prisma.p2pLedgerSyncRequest.updateMany({
                where: { status: client_1.SyncRequestStatus.PENDING, expiresAt: { lt: now } },
                data: { status: client_1.SyncRequestStatus.EXPIRED },
            }),
            this.prisma.demandRequest.updateMany({
                where: { status: client_1.DemandStatus.PENDING, expiresAt: { lt: now } },
                data: { status: client_1.DemandStatus.EXPIRED },
            }),
            this.prisma.kingPaymentRequest.updateMany({
                where: { status: client_1.PaymentRequestStatus.PENDING, expiresAt: { lt: now } },
                data: { status: client_1.PaymentRequestStatus.EXPIRED },
            }),
        ]);
        return { syncs: syncs.count, demands: demands.count, payments: payments.count };
    }
};
exports.KingConnectService = KingConnectService;
exports.KingConnectService = KingConnectService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KingConnectService);
//# sourceMappingURL=king-connect.service.js.map