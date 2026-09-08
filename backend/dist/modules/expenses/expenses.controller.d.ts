import type { AuthUser } from '../../common/types/auth-user.type';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
export declare class ExpensesController {
    private readonly expensesService;
    constructor(expensesService: ExpensesService);
    listCategories(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        isActive: boolean;
        isSystem: boolean;
        key: string;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        sortOrder: number;
    }[]>;
    listAllCategoriesForAdmin(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        isActive: boolean;
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
        updatedAt: Date;
        createdAt: Date;
        isActive: boolean;
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
        updatedAt: Date;
        createdAt: Date;
        isActive: boolean;
        isSystem: boolean;
        key: string;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        sortOrder: number;
    }>;
    deleteCategory(id: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        isActive: boolean;
        isSystem: boolean;
        key: string;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        sortOrder: number;
    }>;
    create(user: AuthUser, dto: CreateExpenseDto): Promise<{
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
        category: {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            isActive: boolean;
            isSystem: boolean;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            sortOrder: number;
        };
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        description: string | null;
        cropCycleId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        plotId: string | null;
        unit: string | null;
        farmId: string;
        categoryId: string;
        machineryId: string | null;
        partyId: string | null;
        expenseDate: Date;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        quantity: number | null;
        receiptPhotoUrl: string | null;
        recordedById: string;
    }>;
    findAllForFarm(user: AuthUser, farmId: string): Promise<({
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
        category: {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            isActive: boolean;
            isSystem: boolean;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            sortOrder: number;
        };
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        description: string | null;
        cropCycleId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        plotId: string | null;
        unit: string | null;
        farmId: string;
        categoryId: string;
        machineryId: string | null;
        partyId: string | null;
        expenseDate: Date;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        quantity: number | null;
        receiptPhotoUrl: string | null;
        recordedById: string;
    })[]>;
    findOne(user: AuthUser, id: string): Promise<{
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
        category: {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            isActive: boolean;
            isSystem: boolean;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            sortOrder: number;
        };
        farm: {
            id: string;
            updatedAt: Date;
            name: string;
            village: string | null;
            district: string | null;
            state: string | null;
            soilType: string | null;
            createdAt: Date;
            deletedAt: Date | null;
            notes: string | null;
            areaUnit: import(".prisma/client").$Enums.AreaUnit;
            ownerId: string;
            totalArea: number;
            irrigationSource: string | null;
        };
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        description: string | null;
        cropCycleId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        plotId: string | null;
        unit: string | null;
        farmId: string;
        categoryId: string;
        machineryId: string | null;
        partyId: string | null;
        expenseDate: Date;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        quantity: number | null;
        receiptPhotoUrl: string | null;
        recordedById: string;
    }>;
    update(user: AuthUser, id: string, dto: UpdateExpenseDto): Promise<{
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
        category: {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            isActive: boolean;
            isSystem: boolean;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            sortOrder: number;
        };
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        description: string | null;
        cropCycleId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        plotId: string | null;
        unit: string | null;
        farmId: string;
        categoryId: string;
        machineryId: string | null;
        partyId: string | null;
        expenseDate: Date;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        quantity: number | null;
        receiptPhotoUrl: string | null;
        recordedById: string;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        description: string | null;
        cropCycleId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        plotId: string | null;
        unit: string | null;
        farmId: string;
        categoryId: string;
        machineryId: string | null;
        partyId: string | null;
        expenseDate: Date;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        quantity: number | null;
        receiptPhotoUrl: string | null;
        recordedById: string;
    }>;
}
