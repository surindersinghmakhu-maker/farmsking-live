import { PrismaService } from '../prisma/prisma.service';
import { FarmsService } from '../farms/farms.service';
import { PlotsService } from '../plots/plots.service';
import { CropsService } from '../crops/crops.service';
import { PartiesService } from '../parties/parties.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
export declare class ExpensesService {
    private readonly prisma;
    private readonly farmsService;
    private readonly plotsService;
    private readonly cropsService;
    private readonly partiesService;
    constructor(prisma: PrismaService, farmsService: FarmsService, plotsService: PlotsService, cropsService: CropsService, partiesService: PartiesService);
    private assertRelationsBelongToFarm;
    listCategories(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        isActive: boolean;
        isSystem: boolean;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        sortOrder: number;
    }[]>;
    listAllCategoriesForAdmin(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        isActive: boolean;
        isSystem: boolean;
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
        createdAt: Date;
        updatedAt: Date;
        key: string;
        isActive: boolean;
        isSystem: boolean;
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
        createdAt: Date;
        updatedAt: Date;
        key: string;
        isActive: boolean;
        isSystem: boolean;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        sortOrder: number;
    }>;
    deleteCategory(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        isActive: boolean;
        isSystem: boolean;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        sortOrder: number;
    }>;
    private resolveCategoryId;
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
            isActive: boolean;
            isSystem: boolean;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            sortOrder: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        recordedById: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        vendorName: string | null;
        description: string | null;
        quantity: number | null;
        unit: string | null;
        receiptPhotoUrl: string | null;
        farmId: string;
        plotId: string | null;
        cropCycleId: string | null;
        categoryId: string;
        machineryId: string | null;
        partyId: string | null;
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
            isActive: boolean;
            isSystem: boolean;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            sortOrder: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        recordedById: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        vendorName: string | null;
        description: string | null;
        quantity: number | null;
        unit: string | null;
        receiptPhotoUrl: string | null;
        farmId: string;
        plotId: string | null;
        cropCycleId: string | null;
        categoryId: string;
        machineryId: string | null;
        partyId: string | null;
    })[]>;
    findAllForAdmin(): import(".prisma/client").Prisma.PrismaPromise<({
        party: {
            name: string;
            mobile: string | null;
            id: string;
        } | null;
        farm: {
            name: string;
            id: string;
            owner: {
                name: string;
                mobile: string;
                id: string;
                village: string | null;
                district: string | null;
                state: string | null;
            };
        };
        plot: {
            name: string;
            id: string;
        } | null;
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            key: string;
            isActive: boolean;
            isSystem: boolean;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            sortOrder: number;
        };
        recordedBy: {
            name: string;
            mobile: string;
            id: string;
            village: string | null;
            district: string | null;
            state: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        recordedById: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        vendorName: string | null;
        description: string | null;
        quantity: number | null;
        unit: string | null;
        receiptPhotoUrl: string | null;
        farmId: string;
        plotId: string | null;
        cropCycleId: string | null;
        categoryId: string;
        machineryId: string | null;
        partyId: string | null;
    })[]>;
    findOneOrThrow(user: AuthUser, id: string): Promise<{
        farm: {
            name: string;
            id: string;
            village: string | null;
            district: string | null;
            state: string | null;
            soilType: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            ownerId: string;
            totalArea: number;
            areaUnit: import(".prisma/client").$Enums.AreaUnit;
            irrigationSource: string | null;
            notes: string | null;
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
            isActive: boolean;
            isSystem: boolean;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            sortOrder: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        recordedById: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        vendorName: string | null;
        description: string | null;
        quantity: number | null;
        unit: string | null;
        receiptPhotoUrl: string | null;
        farmId: string;
        plotId: string | null;
        cropCycleId: string | null;
        categoryId: string;
        machineryId: string | null;
        partyId: string | null;
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
            isActive: boolean;
            isSystem: boolean;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            sortOrder: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        recordedById: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        vendorName: string | null;
        description: string | null;
        quantity: number | null;
        unit: string | null;
        receiptPhotoUrl: string | null;
        farmId: string;
        plotId: string | null;
        cropCycleId: string | null;
        categoryId: string;
        machineryId: string | null;
        partyId: string | null;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        recordedById: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        vendorName: string | null;
        description: string | null;
        quantity: number | null;
        unit: string | null;
        receiptPhotoUrl: string | null;
        farmId: string;
        plotId: string | null;
        cropCycleId: string | null;
        categoryId: string;
        machineryId: string | null;
        partyId: string | null;
    }>;
}
