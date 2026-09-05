import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import {
  DemandStatus,
  KingConnectStatus,
  KingPaymentRequest,
  P2pLedgerSyncRequest,
  PartyLedgerEntryType,
  PaymentRequestStatus,
  SyncRequestStatus,
  TrustLevel,
} from '@prisma/client';
import { SendConnectRequestDto } from './dto/send-connect-request.dto';
import { RespondConnectDto } from './dto/respond-connect.dto';
import { CreateSyncRequestDto } from './dto/create-sync-request.dto';
import { RespondSyncRequestDto } from './dto/respond-sync-request.dto';
import { CreateDemandRequestDto } from './dto/create-demand-request.dto';
import { RespondDemandRequestDto } from './dto/respond-demand-request.dto';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { RespondPaymentRequestDto } from './dto/respond-payment-request.dto';

@Injectable()
export class KingConnectService {
  constructor(private readonly prisma: PrismaService) {}

  /** Find a user by King ID or mobile number */
  private async findTargetUser(kingId?: string, mobile?: string) {
    if (!kingId && !mobile) {
      throw new BadRequestException('Provide kingId or mobile to search.');
    }
    const user = await this.prisma.user.findFirst({
      where: kingId
        ? { kingId, deletedAt: null }
        : { mobile: mobile!, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found with that King ID or mobile.');
    return user;
  }

  /** Get or create a bidirectional link between two users */
  private async getOrCreateLink(userAId: string, userBId: string) {
    // Check both directions
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

  // ─── Connection Management ────────────────────────────────────────────────

  async sendConnectRequest(user: AuthUser, dto: SendConnectRequestDto) {
    const target = await this.findTargetUser(dto.kingId, dto.mobile);
    if (target.id === user.id) throw new BadRequestException('You cannot connect with yourself.');

    const existing = await this.getOrCreateLink(user.id, target.id);
    if (existing) {
      if (existing.status === 'ACCEPTED') throw new BadRequestException('Already connected.');
      if (existing.status === 'PENDING') throw new BadRequestException('Request already pending.');
      if (existing.status === 'BLOCKED') throw new ForbiddenException('This connection is blocked.');
    }

    return this.prisma.kingConnectLink.create({
      data: {
        initiatorId: user.id,
        receiverId: target.id,
        status: KingConnectStatus.PENDING,
      },
      include: { receiver: { select: { id: true, name: true, kingId: true, mobile: true } } },
    });
  }

  async respondToConnect(user: AuthUser, linkId: string, dto: RespondConnectDto) {
    const link = await this.prisma.kingConnectLink.findUnique({ where: { id: linkId } });
    if (!link) throw new NotFoundException('Connect request not found.');
    if (link.receiverId !== user.id) throw new ForbiddenException('Not your request to respond to.');
    if (link.status !== 'PENDING') throw new BadRequestException('Request already handled.');

    return this.prisma.kingConnectLink.update({
      where: { id: linkId },
      data: { status: dto.response === 'ACCEPTED' ? KingConnectStatus.ACCEPTED : KingConnectStatus.DECLINED },
      include: { initiator: { select: { id: true, name: true, kingId: true } } },
    });
  }

  async listMyConnections(user: AuthUser) {
    return this.prisma.kingConnectLink.findMany({
      where: {
        OR: [{ initiatorId: user.id }, { receiverId: user.id }],
        status: KingConnectStatus.ACCEPTED,
      },
      include: {
        initiator: { select: { id: true, name: true, kingId: true, mobile: true, role: true } },
        receiver: { select: { id: true, name: true, kingId: true, mobile: true, role: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listPendingConnectionRequests(user: AuthUser) {
    return this.prisma.kingConnectLink.findMany({
      where: { receiverId: user.id, status: KingConnectStatus.PENDING },
      include: {
        initiator: { select: { id: true, name: true, kingId: true, mobile: true, role: true, village: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleAutoAccept(user: AuthUser, linkId: string) {
    const link = await this.prisma.kingConnectLink.findUnique({ where: { id: linkId } });
    if (!link || link.status !== 'ACCEPTED') throw new NotFoundException('Active connection not found.');

    const isInitiator = link.initiatorId === user.id;
    const isReceiver = link.receiverId === user.id;
    if (!isInitiator && !isReceiver) throw new ForbiddenException('Not your connection.');

    const updateData = isInitiator
      ? { initiatorAutoAccept: !link.initiatorAutoAccept }
      : { receiverAutoAccept: !link.receiverAutoAccept };

    return this.prisma.kingConnectLink.update({ where: { id: linkId }, data: updateData });
  }

  // ─── P2P Ledger Sync ──────────────────────────────────────────────────────

  private expiresAt() {
    const d = new Date();
    d.setDate(d.getDate() + 7); // 7 days
    return d;
  }

  async createSyncRequest(user: AuthUser, dto: CreateSyncRequestDto) {
    // Find the target user
    const receiver = await this.findTargetUser(dto.receiverKingId, undefined);

    // Find active link
    const link = await this.prisma.kingConnectLink.findFirst({
      where: {
        OR: [
          { initiatorId: user.id, receiverId: receiver.id },
          { initiatorId: receiver.id, receiverId: user.id },
        ],
        status: KingConnectStatus.ACCEPTED,
      },
    });
    if (!link) throw new BadRequestException('You are not connected to this user. Send a connect request first.');

    // Check if auto-accept is enabled for this user
    const myAutoAccept =
      link.initiatorId === user.id ? link.receiverAutoAccept : link.initiatorAutoAccept;

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
        status: myAutoAccept ? SyncRequestStatus.ACCEPTED : SyncRequestStatus.PENDING,
        isVerified: myAutoAccept,
        expiresAt: this.expiresAt(),
        acceptedAt: myAutoAccept ? new Date() : null,
      },
    });

    // If auto-accepted, also create ledger entry in receiver's account with reversed type
    if (myAutoAccept) {
      await this.createReceiverLedgerEntry(receiver.id, user.id, dto.transactionType, dto.amount, dto.reason, link.id);
    }

    return syncReq;
  }

  /** Create the reversed ledger entry for the receiver when sync is accepted */
  private async createReceiverLedgerEntry(
    receiverId: string,
    senderId: string,
    transactionType: PartyLedgerEntryType,
    amount: number,
    reason: string,
    linkId: string,
  ) {
    // Find or create the receiver's Party record for the sender
    let receiverParty = await this.prisma.party.findFirst({
      where: { ownerId: receiverId, mobile: undefined },
    });

    const sender = await this.prisma.user.findUnique({ where: { id: senderId } });
    if (!sender) return;

    // Find party in receiver's account representing sender
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

    // Reverse the transaction type for the other side
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

  private reverseTransactionType(type: PartyLedgerEntryType): PartyLedgerEntryType {
    switch (type) {
      case PartyLedgerEntryType.SALE_CREDIT:
        return PartyLedgerEntryType.EXPENSE_CREDIT; // Farmer sold → Buyer owes
      case PartyLedgerEntryType.SALE_PAYMENT:
        return PartyLedgerEntryType.EXPENSE_PAYMENT; // Farmer received → Buyer paid
      case PartyLedgerEntryType.EXPENSE_CREDIT:
        return PartyLedgerEntryType.SALE_CREDIT; // Buyer bought → Farmer earned
      case PartyLedgerEntryType.EXPENSE_PAYMENT:
        return PartyLedgerEntryType.SALE_PAYMENT; // Buyer paid → Farmer received
    }
  }

  async respondToSyncRequest(user: AuthUser, syncId: string, dto: RespondSyncRequestDto) {
    const syncReq = await this.prisma.p2pLedgerSyncRequest.findUnique({
      where: { id: syncId },
      include: { link: true },
    });
    if (!syncReq) throw new NotFoundException('Sync request not found.');
    if (syncReq.receiverId !== user.id) throw new ForbiddenException('Not your request to respond to.');
    if (syncReq.status !== 'PENDING') throw new BadRequestException('This sync request has already been handled.');

    if (dto.response === 'ACCEPTED') {
      await this.createReceiverLedgerEntry(
        user.id,
        syncReq.senderId,
        syncReq.transactionType,
        Number(syncReq.amount),
        syncReq.reason,
        syncReq.linkId,
      );

      // Update trust level — increment acceptedCount
      const newCount = syncReq.link.acceptedCount + 1;
      let newTrustLevel: TrustLevel = syncReq.link.trustLevel;
      if (newCount >= 10) newTrustLevel = TrustLevel.TRUSTED;
      else if (newCount >= 3) newTrustLevel = TrustLevel.BASIC;

      await this.prisma.kingConnectLink.update({
        where: { id: syncReq.linkId },
        data: { acceptedCount: newCount, trustLevel: newTrustLevel },
      });

      return this.prisma.p2pLedgerSyncRequest.update({
        where: { id: syncId },
        data: { status: SyncRequestStatus.ACCEPTED, isVerified: true, acceptedAt: new Date() },
      });
    } else if (dto.response === 'COUNTER_PROPOSED') {
      if (!dto.counterAmount) throw new BadRequestException('counterAmount is required for a counter proposal.');
      return this.prisma.p2pLedgerSyncRequest.update({
        where: { id: syncId },
        data: {
          status: SyncRequestStatus.COUNTER_PROPOSED,
          counterAmount: dto.counterAmount,
          counterNote: dto.counterNote,
        },
      });
    } else {
      return this.prisma.p2pLedgerSyncRequest.update({
        where: { id: syncId },
        data: {
          status: SyncRequestStatus.REJECTED,
          rejectionReason: dto.rejectionReason,
          rejectedAt: new Date(),
        },
      });
    }
  }

  async listPendingSyncRequests(user: AuthUser) {
    return this.prisma.p2pLedgerSyncRequest.findMany({
      where: { receiverId: user.id, status: SyncRequestStatus.PENDING },
      include: {
        sender: { select: { id: true, name: true, kingId: true, mobile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listSyncHistory(user: AuthUser) {
    return this.prisma.p2pLedgerSyncRequest.findMany({
      where: {
        OR: [{ senderId: user.id }, { receiverId: user.id }],
        status: { not: SyncRequestStatus.PENDING },
      },
      include: {
        sender: { select: { id: true, name: true, kingId: true } },
        receiver: { select: { id: true, name: true, kingId: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  // ─── Demand Request System ────────────────────────────────────────────────

  async createDemandRequest(user: AuthUser, dto: CreateDemandRequestDto) {
    const farmer = await this.findTargetUser(dto.farmerKingId, undefined);

    const link = await this.prisma.kingConnectLink.findFirst({
      where: {
        OR: [
          { initiatorId: user.id, receiverId: farmer.id },
          { initiatorId: farmer.id, receiverId: user.id },
        ],
        status: KingConnectStatus.ACCEPTED,
      },
    });
    if (!link) throw new BadRequestException('You must be connected to this farmer to send a demand.');

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

  async respondToDemand(user: AuthUser, demandId: string, dto: RespondDemandRequestDto) {
    const demand = await this.prisma.demandRequest.findUnique({ where: { id: demandId } });
    if (!demand) throw new NotFoundException('Demand request not found.');
    if (demand.farmerId !== user.id) throw new ForbiddenException('Only the farmer can respond to demands.');
    if (demand.status !== 'PENDING') throw new BadRequestException('This demand has already been handled.');

    let newStatus: DemandStatus;
    const updateData: any = { status: newStatus! };

    if (dto.response === 'ACCEPTED') {
      newStatus = DemandStatus.ACCEPTED;
      updateData.status = newStatus;
    } else if (dto.response === 'PARTIALLY_ACCEPTED') {
      if (!dto.acceptedQty) throw new BadRequestException('acceptedQty is required for partial accept.');
      newStatus = DemandStatus.PARTIALLY_ACCEPTED;
      updateData.status = newStatus;
      updateData.acceptedQty = dto.acceptedQty;
      updateData.counterNote = dto.counterNote;
    } else {
      newStatus = DemandStatus.REJECTED;
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

  async listDemands(user: AuthUser, type: 'incoming' | 'outgoing') {
    const where =
      type === 'incoming'
        ? { farmerId: user.id, status: DemandStatus.PENDING }
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

  // ─── Payment Request System ───────────────────────────────────────────────

  async createPaymentRequest(user: AuthUser, dto: CreatePaymentRequestDto) {
    const receiver = await this.findTargetUser(dto.receiverKingId, undefined);

    const link = await this.prisma.kingConnectLink.findFirst({
      where: {
        OR: [
          { initiatorId: user.id, receiverId: receiver.id },
          { initiatorId: receiver.id, receiverId: user.id },
        ],
        status: KingConnectStatus.ACCEPTED,
      },
    });
    if (!link) throw new BadRequestException('You must be connected to send a payment request.');

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

  async respondToPaymentRequest(user: AuthUser, requestId: string, dto: RespondPaymentRequestDto) {
    const payReq = await this.prisma.kingPaymentRequest.findUnique({ where: { id: requestId } });
    if (!payReq) throw new NotFoundException('Payment request not found.');
    if (payReq.receiverId !== user.id) throw new ForbiddenException('Not your payment request to respond to.');
    if (payReq.status !== 'PENDING' && payReq.status !== 'POSTPONED') {
      throw new BadRequestException('This payment request has already been handled.');
    }

    const updateData: Partial<KingPaymentRequest> = {};

    if (dto.response === 'ACCEPTED') {
      updateData.status = PaymentRequestStatus.ACCEPTED;
      updateData.acceptedAmount = payReq.amount;
    } else if (dto.response === 'PARTIALLY_ACCEPTED') {
      if (!dto.acceptedAmount) throw new BadRequestException('acceptedAmount is required for partial accept.');
      updateData.status = PaymentRequestStatus.PARTIALLY_ACCEPTED;
      updateData.acceptedAmount = dto.acceptedAmount as any;
    } else if (dto.response === 'POSTPONED') {
      if (!dto.postponedDate) throw new BadRequestException('postponedDate is required to postpone.');
      updateData.status = PaymentRequestStatus.POSTPONED;
      updateData.postponedDate = new Date(dto.postponedDate) as any;
    } else {
      updateData.status = PaymentRequestStatus.REJECTED;
      updateData.rejectionReason = dto.rejectionReason;
    }

    return this.prisma.kingPaymentRequest.update({
      where: { id: requestId },
      data: updateData as any,
      include: {
        sender: { select: { id: true, name: true, kingId: true } },
      },
    });
  }

  async listPaymentRequests(user: AuthUser, type: 'incoming' | 'outgoing') {
    const where =
      type === 'incoming'
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

  // ─── Activity Feed (All Events) ───────────────────────────────────────────

  async getActivityFeed(user: AuthUser) {
    const [syncSent, syncReceived, demandsSent, demandsReceived, paymentsSent, paymentsReceived, connections] =
      await Promise.all([
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

    // Combine and tag all events
    const events: any[] = [
      ...syncSent.map((s) => ({ ...s, eventType: 'SYNC_SENT', direction: 'outgoing' })),
      ...syncReceived.map((s) => ({ ...s, eventType: 'SYNC_RECEIVED', direction: 'incoming' })),
      ...demandsSent.map((d) => ({ ...d, eventType: 'DEMAND_SENT', direction: 'outgoing' })),
      ...demandsReceived.map((d) => ({ ...d, eventType: 'DEMAND_RECEIVED', direction: 'incoming' })),
      ...paymentsSent.map((p) => ({ ...p, eventType: 'PAYMENT_REQUEST_SENT', direction: 'outgoing' })),
      ...paymentsReceived.map((p) => ({ ...p, eventType: 'PAYMENT_REQUEST_RECEIVED', direction: 'incoming' })),
      ...connections.map((c) => ({ ...c, eventType: 'CONNECTION', direction: 'both' })),
    ];

    // Sort by createdAt descending
    events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return events.slice(0, 80);
  }

  // ─── Shared Ledger PDF Data ───────────────────────────────────────────────

  async getSharedLedger(user: AuthUser, linkId: string) {
    const link = await this.prisma.kingConnectLink.findUnique({
      where: { id: linkId },
      include: {
        initiator: { select: { id: true, name: true, kingId: true, mobile: true } },
        receiver: { select: { id: true, name: true, kingId: true, mobile: true } },
      },
    });
    if (!link) throw new NotFoundException('Connection not found.');
    if (link.initiatorId !== user.id && link.receiverId !== user.id) {
      throw new ForbiddenException('Not your connection.');
    }

    const syncRequests = await this.prisma.p2pLedgerSyncRequest.findMany({
      where: { linkId, status: SyncRequestStatus.ACCEPTED },
      include: {
        sender: { select: { name: true, kingId: true } },
        receiver: { select: { name: true, kingId: true } },
      },
      orderBy: { acceptedAt: 'asc' },
    });

    const paymentRequests = await this.prisma.kingPaymentRequest.findMany({
      where: {
        linkId,
        status: { in: [PaymentRequestStatus.ACCEPTED, PaymentRequestStatus.PARTIALLY_ACCEPTED] },
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

  // ─── Expiry Cleanup (to be called via cron) ───────────────────────────────

  async expireStaleRequests() {
    const now = new Date();
    const [syncs, demands, payments] = await Promise.all([
      this.prisma.p2pLedgerSyncRequest.updateMany({
        where: { status: SyncRequestStatus.PENDING, expiresAt: { lt: now } },
        data: { status: SyncRequestStatus.EXPIRED },
      }),
      this.prisma.demandRequest.updateMany({
        where: { status: DemandStatus.PENDING, expiresAt: { lt: now } },
        data: { status: DemandStatus.EXPIRED },
      }),
      this.prisma.kingPaymentRequest.updateMany({
        where: { status: PaymentRequestStatus.PENDING, expiresAt: { lt: now } },
        data: { status: PaymentRequestStatus.EXPIRED },
      }),
    ]);
    return { syncs: syncs.count, demands: demands.count, payments: payments.count };
  }
}
