import type { AuthUser } from '../../common/types/auth-user.type';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
export declare class ExpensesController {
    private readonly expensesService;
    constructor(expensesService: ExpensesService);
    listCategories(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        key: string;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        isSystem: boolean;
        sortOrder: number;
    }[]>;
    listAllCategoriesForAdmin(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        key: string;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        isSystem: boolean;
        sortOrder: number;
    }[]>;
    createCategory(dto: {
        key: string;
        labelEn: string;
        labelHi?: string;
        sortOrder?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        key: string;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        isSystem: boolean;
        sortOrder: number;
    }>;
    updateCategory(id: string, dto: {
        labelEn?: string;
        labelHi?: string;
        sortOrder?: number;
        isActive?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        key: string;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        isSystem: boolean;
        sortOrder: number;
    }>;
    deleteCategory(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        key: string;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        isSystem: boolean;
        sortOrder: number;
    }>;
    create(user: AuthUser, dto: CreateExpenseDto): Promise<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            isSystem: boolean;
            sortOrder: number;
        };
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
    } & {
        id: string;
        unit: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        plotId: string | null;
        farmId: string;
        cropCycleId: string | null;
        description: string | null;
        quantity: number | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        expenseDate: Date;
        categoryId: string;
        partyId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        vendorName: string | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    }>;
    findAllForAdmin(): import(".prisma/client").Prisma.PrismaPromise<({
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            isSystem: boolean;
            sortOrder: number;
        };
        plot: {
            id: string;
            name: string;
        } | null;
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
        farm: {
            id: string;
            name: string;
            owner: {
                id: string;
                name: string;
                village: string | null;
                district: string | null;
                state: string | null;
                mobile: string;
            };
        };
        party: {
            id: string;
            name: string;
            mobile: string | null;
        } | null;
        recordedBy: {
            id: string;
            name: string;
            village: string | null;
            district: string | null;
            state: string | null;
            mobile: string;
        };
    } & {
        id: string;
        unit: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        plotId: string | null;
        farmId: string;
        cropCycleId: string | null;
        description: string | null;
        quantity: number | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        expenseDate: Date;
        categoryId: string;
        partyId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        vendorName: string | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    })[]>;
    findAllForFarm(user: AuthUser, farmId: string): Promise<({
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            isSystem: boolean;
            sortOrder: number;
        };
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
    } & {
        id: string;
        unit: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        plotId: string | null;
        farmId: string;
        cropCycleId: string | null;
        description: string | null;
        quantity: number | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        expenseDate: Date;
        categoryId: string;
        partyId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        vendorName: string | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    })[]>;
    findOne(user: AuthUser, id: string): Promise<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            isSystem: boolean;
            sortOrder: number;
        };
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
        farm: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            name: string;
            ownerId: string;
            village: string | null;
            district: string | null;
            state: string | null;
            totalArea: number;
            areaUnit: import(".prisma/client").$Enums.AreaUnit;
            soilType: string | null;
            irrigationSource: string | null;
        };
    } & {
        id: string;
        unit: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        plotId: string | null;
        farmId: string;
        cropCycleId: string | null;
        description: string | null;
        quantity: number | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        expenseDate: Date;
        categoryId: string;
        partyId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        vendorName: string | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    }>;
    update(user: AuthUser, id: string, dto: UpdateExpenseDto): Promise<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            isSystem: boolean;
            sortOrder: number;
        };
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
    } & {
        id: string;
        unit: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        plotId: string | null;
        farmId: string;
        cropCycleId: string | null;
        description: string | null;
        quantity: number | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        expenseDate: Date;
        categoryId: string;
        partyId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        vendorName: string | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        unit: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        plotId: string | null;
        farmId: string;
        cropCycleId: string | null;
        description: string | null;
        quantity: number | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        expenseDate: Date;
        categoryId: string;
        partyId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        vendorName: string | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    }>;
}
