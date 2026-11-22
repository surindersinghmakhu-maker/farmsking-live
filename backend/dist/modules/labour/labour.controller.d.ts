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
            mobile: string;
            address: null;
            photoUrl: string | null;
            relation: string;
            defaultRate: null;
            defaultUnit: string;
            farmer: null;
        };
        summary: {
            totalEarned: number;
            totalPaid: number;
            pendingBalance: number;
        };
        workEntries: never[];
        payments: never[];
        profiles: {
            worker: {
                id: string;
                name: string;
                mobile: string;
                address: null;
                photoUrl: string | null;
                relation: string;
                defaultRate: null;
                defaultUnit: string;
                farmer: null;
            };
            summary: {
                totalEarned: number;
                totalPaid: number;
                pendingBalance: number;
            };
            workEntries: never[];
            payments: never[];
        }[];
    } | {
        worker: {
            id: string;
            name: string;
            mobile: string | null;
            address: string | null;
            photoUrl: string | null;
            relation: string | null;
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
            deletedAt: Date | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            farmerId: string;
            notes: string | null;
            cropCycleId: string | null;
            plotId: string | null;
            unit: string;
            farmId: string | null;
            rate: import("@prisma/client/runtime/library").Decimal;
            recordedById: string;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            workerId: string;
            workType: string;
            workDate: Date;
        }[];
        payments: {
            deletedAt: Date | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            farmerId: string;
            notes: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            recordedById: string;
            paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
            paymentDate: Date;
            workerId: string;
        }[];
        profiles: {
            worker: {
                id: string;
                name: string;
                mobile: string | null;
                address: string | null;
                photoUrl: string | null;
                relation: string | null;
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
                deletedAt: Date | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                farmerId: string;
                notes: string | null;
                cropCycleId: string | null;
                plotId: string | null;
                unit: string;
                farmId: string | null;
                rate: import("@prisma/client/runtime/library").Decimal;
                recordedById: string;
                totalAmount: import("@prisma/client/runtime/library").Decimal;
                quantity: number;
                workerId: string;
                workType: string;
                workDate: Date;
            }[];
            payments: {
                deletedAt: Date | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                farmerId: string;
                notes: string | null;
                amount: import("@prisma/client/runtime/library").Decimal;
                recordedById: string;
                paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
                paymentDate: Date;
                workerId: string;
            }[];
        }[];
    }>;
    searchByMobile(mobile: string): Promise<{
        exists: boolean;
        user: {
            id: string;
            kingId: string | null;
            name: string;
            photoUrl: string | null;
        } | null;
        profiles: any[];
    }>;
    createWorker(user: AuthUser, dto: CreateLabourWorkerDto): Promise<{
        user: {
            id: string;
            mobile: string;
        } | null;
    } & {
        deletedAt: Date | null;
        id: string;
        mobile: string | null;
        name: string;
        photoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        farmerId: string;
        notes: string | null;
        userId: string | null;
        farmId: string | null;
        address: string | null;
        relation: string | null;
        defaultDailyWage: import("@prisma/client/runtime/library").Decimal | null;
        defaultRate: import("@prisma/client/runtime/library").Decimal | null;
        defaultUnit: string | null;
    }>;
    getWorkers(user: AuthUser): Promise<{
        totalEarned: number;
        totalPaid: number;
        pendingBalance: number;
        deletedAt: Date | null;
        id: string;
        mobile: string | null;
        name: string;
        photoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        farmerId: string;
        notes: string | null;
        userId: string | null;
        farmId: string | null;
        address: string | null;
        relation: string | null;
        defaultDailyWage: import("@prisma/client/runtime/library").Decimal | null;
        defaultRate: import("@prisma/client/runtime/library").Decimal | null;
        defaultUnit: string | null;
    }[]>;
    updateWorker(user: AuthUser, id: string, dto: UpdateLabourWorkerDto): Promise<{
        user: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
            photoUrl: string | null;
        } | null;
    } & {
        deletedAt: Date | null;
        id: string;
        mobile: string | null;
        name: string;
        photoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        farmerId: string;
        notes: string | null;
        userId: string | null;
        farmId: string | null;
        address: string | null;
        relation: string | null;
        defaultDailyWage: import("@prisma/client/runtime/library").Decimal | null;
        defaultRate: import("@prisma/client/runtime/library").Decimal | null;
        defaultUnit: string | null;
    }>;
    deleteWorker(user: AuthUser, id: string): Promise<{
        deletedAt: Date | null;
        id: string;
        mobile: string | null;
        name: string;
        photoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        farmerId: string;
        notes: string | null;
        userId: string | null;
        farmId: string | null;
        address: string | null;
        relation: string | null;
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
        deletedAt: Date | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        farmerId: string;
        notes: string | null;
        cropCycleId: string | null;
        plotId: string | null;
        unit: string;
        farmId: string | null;
        rate: import("@prisma/client/runtime/library").Decimal;
        recordedById: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        quantity: number;
        workerId: string;
        workType: string;
        workDate: Date;
    }>;
    getWorkEntries(user: AuthUser, workerId?: string): Promise<({
        worker: {
            id: string;
            mobile: string | null;
            name: string;
        };
    } & {
        deletedAt: Date | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        farmerId: string;
        notes: string | null;
        cropCycleId: string | null;
        plotId: string | null;
        unit: string;
        farmId: string | null;
        rate: import("@prisma/client/runtime/library").Decimal;
        recordedById: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        quantity: number;
        workerId: string;
        workType: string;
        workDate: Date;
    })[]>;
    createPayment(user: AuthUser, dto: CreateLabourPaymentDto): Promise<{
        worker: {
            id: string;
            name: string;
        };
    } & {
        deletedAt: Date | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        farmerId: string;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        recordedById: string;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        paymentDate: Date;
        workerId: string;
    }>;
    getPayments(user: AuthUser, workerId?: string): Promise<({
        worker: {
            id: string;
            name: string;
        };
    } & {
        deletedAt: Date | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        farmerId: string;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        recordedById: string;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        paymentDate: Date;
        workerId: string;
    })[]>;
    getWorkerStatement(user: AuthUser, workerId: string): Promise<{
        worker: {
            deletedAt: Date | null;
            id: string;
            mobile: string | null;
            name: string;
            photoUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            farmerId: string;
            notes: string | null;
            userId: string | null;
            farmId: string | null;
            address: string | null;
            relation: string | null;
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
            deletedAt: Date | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            farmerId: string;
            notes: string | null;
            cropCycleId: string | null;
            plotId: string | null;
            unit: string;
            farmId: string | null;
            rate: import("@prisma/client/runtime/library").Decimal;
            recordedById: string;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            workerId: string;
            workType: string;
            workDate: Date;
        }[];
        payments: {
            deletedAt: Date | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            farmerId: string;
            notes: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            recordedById: string;
            paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
            paymentDate: Date;
            workerId: string;
        }[];
    }>;
}
