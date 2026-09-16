import type { AuthUser } from '../../common/types/auth-user.type';
import { LabourService } from './labour.service';
import { CreateLabourWorkerDto, UpdateLabourWorkerDto } from './dto/create-labour-worker.dto';
import { CreateWorkEntryDto } from './dto/create-work-entry.dto';
import { CreateLabourPaymentDto } from './dto/create-labour-payment.dto';
export declare class LabourController {
    private readonly labourService;
    constructor(labourService: LabourService);
    getLabourDashboard(user: AuthUser): Promise<{
        worker: {
            id: string;
            name: string;
            mobile: string | null;
            address: string | null;
            defaultRate: import("@prisma/client/runtime/library").Decimal | null;
            defaultUnit: string | null;
            farmer: {
                id: string;
                mobile: string;
                name: string;
                village: string | null;
                photoUrl: string | null;
            };
        };
        summary: {
            totalEarned: number;
            totalPaid: number;
            pendingBalance: number;
        };
        workEntries: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            farmerId: string;
            notes: string | null;
            farmId: string | null;
            cropCycleId: string | null;
            quantity: number;
            plotId: string | null;
            unit: string;
            recordedById: string;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            workerId: string;
            workType: string;
            workDate: Date;
            rate: import("@prisma/client/runtime/library").Decimal;
        }[];
        payments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            farmerId: string;
            notes: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
            recordedById: string;
            paymentDate: Date;
            workerId: string;
        }[];
    }>;
    createWorker(user: AuthUser, dto: CreateLabourWorkerDto): Promise<{
        user: {
            id: string;
            mobile: string;
        } | null;
    } & {
        id: string;
        mobile: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        notes: string | null;
        farmId: string | null;
        userId: string | null;
        address: string | null;
        defaultDailyWage: import("@prisma/client/runtime/library").Decimal | null;
        defaultRate: import("@prisma/client/runtime/library").Decimal | null;
        defaultUnit: string | null;
    }>;
    getWorkers(user: AuthUser): Promise<{
        totalEarned: number;
        totalPaid: number;
        pendingBalance: number;
        id: string;
        mobile: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        notes: string | null;
        farmId: string | null;
        userId: string | null;
        address: string | null;
        defaultDailyWage: import("@prisma/client/runtime/library").Decimal | null;
        defaultRate: import("@prisma/client/runtime/library").Decimal | null;
        defaultUnit: string | null;
    }[]>;
    updateWorker(user: AuthUser, id: string, dto: UpdateLabourWorkerDto): Promise<{
        id: string;
        mobile: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        notes: string | null;
        farmId: string | null;
        userId: string | null;
        address: string | null;
        defaultDailyWage: import("@prisma/client/runtime/library").Decimal | null;
        defaultRate: import("@prisma/client/runtime/library").Decimal | null;
        defaultUnit: string | null;
    }>;
    deleteWorker(user: AuthUser, id: string): Promise<{
        id: string;
        mobile: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        notes: string | null;
        farmId: string | null;
        userId: string | null;
        address: string | null;
        defaultDailyWage: import("@prisma/client/runtime/library").Decimal | null;
        defaultRate: import("@prisma/client/runtime/library").Decimal | null;
        defaultUnit: string | null;
    }>;
    createWorkEntry(user: AuthUser, dto: CreateWorkEntryDto): Promise<{
        worker: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        notes: string | null;
        farmId: string | null;
        cropCycleId: string | null;
        quantity: number;
        plotId: string | null;
        unit: string;
        recordedById: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        workerId: string;
        workType: string;
        workDate: Date;
        rate: import("@prisma/client/runtime/library").Decimal;
    }>;
    getWorkEntries(user: AuthUser, workerId?: string): Promise<({
        worker: {
            id: string;
            mobile: string | null;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        notes: string | null;
        farmId: string | null;
        cropCycleId: string | null;
        quantity: number;
        plotId: string | null;
        unit: string;
        recordedById: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        workerId: string;
        workType: string;
        workDate: Date;
        rate: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    createPayment(user: AuthUser, dto: CreateLabourPaymentDto): Promise<{
        worker: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        recordedById: string;
        paymentDate: Date;
        workerId: string;
    }>;
    getPayments(user: AuthUser, workerId?: string): Promise<({
        worker: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        recordedById: string;
        paymentDate: Date;
        workerId: string;
    })[]>;
    getWorkerStatement(user: AuthUser, workerId: string): Promise<{
        worker: {
            id: string;
            mobile: string | null;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            farmerId: string;
            notes: string | null;
            farmId: string | null;
            userId: string | null;
            address: string | null;
            defaultDailyWage: import("@prisma/client/runtime/library").Decimal | null;
            defaultRate: import("@prisma/client/runtime/library").Decimal | null;
            defaultUnit: string | null;
        };
        totalEarned: number;
        totalPaid: number;
        pendingBalance: number;
        timeline: {
            runningBalance: number;
            id: string;
            type: string;
            date: Date;
            title: string;
            description: string;
            amount: number;
            notes: string | null;
        }[];
        workEntries: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            farmerId: string;
            notes: string | null;
            farmId: string | null;
            cropCycleId: string | null;
            quantity: number;
            plotId: string | null;
            unit: string;
            recordedById: string;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            workerId: string;
            workType: string;
            workDate: Date;
            rate: import("@prisma/client/runtime/library").Decimal;
        }[];
        payments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            farmerId: string;
            notes: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
            recordedById: string;
            paymentDate: Date;
            workerId: string;
        }[];
    }>;
}
