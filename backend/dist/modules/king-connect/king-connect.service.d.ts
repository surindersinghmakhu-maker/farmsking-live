import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { SendConnectRequestDto } from './dto/send-connect-request.dto';
import { RespondConnectDto } from './dto/respond-connect.dto';
import { CreateSyncRequestDto } from './dto/create-sync-request.dto';
import { RespondSyncRequestDto } from './dto/respond-sync-request.dto';
import { CreateDemandRequestDto } from './dto/create-demand-request.dto';
import { RespondDemandRequestDto } from './dto/respond-demand-request.dto';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { RespondPaymentRequestDto } from './dto/respond-payment-request.dto';
export declare class KingConnectService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private findTargetUser;
    private getOrCreateLink;
    sendConnectRequest(user: AuthUser, dto: SendConnectRequestDto): Promise<{
        receiver: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.KingConnectStatus;
        receiverId: string;
        initiatorId: string;
        trustLevel: import(".prisma/client").$Enums.TrustLevel;
        initiatorAutoAccept: boolean;
        receiverAutoAccept: boolean;
        acceptedCount: number;
    }>;
    respondToConnect(user: AuthUser, linkId: string, dto: RespondConnectDto): Promise<{
        initiator: {
            id: string;
            kingId: string | null;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.KingConnectStatus;
        receiverId: string;
        initiatorId: string;
        trustLevel: import(".prisma/client").$Enums.TrustLevel;
        initiatorAutoAccept: boolean;
        receiverAutoAccept: boolean;
        acceptedCount: number;
    }>;
    listMyConnections(user: AuthUser): Promise<({
        receiver: {
            id: string;
            kingId: string | null;
            mobile: string;
            role: import(".prisma/client").$Enums.Role;
            name: string;
        };
        initiator: {
            id: string;
            kingId: string | null;
            mobile: string;
            role: import(".prisma/client").$Enums.Role;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.KingConnectStatus;
        receiverId: string;
        initiatorId: string;
        trustLevel: import(".prisma/client").$Enums.TrustLevel;
        initiatorAutoAccept: boolean;
        receiverAutoAccept: boolean;
        acceptedCount: number;
    })[]>;
    listPendingConnectionRequests(user: AuthUser): Promise<({
        initiator: {
            id: string;
            kingId: string | null;
            mobile: string;
            role: import(".prisma/client").$Enums.Role;
            name: string;
            village: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.KingConnectStatus;
        receiverId: string;
        initiatorId: string;
        trustLevel: import(".prisma/client").$Enums.TrustLevel;
        initiatorAutoAccept: boolean;
        receiverAutoAccept: boolean;
        acceptedCount: number;
    })[]>;
    toggleAutoAccept(user: AuthUser, linkId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.KingConnectStatus;
        receiverId: string;
        initiatorId: string;
        trustLevel: import(".prisma/client").$Enums.TrustLevel;
        initiatorAutoAccept: boolean;
        receiverAutoAccept: boolean;
        acceptedCount: number;
    }>;
    private expiresAt;
    createSyncRequest(user: AuthUser, dto: CreateSyncRequestDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.SyncRequestStatus;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        reason: string;
        transactionType: import(".prisma/client").$Enums.PartyLedgerEntryType;
        rejectedAt: Date | null;
        rejectionReason: string | null;
        senderId: string;
        receiverId: string;
        linkId: string;
        refBillNo: string | null;
        counterAmount: import("@prisma/client/runtime/library").Decimal | null;
        counterNote: string | null;
        isVerified: boolean;
        acceptedAt: Date | null;
    }>;
    private createReceiverLedgerEntry;
    private reverseTransactionType;
    respondToSyncRequest(user: AuthUser, syncId: string, dto: RespondSyncRequestDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.SyncRequestStatus;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        reason: string;
        transactionType: import(".prisma/client").$Enums.PartyLedgerEntryType;
        rejectedAt: Date | null;
        rejectionReason: string | null;
        senderId: string;
        receiverId: string;
        linkId: string;
        refBillNo: string | null;
        counterAmount: import("@prisma/client/runtime/library").Decimal | null;
        counterNote: string | null;
        isVerified: boolean;
        acceptedAt: Date | null;
    }>;
    listPendingSyncRequests(user: AuthUser): Promise<({
        sender: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.SyncRequestStatus;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        reason: string;
        transactionType: import(".prisma/client").$Enums.PartyLedgerEntryType;
        rejectedAt: Date | null;
        rejectionReason: string | null;
        senderId: string;
        receiverId: string;
        linkId: string;
        refBillNo: string | null;
        counterAmount: import("@prisma/client/runtime/library").Decimal | null;
        counterNote: string | null;
        isVerified: boolean;
        acceptedAt: Date | null;
    })[]>;
    listSyncHistory(user: AuthUser): Promise<({
        sender: {
            id: string;
            kingId: string | null;
            name: string;
        };
        receiver: {
            id: string;
            kingId: string | null;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.SyncRequestStatus;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        reason: string;
        transactionType: import(".prisma/client").$Enums.PartyLedgerEntryType;
        rejectedAt: Date | null;
        rejectionReason: string | null;
        senderId: string;
        receiverId: string;
        linkId: string;
        refBillNo: string | null;
        counterAmount: import("@prisma/client/runtime/library").Decimal | null;
        counterNote: string | null;
        isVerified: boolean;
        acceptedAt: Date | null;
    })[]>;
    createDemandRequest(user: AuthUser, dto: CreateDemandRequestDto): Promise<{
        farmer: {
            id: string;
            kingId: string | null;
            name: string;
        };
        requester: {
            id: string;
            kingId: string | null;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.DemandStatus;
        farmerId: string;
        notes: string | null;
        quantity: number;
        cropName: string;
        unit: string;
        rejectionReason: string | null;
        orderId: string | null;
        linkId: string;
        counterNote: string | null;
        requesterId: string;
        offeredPrice: import("@prisma/client/runtime/library").Decimal | null;
        requiredByDate: Date | null;
        acceptedQty: number | null;
    }>;
    respondToDemand(user: AuthUser, demandId: string, dto: RespondDemandRequestDto): Promise<{
        requester: {
            id: string;
            kingId: string | null;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.DemandStatus;
        farmerId: string;
        notes: string | null;
        quantity: number;
        cropName: string;
        unit: string;
        rejectionReason: string | null;
        orderId: string | null;
        linkId: string;
        counterNote: string | null;
        requesterId: string;
        offeredPrice: import("@prisma/client/runtime/library").Decimal | null;
        requiredByDate: Date | null;
        acceptedQty: number | null;
    }>;
    listDemands(user: AuthUser, type: 'incoming' | 'outgoing'): Promise<({
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
        };
        requester: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.DemandStatus;
        farmerId: string;
        notes: string | null;
        quantity: number;
        cropName: string;
        unit: string;
        rejectionReason: string | null;
        orderId: string | null;
        linkId: string;
        counterNote: string | null;
        requesterId: string;
        offeredPrice: import("@prisma/client/runtime/library").Decimal | null;
        requiredByDate: Date | null;
        acceptedQty: number | null;
    })[]>;
    createPaymentRequest(user: AuthUser, dto: CreatePaymentRequestDto): Promise<{
        sender: {
            id: string;
            kingId: string | null;
            name: string;
        };
        receiver: {
            id: string;
            kingId: string | null;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.PaymentRequestStatus;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        reason: string;
        rejectionReason: string | null;
        senderId: string;
        receiverId: string;
        linkId: string;
        refBillNo: string | null;
        acceptedAmount: import("@prisma/client/runtime/library").Decimal | null;
        dueDate: Date | null;
        postponedDate: Date | null;
    }>;
    respondToPaymentRequest(user: AuthUser, requestId: string, dto: RespondPaymentRequestDto): Promise<{
        sender: {
            id: string;
            kingId: string | null;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.PaymentRequestStatus;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        reason: string;
        rejectionReason: string | null;
        senderId: string;
        receiverId: string;
        linkId: string;
        refBillNo: string | null;
        acceptedAmount: import("@prisma/client/runtime/library").Decimal | null;
        dueDate: Date | null;
        postponedDate: Date | null;
    }>;
    listPaymentRequests(user: AuthUser, type: 'incoming' | 'outgoing'): Promise<({
        sender: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
        };
        receiver: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.PaymentRequestStatus;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        reason: string;
        rejectionReason: string | null;
        senderId: string;
        receiverId: string;
        linkId: string;
        refBillNo: string | null;
        acceptedAmount: import("@prisma/client/runtime/library").Decimal | null;
        dueDate: Date | null;
        postponedDate: Date | null;
    })[]>;
    getActivityFeed(user: AuthUser): Promise<any[]>;
    getSharedLedger(user: AuthUser, linkId: string): Promise<{
        link: {
            receiver: {
                id: string;
                kingId: string | null;
                mobile: string;
                name: string;
            };
            initiator: {
                id: string;
                kingId: string | null;
                mobile: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.KingConnectStatus;
            receiverId: string;
            initiatorId: string;
            trustLevel: import(".prisma/client").$Enums.TrustLevel;
            initiatorAutoAccept: boolean;
            receiverAutoAccept: boolean;
            acceptedCount: number;
        };
        syncRequests: ({
            sender: {
                kingId: string | null;
                name: string;
            };
            receiver: {
                kingId: string | null;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            expiresAt: Date;
            status: import(".prisma/client").$Enums.SyncRequestStatus;
            notes: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            reason: string;
            transactionType: import(".prisma/client").$Enums.PartyLedgerEntryType;
            rejectedAt: Date | null;
            rejectionReason: string | null;
            senderId: string;
            receiverId: string;
            linkId: string;
            refBillNo: string | null;
            counterAmount: import("@prisma/client/runtime/library").Decimal | null;
            counterNote: string | null;
            isVerified: boolean;
            acceptedAt: Date | null;
        })[];
        paymentRequests: ({
            sender: {
                kingId: string | null;
                name: string;
            };
            receiver: {
                kingId: string | null;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            expiresAt: Date;
            status: import(".prisma/client").$Enums.PaymentRequestStatus;
            notes: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            reason: string;
            rejectionReason: string | null;
            senderId: string;
            receiverId: string;
            linkId: string;
            refBillNo: string | null;
            acceptedAmount: import("@prisma/client/runtime/library").Decimal | null;
            dueDate: Date | null;
            postponedDate: Date | null;
        })[];
        generatedAt: Date;
    }>;
    expireStaleRequests(): Promise<{
        syncs: number;
        demands: number;
        payments: number;
    }>;
}
