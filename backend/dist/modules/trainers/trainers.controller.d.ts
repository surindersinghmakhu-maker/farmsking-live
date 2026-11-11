import type { AuthUser } from '../../common/types/auth-user.type';
import { TrainersService } from './trainers.service';
export declare class TrainersController {
    private readonly trainersService;
    constructor(trainersService: TrainersService);
    getMyAssignedFarmers(user: AuthUser): Promise<({
        farmer: {
            id: string;
            createdAt: Date;
            name: string;
            upiId: string | null;
            kingId: string | null;
            mobile: string;
            village: string | null;
            district: string | null;
            state: string | null;
            sprayTankSizeL: number | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        district: string | null;
        state: string;
        status: import(".prisma/client").$Enums.TrainingStatus;
        farmerId: string;
        payoutAmount: number;
        rating: number | null;
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
    sendVerificationCode(user: AuthUser, body: {
        farmerId: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyTrainingWithCode(user: AuthUser, body: {
        farmerId: string;
        code: string;
        notes?: string;
    }): Promise<{
        success: boolean;
        rewardAmount: number;
        message: string;
        trainingLog: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            district: string | null;
            state: string;
            status: import(".prisma/client").$Enums.TrainingStatus;
            farmerId: string;
            payoutAmount: number;
            rating: number | null;
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
    getFarmerPendingTrainingBanner(user: AuthUser): Promise<{
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
    farmerInAppVerify(user: AuthUser, body: {
        rating: number;
        notes?: string;
    }): Promise<{
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
            createdAt: Date;
            updatedAt: Date;
            district: string | null;
            state: string;
            status: import(".prisma/client").$Enums.TrainingStatus;
            farmerId: string;
            payoutAmount: number;
            rating: number | null;
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
    assignTrainerState(user: AuthUser, body: {
        trainerId: string;
        state: string;
        district?: string;
        commissionRate?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        district: string | null;
        state: string;
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
            name: string;
            kingId: string | null;
            mobile: string;
            district: string | null;
            state: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        district: string | null;
        state: string;
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
    requestTrainerCall(user: AuthUser, body: {
        preferredSlot?: string;
    }): Promise<{
        success: boolean;
        message: string;
        log: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            district: string | null;
            state: string;
            status: import(".prisma/client").$Enums.TrainingStatus;
            farmerId: string;
            payoutAmount: number;
            rating: number | null;
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
    forwardToUplineTrainer(user: AuthUser, body: {
        farmerId: string;
        forwardReason: string;
    }): Promise<{
        success: boolean;
        message: string;
        log: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            district: string | null;
            state: string;
            status: import(".prisma/client").$Enums.TrainingStatus;
            farmerId: string;
            payoutAmount: number;
            rating: number | null;
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
    updateTrainerAvailability(user: AuthUser, body: {
        isAvailable: boolean;
        availableFrom?: string;
        availableTo?: string;
        shiftType?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        district: string | null;
        state: string;
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
                name: string;
                kingId: string | null;
                mobile: string;
                district: string | null;
                state: string | null;
            };
            trainer: {
                name: string;
                kingId: string | null;
                mobile: string;
            };
            forwardedTo: {
                name: string;
                mobile: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            district: string | null;
            state: string;
            status: import(".prisma/client").$Enums.TrainingStatus;
            farmerId: string;
            payoutAmount: number;
            rating: number | null;
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
