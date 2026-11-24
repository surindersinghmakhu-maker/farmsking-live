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
            isActive: boolean;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            isSystem: boolean;
            sortOrder: number;
        };
    } & {
        deletedAt: Date | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        description: string | null;
        cropCycleId: string | null;
        plotId: string | null;
        unit: string | null;
        farmId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        categoryId: string;
        partyId: string | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
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
            isActive: boolean;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            isSystem: boolean;
            sortOrder: number;
        };
    } & {
        deletedAt: Date | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        description: string | null;
        cropCycleId: string | null;
        plotId: string | null;
        unit: string | null;
        farmId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        categoryId: string;
        partyId: string | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        quantity: number | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    })[]>;
    findAllForAdmin(): import(".prisma/client").Prisma.PrismaPromise<({
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
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
        party: {
            id: string;
            mobile: string | null;
            name: string;
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
        deletedAt: Date | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        description: string | null;
        cropCycleId: string | null;
        plotId: string | null;
        unit: string | null;
        farmId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        categoryId: string;
        partyId: string | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        quantity: number | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    })[]>;
    findOneOrThrow(user: AuthUser, id: string): Promise<{
        cropCycle: {
            id: string;
            cropName: string;
        } | null;
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
        farm: {
            deletedAt: Date | null;
            id: string;
            name: string;
            village: string | null;
            district: string | null;
            state: string | null;
            soilType: string | null;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            areaUnit: import(".prisma/client").$Enums.AreaUnit;
            ownerId: string;
            totalArea: number;
            irrigationSource: string | null;
        };
    } & {
        deletedAt: Date | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        description: string | null;
        cropCycleId: string | null;
        plotId: string | null;
        unit: string | null;
        farmId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        categoryId: string;
        partyId: string | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
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
            isActive: boolean;
            key: string;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            isSystem: boolean;
            sortOrder: number;
        };
    } & {
        deletedAt: Date | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        description: string | null;
        cropCycleId: string | null;
        plotId: string | null;
        unit: string | null;
        farmId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        categoryId: string;
        partyId: string | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        quantity: number | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        deletedAt: Date | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        description: string | null;
        cropCycleId: string | null;
        plotId: string | null;
        unit: string | null;
        farmId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        categoryId: string;
        partyId: string | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        vendorName: string | null;
        quantity: number | null;
        receiptPhotoUrl: string | null;
        machineryId: string | null;
        recordedById: string;
    }>;
}
