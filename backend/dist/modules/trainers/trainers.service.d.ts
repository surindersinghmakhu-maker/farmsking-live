import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { WhatsappBotService } from '../whatsapp/whatsapp.service';
import { AuthUser } from '../../common/types/auth-user.type';
export declare class TrainersService {
    private readonly prisma;
    private readonly walletService;
    private readonly whatsappBotService;
    constructor(prisma: PrismaService, walletService: WalletService, whatsappBotService: WhatsappBotService);
    autoAssignFarmer(farmerId: string, state?: string | null, district?: string | null): Promise<{
        id: string;
        district: string | null;
        state: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.TrainingStatus;
        farmerId: string;
        rating: number | null;
        payoutAmount: number;
        trainerId: string;
        isCallRequested: boolean;
        preferredCallSlot: string | null;
        callRequestedAt: Date | null;
        calledAt: Date | null;
        isForwarded: boolean;
        forwardedToId: string | null;
        forwardReason: string | null;
        verificationCode: string | null;
        callNotes: string | null;
        payoutTxId: string | null;
        verifiedAt: Date | null;
    } | null>;
    getMyAssignedFarmers(user: AuthUser): Promise<({
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
            village: string | null;
            district: string | null;
            state: string | null;
            sprayTankSizeL: number | null;
            upiId: string | null;
            createdAt: Date;
        };
    } & {
        id: string;
        district: string | null;
        state: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.TrainingStatus;
        farmerId: string;
        rating: number | null;
        payoutAmount: number;
        trainerId: string;
        isCallRequested: boolean;
        preferredCallSlot: string | null;
        callRequestedAt: Date | null;
        calledAt: Date | null;
        isForwarded: boolean;
        forwardedToId: string | null;
        forwardReason: string | null;
        verificationCode: string | null;
        callNotes: string | null;
        payoutTxId: string | null;
        verifiedAt: Date | null;
    })[]>;
    sendVerificationCode(trainerUser: AuthUser, farmerId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyTrainingWithCode(trainerUser: AuthUser, farmerId: string, inputCode: string, notes?: string): Promise<{
        success: boolean;
        rewardAmount: number;
        message: string;
        trainingLog: {
            id: string;
            district: string | null;
            state: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.TrainingStatus;
            farmerId: string;
            rating: number | null;
            payoutAmount: number;
            trainerId: string;
            isCallRequested: boolean;
            preferredCallSlot: string | null;
            callRequestedAt: Date | null;
            calledAt: Date | null;
            isForwarded: boolean;
            forwardedToId: string | null;
            forwardReason: string | null;
            verificationCode: string | null;
            callNotes: string | null;
            payoutTxId: string | null;
            verifiedAt: Date | null;
        };
    }>;
    farmerInAppVerify(farmerUser: AuthUser, rating: number, notes?: string): Promise<{
        success: boolean;
        message: string;
        rewardAmount?: undefined;
        log?: undefined;
    } | {
        success: boolean;
        rewardAmount: number;
        message: string;
        log: {
            id: string;
            district: string | null;
            state: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.TrainingStatus;
            farmerId: string;
            rating: number | null;
            payoutAmount: number;
            trainerId: string;
            isCallRequested: boolean;
            preferredCallSlot: string | null;
            callRequestedAt: Date | null;
            calledAt: Date | null;
            isForwarded: boolean;
            forwardedToId: string | null;
            forwardReason: string | null;
            verificationCode: string | null;
            callNotes: string | null;
            payoutTxId: string | null;
            verifiedAt: Date | null;
        };
    }>;
    getFarmerPendingTrainingBanner(farmerUser: AuthUser): Promise<{
        hasPending: boolean;
        training: null;
    } | {
        hasPending: boolean;
        training: {
            id: string;
            trainerName: string;
            trainerMobile: string;
            status: "PENDING_CALL" | "IN_PROGRESS" | "WAITING_VERIFICATION" | "UNREACHABLE";
        };
    }>;
    assignTrainerState(adminUser: AuthUser, trainerId: string, state: string, district?: string, commissionRate?: number): Promise<{
        id: string;
        district: string | null;
        state: string;
        createdAt: Date;
        updatedAt: Date;
        level: import(".prisma/client").$Enums.TrainerLevel;
        trainerId: string;
        uplineTrainerId: string | null;
        grade: import(".prisma/client").$Enums.TrainerGrade;
        averageRating: number;
        commissionRate: number;
        isAvailable: boolean;
        availableFrom: string | null;
        availableTo: string | null;
        shiftType: string | null;
    }>;
    listTrainerAssignments(): Promise<({
        trainer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
            district: string | null;
            state: string | null;
        };
    } & {
        id: string;
        district: string | null;
        state: string;
        createdAt: Date;
        updatedAt: Date;
        level: import(".prisma/client").$Enums.TrainerLevel;
        trainerId: string;
        uplineTrainerId: string | null;
        grade: import(".prisma/client").$Enums.TrainerGrade;
        averageRating: number;
        commissionRate: number;
        isAvailable: boolean;
        availableFrom: string | null;
        availableTo: string | null;
        shiftType: string | null;
    })[]>;
    requestTrainerCall(farmerUser: AuthUser, preferredSlot?: string): Promise<{
        success: boolean;
        message: string;
        log: {
            id: string;
            district: string | null;
            state: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.TrainingStatus;
            farmerId: string;
            rating: number | null;
            payoutAmount: number;
            trainerId: string;
            isCallRequested: boolean;
            preferredCallSlot: string | null;
            callRequestedAt: Date | null;
            calledAt: Date | null;
            isForwarded: boolean;
            forwardedToId: string | null;
            forwardReason: string | null;
            verificationCode: string | null;
            callNotes: string | null;
            payoutTxId: string | null;
            verifiedAt: Date | null;
        };
    }>;
    forwardToUplineTrainer(trainerUser: AuthUser, farmerId: string, forwardReason: string): Promise<{
        success: boolean;
        message: string;
        log: {
            id: string;
            district: string | null;
            state: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.TrainingStatus;
            farmerId: string;
            rating: number | null;
            payoutAmount: number;
            trainerId: string;
            isCallRequested: boolean;
            preferredCallSlot: string | null;
            callRequestedAt: Date | null;
            calledAt: Date | null;
            isForwarded: boolean;
            forwardedToId: string | null;
            forwardReason: string | null;
            verificationCode: string | null;
            callNotes: string | null;
            payoutTxId: string | null;
            verifiedAt: Date | null;
        };
    }>;
    updateTrainerAvailability(trainerUser: AuthUser, isAvailable: boolean, availableFrom?: string, availableTo?: string, shiftType?: string): Promise<{
        id: string;
        district: string | null;
        state: string;
        createdAt: Date;
        updatedAt: Date;
        level: import(".prisma/client").$Enums.TrainerLevel;
        trainerId: string;
        uplineTrainerId: string | null;
        grade: import(".prisma/client").$Enums.TrainerGrade;
        averageRating: number;
        commissionRate: number;
        isAvailable: boolean;
        availableFrom: string | null;
        availableTo: string | null;
        shiftType: string | null;
    }>;
    getAdminTrainerReports(): Promise<{
        summary: {
            totalTrainers: number;
            totalLogs: number;
            pendingCalls: number;
            verifiedLogs: number;
            totalPayoutDisbursed: number;
        };
        logs: ({
            farmer: {
                kingId: string | null;
                mobile: string;
                name: string;
                district: string | null;
                state: string | null;
            };
            trainer: {
                kingId: string | null;
                mobile: string;
                name: string;
            };
            forwardedTo: {
                mobile: string;
                name: string;
            } | null;
        } & {
            id: string;
            district: string | null;
            state: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.TrainingStatus;
            farmerId: string;
            rating: number | null;
            payoutAmount: number;
            trainerId: string;
            isCallRequested: boolean;
            preferredCallSlot: string | null;
            callRequestedAt: Date | null;
            calledAt: Date | null;
            isForwarded: boolean;
            forwardedToId: string | null;
            forwardReason: string | null;
            verificationCode: string | null;
            callNotes: string | null;
            payoutTxId: string | null;
            verifiedAt: Date | null;
        })[];
    }>;
}
