import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../../common/types/auth-user.type';
import { CreateLabourWorkerDto, UpdateLabourWorkerDto } from './dto/create-labour-worker.dto';
import { CreateWorkEntryDto } from './dto/create-work-entry.dto';
import { CreateLabourPaymentDto } from './dto/create-labour-payment.dto';
export declare class LabourService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    searchByMobile(mobile: string): Promise<{
        exists: boolean;
        user: null;
        profiles: never[];
    } | {
        exists: boolean;
        user: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
            village: string | null;
            district: string | null;
            state: string | null;
            photoUrl: string | null;
        };
        profiles: any[];
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
        photoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
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
    getWorkersForFarmer(user: AuthUser): Promise<{
        totalEarned: number;
        totalPaid: number;
        pendingBalance: number;
        id: string;
        mobile: string | null;
        name: string;
        photoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
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
        id: string;
        mobile: string | null;
        name: string;
        photoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
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
        id: string;
        mobile: string | null;
        name: string;
        photoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
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
    createWorkEntry(farmerId: string, recordedById: string, dto: CreateWorkEntryDto): Promise<{
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
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        recordedById: string;
        quantity: number;
        unit: string;
        farmId: string | null;
        plotId: string | null;
        cropCycleId: string | null;
        workerId: string;
        workType: string;
        workDate: Date;
        rate: import("@prisma/client/runtime/library").Decimal;
    }>;
    getWorkEntries(farmerId: string, workerId?: string): Promise<({
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
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        recordedById: string;
        quantity: number;
        unit: string;
        farmId: string | null;
        plotId: string | null;
        cropCycleId: string | null;
        workerId: string;
        workType: string;
        workDate: Date;
        rate: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    createPayment(farmerId: string, recordedById: string, dto: CreateLabourPaymentDto): Promise<{
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
    getPayments(farmerId: string, workerId?: string): Promise<({
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
    getWorkerStatement(farmerId: string, workerId: string): Promise<{
        worker: {
            id: string;
            mobile: string | null;
            name: string;
            photoUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            farmerId: string;
            notes: string | null;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            recordedById: string;
            quantity: number;
            unit: string;
            farmId: string | null;
            plotId: string | null;
            cropCycleId: string | null;
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
    getLabourDashboard(userId: string): Promise<{
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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            farmerId: string;
            notes: string | null;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            recordedById: string;
            quantity: number;
            unit: string;
            farmId: string | null;
            plotId: string | null;
            cropCycleId: string | null;
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
                id: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                farmerId: string;
                notes: string | null;
                totalAmount: import("@prisma/client/runtime/library").Decimal;
                recordedById: string;
                quantity: number;
                unit: string;
                farmId: string | null;
                plotId: string | null;
                cropCycleId: string | null;
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
        }[];
    }>;
}
