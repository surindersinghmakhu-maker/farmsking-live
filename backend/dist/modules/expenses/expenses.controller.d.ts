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
        key: string;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        isSystem: boolean;
        isActive: boolean;
        sortOrder: number;
    }[]>;
    listAllCategoriesForAdmin(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        isSystem: boolean;
        isActive: boolean;
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
        key: string;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        isSystem: boolean;
        isActive: boolean;
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
        key: string;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        isSystem: boolean;
        isActive: boolean;
        sortOrder: number;
    }>;
    deleteCategory(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        isSystem: boolean;
        isActive: boolean;
        sortOrder: number;
    }>;
    create(user: AuthUser, dto: CreateExpenseDto): Promise<{
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            isSystem: boolean;
            isActive: boolean;
            sortOrder: number;
        };
    } & {
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        updatedAt: Date;
        partyId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        cropCycleId: string | null;
        unit: string | null;
        farmId: string;
        plotId: string | null;
        expenseDate: Date;
        categoryId: string;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        description: string | null;
        quantity: number | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    }>;
    findAllForFarm(user: AuthUser, farmId: string): Promise<({
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            isSystem: boolean;
            isActive: boolean;
            sortOrder: number;
        };
    } & {
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        updatedAt: Date;
        partyId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        cropCycleId: string | null;
        unit: string | null;
        farmId: string;
        plotId: string | null;
        expenseDate: Date;
        categoryId: string;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        description: string | null;
        quantity: number | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    })[]>;
    findOne(user: AuthUser, id: string): Promise<{
        farm: {
            id: string;
            name: string;
            createdAt: Date;
            deletedAt: Date | null;
            ownerId: string;
            village: string | null;
            district: string | null;
            state: string | null;
            updatedAt: Date;
            notes: string | null;
            soilType: string | null;
            areaUnit: import(".prisma/client").$Enums.AreaUnit;
            totalArea: number;
            irrigationSource: string | null;
        };
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            isSystem: boolean;
            isActive: boolean;
            sortOrder: number;
        };
    } & {
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        updatedAt: Date;
        partyId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        cropCycleId: string | null;
        unit: string | null;
        farmId: string;
        plotId: string | null;
        expenseDate: Date;
        categoryId: string;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        description: string | null;
        quantity: number | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    }>;
    update(user: AuthUser, id: string, dto: UpdateExpenseDto): Promise<{
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            isSystem: boolean;
            isActive: boolean;
            sortOrder: number;
        };
    } & {
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        updatedAt: Date;
        partyId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        cropCycleId: string | null;
        unit: string | null;
        farmId: string;
        plotId: string | null;
        expenseDate: Date;
        categoryId: string;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        description: string | null;
        quantity: number | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        updatedAt: Date;
        partyId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        cropCycleId: string | null;
        unit: string | null;
        farmId: string;
        plotId: string | null;
        expenseDate: Date;
        categoryId: string;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        description: string | null;
        quantity: number | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    }>;
}
