import { KingConnectService } from './king-connect.service';
import type { AuthUser } from '../../common/types/auth-user.type';
import { SendConnectRequestDto } from './dto/send-connect-request.dto';
import { RespondConnectDto } from './dto/respond-connect.dto';
import { CreateSyncRequestDto } from './dto/create-sync-request.dto';
import { RespondSyncRequestDto } from './dto/respond-sync-request.dto';
import { CreateDemandRequestDto } from './dto/create-demand-request.dto';
import { RespondDemandRequestDto } from './dto/respond-demand-request.dto';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { RespondPaymentRequestDto } from './dto/respond-payment-request.dto';
export declare class KingConnectController {
    private readonly service;
    constructor(service: KingConnectService);
    sendConnectRequest(user: AuthUser, dto: SendConnectRequestDto): Promise<{
        receiver: {
            name: string;
            mobile: string;
            id: string;
            kingId: string | null;
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
    listPendingConnections(user: AuthUser): Promise<({
        initiator: {
            name: string;
            mobile: string;
            id: string;
            kingId: string | null;
            role: import(".prisma/client").$Enums.Role;
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
    respondToConnect(user: AuthUser, id: string, dto: RespondConnectDto): Promise<{
        initiator: {
            name: string;
            id: string;
            kingId: string | null;
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
    listConnections(user: AuthUser): Promise<({
        receiver: {
            name: string;
            mobile: string;
            id: string;
            kingId: string | null;
            role: import(".prisma/client").$Enums.Role;
        };
        initiator: {
            name: string;
            mobile: string;
            id: string;
            kingId: string | null;
            role: import(".prisma/client").$Enums.Role;
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
    toggleAutoAccept(user: AuthUser, id: string): Promise<{
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
    createSyncRequest(user: AuthUser, dto: CreateSyncRequestDto): Promise<{
        senderId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SyncRequestStatus;
        rejectionReason: string | null;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        expiresAt: Date;
        reason: string;
        transactionType: import(".prisma/client").$Enums.PartyLedgerEntryType;
        rejectedAt: Date | null;
        receiverId: string;
        linkId: string;
        refBillNo: string | null;
        counterAmount: import("@prisma/client/runtime/library").Decimal | null;
        counterNote: string | null;
        isVerified: boolean;
        acceptedAt: Date | null;
    }>;
    listPendingSync(user: AuthUser): Promise<({
        sender: {
            name: string;
            mobile: string;
            id: string;
            kingId: string | null;
        };
    } & {
        senderId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SyncRequestStatus;
        rejectionReason: string | null;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        expiresAt: Date;
        reason: string;
        transactionType: import(".prisma/client").$Enums.PartyLedgerEntryType;
        rejectedAt: Date | null;
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
            name: string;
            id: string;
            kingId: string | null;
        };
        receiver: {
            name: string;
            id: string;
            kingId: string | null;
        };
    } & {
        senderId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SyncRequestStatus;
        rejectionReason: string | null;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        expiresAt: Date;
        reason: string;
        transactionType: import(".prisma/client").$Enums.PartyLedgerEntryType;
        rejectedAt: Date | null;
        receiverId: string;
        linkId: string;
        refBillNo: string | null;
        counterAmount: import("@prisma/client/runtime/library").Decimal | null;
        counterNote: string | null;
        isVerified: boolean;
        acceptedAt: Date | null;
    })[]>;
    respondToSync(user: AuthUser, id: string, dto: RespondSyncRequestDto): Promise<{
        senderId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SyncRequestStatus;
        rejectionReason: string | null;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        expiresAt: Date;
        reason: string;
        transactionType: import(".prisma/client").$Enums.PartyLedgerEntryType;
        rejectedAt: Date | null;
        receiverId: string;
        linkId: string;
        refBillNo: string | null;
        counterAmount: import("@prisma/client/runtime/library").Decimal | null;
        counterNote: string | null;
        isVerified: boolean;
        acceptedAt: Date | null;
    }>;
    createDemand(user: AuthUser, dto: CreateDemandRequestDto): Promise<{
        farmer: {
            name: string;
            id: string;
            kingId: string | null;
        };
        requester: {
            name: string;
            id: string;
            kingId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.DemandStatus;
        rejectionReason: string | null;
        notes: string | null;
        quantity: number;
        unit: string;
        farmerId: string;
        expiresAt: Date;
        orderId: string | null;
        cropName: string;
        linkId: string;
        counterNote: string | null;
        requesterId: string;
        offeredPrice: import("@prisma/client/runtime/library").Decimal | null;
        requiredByDate: Date | null;
        acceptedQty: number | null;
    }>;
    listDemands(user: AuthUser, type?: 'incoming' | 'outgoing'): Promise<({
        farmer: {
            name: string;
            mobile: string;
            id: string;
            kingId: string | null;
        };
        requester: {
            name: string;
            mobile: string;
            id: string;
            kingId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.DemandStatus;
        rejectionReason: string | null;
        notes: string | null;
        quantity: number;
        unit: string;
        farmerId: string;
        expiresAt: Date;
        orderId: string | null;
        cropName: string;
        linkId: string;
        counterNote: string | null;
        requesterId: string;
        offeredPrice: import("@prisma/client/runtime/library").Decimal | null;
        requiredByDate: Date | null;
        acceptedQty: number | null;
    })[]>;
    respondToDemand(user: AuthUser, id: string, dto: RespondDemandRequestDto): Promise<{
        requester: {
            name: string;
            id: string;
            kingId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.DemandStatus;
        rejectionReason: string | null;
        notes: string | null;
        quantity: number;
        unit: string;
        farmerId: string;
        expiresAt: Date;
        orderId: string | null;
        cropName: string;
        linkId: string;
        counterNote: string | null;
        requesterId: string;
        offeredPrice: import("@prisma/client/runtime/library").Decimal | null;
        requiredByDate: Date | null;
        acceptedQty: number | null;
    }>;
    createPaymentRequest(user: AuthUser, dto: CreatePaymentRequestDto): Promise<{
        sender: {
            name: string;
            id: string;
            kingId: string | null;
        };
        receiver: {
            name: string;
            id: string;
            kingId: string | null;
        };
    } & {
        senderId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PaymentRequestStatus;
        rejectionReason: string | null;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        expiresAt: Date;
        reason: string;
        receiverId: string;
        linkId: string;
        refBillNo: string | null;
        acceptedAmount: import("@prisma/client/runtime/library").Decimal | null;
        dueDate: Date | null;
        postponedDate: Date | null;
    }>;
    listPaymentRequests(user: AuthUser, type?: 'incoming' | 'outgoing'): Promise<({
        sender: {
            name: string;
            mobile: string;
            id: string;
            kingId: string | null;
        };
        receiver: {
            name: string;
            mobile: string;
            id: string;
            kingId: string | null;
        };
    } & {
        senderId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PaymentRequestStatus;
        rejectionReason: string | null;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        expiresAt: Date;
        reason: string;
        receiverId: string;
        linkId: string;
        refBillNo: string | null;
        acceptedAmount: import("@prisma/client/runtime/library").Decimal | null;
        dueDate: Date | null;
        postponedDate: Date | null;
    })[]>;
    respondToPaymentRequest(user: AuthUser, id: string, dto: RespondPaymentRequestDto): Promise<{
        sender: {
            name: string;
            id: string;
            kingId: string | null;
        };
    } & {
        senderId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PaymentRequestStatus;
        rejectionReason: string | null;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        expiresAt: Date;
        reason: string;
        receiverId: string;
        linkId: string;
        refBillNo: string | null;
        acceptedAmount: import("@prisma/client/runtime/library").Decimal | null;
        dueDate: Date | null;
        postponedDate: Date | null;
    }>;
    getActivity(user: AuthUser): Promise<any[]>;
    getSharedLedger(user: AuthUser, linkId: string): Promise<{
        link: {
            receiver: {
                name: string;
                mobile: string;
                id: string;
                kingId: string | null;
            };
            initiator: {
                name: string;
                mobile: string;
                id: string;
                kingId: string | null;
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
                name: string;
                kingId: string | null;
            };
            receiver: {
                name: string;
                kingId: string | null;
            };
        } & {
            senderId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.SyncRequestStatus;
            rejectionReason: string | null;
            notes: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            expiresAt: Date;
            reason: string;
            transactionType: import(".prisma/client").$Enums.PartyLedgerEntryType;
            rejectedAt: Date | null;
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
                name: string;
                kingId: string | null;
            };
            receiver: {
                name: string;
                kingId: string | null;
            };
        } & {
            senderId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PaymentRequestStatus;
            rejectionReason: string | null;
            notes: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            expiresAt: Date;
            reason: string;
            receiverId: string;
            linkId: string;
            refBillNo: string | null;
            acceptedAmount: import("@prisma/client/runtime/library").Decimal | null;
            dueDate: Date | null;
            postponedDate: Date | null;
        })[];
        generatedAt: Date;
    }>;
    expireStale(): Promise<{
        syncs: number;
        demands: number;
        payments: number;
    }>;
}
