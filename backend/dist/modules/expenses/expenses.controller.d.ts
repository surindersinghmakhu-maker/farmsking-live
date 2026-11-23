import type { AuthUser } from '../../common/types/auth-user.type';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
export declare class ExpensesController {
    private readonly expensesService;
    constructor(expensesService: ExpensesService);
    listCategories(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        isSystem: boolean;
        key: string;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        sortOrder: number;
    }[]>;
    listAllCategoriesForAdmin(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        isSystem: boolean;
        key: string;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        sortOrder: number;
    }[]>;
    createCategory(dto: {
        key: string;
        labelEn: string;
        labelHi?: string;
        sortOrder?: number;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        isSystem: boolean;
        key: string;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        sortOrder: number;
    }>;
    updateCategory(id: string, dto: {
        labelEn?: string;
        labelHi?: string;
        sortOrder?: number;
        isActive?: boolean;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        isSystem: boolean;
        key: string;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        sortOrder: number;
    }>;
    deleteCategory(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        isSystem: boolean;
        key: string;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        sortOrder: number;
    }>;
    create(user: AuthUser, dto: CreateExpenseDto): Promise<{
        category: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            isSystem: boolean;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
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
        notes: string | null;
        deletedAt: Date | null;
        farmId: string;
        plotId: string | null;
        cropCycleId: string | null;
        categoryId: string;
        machineryId: string | null;
        partyId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        description: string | null;
        quantity: number | null;
        unit: string | null;
        receiptPhotoUrl: string | null;
        recordedById: string;
    }>;
    findAllForAdmin(): import(".prisma/client").Prisma.PrismaPromise<({
        category: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            isSystem: boolean;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            sortOrder: number;
        };
        farm: {
            id: string;
            name: string;
            owner: {
                id: string;
                name: string;
                mobile: string;
                village: string | null;
                district: string | null;
                state: string | null;
            };
        };
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
        party: {
            id: string;
            name: string;
            mobile: string | null;
        } | null;
        plot: {
            id: string;
            name: string;
        } | null;
        recordedBy: {
            id: string;
            name: string;
            mobile: string;
            village: string | null;
            district: string | null;
            state: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        deletedAt: Date | null;
        farmId: string;
        plotId: string | null;
        cropCycleId: string | null;
        categoryId: string;
        machineryId: string | null;
        partyId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        description: string | null;
        quantity: number | null;
        unit: string | null;
        receiptPhotoUrl: string | null;
        recordedById: string;
    })[]>;
    findAllForFarm(user: AuthUser, farmId: string): Promise<({
        category: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            isSystem: boolean;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
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
        notes: string | null;
        deletedAt: Date | null;
        farmId: string;
        plotId: string | null;
        cropCycleId: string | null;
        categoryId: string;
        machineryId: string | null;
        partyId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        description: string | null;
        quantity: number | null;
        unit: string | null;
        receiptPhotoUrl: string | null;
        recordedById: string;
    })[]>;
    findOne(user: AuthUser, id: string): Promise<{
        category: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            isSystem: boolean;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            sortOrder: number;
        };
        farm: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            notes: string | null;
            village: string | null;
            district: string | null;
            state: string | null;
            soilType: string | null;
            deletedAt: Date | null;
            ownerId: string;
            totalArea: number;
            areaUnit: import(".prisma/client").$Enums.AreaUnit;
            irrigationSource: string | null;
        };
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        deletedAt: Date | null;
        farmId: string;
        plotId: string | null;
        cropCycleId: string | null;
        categoryId: string;
        machineryId: string | null;
        partyId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        description: string | null;
        quantity: number | null;
        unit: string | null;
        receiptPhotoUrl: string | null;
        recordedById: string;
    }>;
    update(user: AuthUser, id: string, dto: UpdateExpenseDto): Promise<{
        category: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            isSystem: boolean;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
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
        notes: string | null;
        deletedAt: Date | null;
        farmId: string;
        plotId: string | null;
        cropCycleId: string | null;
        categoryId: string;
        machineryId: string | null;
        partyId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        description: string | null;
        quantity: number | null;
        unit: string | null;
        receiptPhotoUrl: string | null;
        recordedById: string;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        deletedAt: Date | null;
        farmId: string;
        plotId: string | null;
        cropCycleId: string | null;
        categoryId: string;
        machineryId: string | null;
        partyId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        description: string | null;
        quantity: number | null;
        unit: string | null;
        receiptPhotoUrl: string | null;
        recordedById: string;
    }>;
}
