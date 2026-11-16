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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmId: string;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        description: string | null;
        cropCycleId: string | null;
        plotId: string | null;
        unit: string | null;
        partyId: string | null;
        expenseDate: Date;
        categoryId: string;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        quantity: number | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    }>;
    findAllForAdmin(): import(".prisma/client").Prisma.PrismaPromise<({
        farm: {
            id: string;
            name: string;
            owner: {
                id: string;
                mobile: string;
                name: string;
                village: string | null;
                district: string | null;
                state: string | null;
            };
        };
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
        party: {
            id: string;
            mobile: string | null;
            name: string;
        } | null;
        plot: {
            id: string;
            name: string;
        } | null;
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
        recordedBy: {
            id: string;
            mobile: string;
            name: string;
            village: string | null;
            district: string | null;
            state: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmId: string;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        description: string | null;
        cropCycleId: string | null;
        plotId: string | null;
        unit: string | null;
        partyId: string | null;
        expenseDate: Date;
        categoryId: string;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        quantity: number | null;
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmId: string;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        description: string | null;
        cropCycleId: string | null;
        plotId: string | null;
        unit: string | null;
        partyId: string | null;
        expenseDate: Date;
        categoryId: string;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        quantity: number | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    })[]>;
    findOne(user: AuthUser, id: string): Promise<{
        farm: {
            id: string;
            name: string;
            village: string | null;
            district: string | null;
            state: string | null;
            soilType: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            notes: string | null;
            ownerId: string;
            areaUnit: import(".prisma/client").$Enums.AreaUnit;
            totalArea: number;
            irrigationSource: string | null;
        };
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmId: string;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        description: string | null;
        cropCycleId: string | null;
        plotId: string | null;
        unit: string | null;
        partyId: string | null;
        expenseDate: Date;
        categoryId: string;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        quantity: number | null;
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmId: string;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        description: string | null;
        cropCycleId: string | null;
        plotId: string | null;
        unit: string | null;
        partyId: string | null;
        expenseDate: Date;
        categoryId: string;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        quantity: number | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmId: string;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        description: string | null;
        cropCycleId: string | null;
        plotId: string | null;
        unit: string | null;
        partyId: string | null;
        expenseDate: Date;
        categoryId: string;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        quantity: number | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    }>;
}
