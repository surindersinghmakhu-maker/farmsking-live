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
        key: string;
        isActive: boolean;
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
        key: string;
        isActive: boolean;
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
        key: string;
        isActive: boolean;
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
        key: string;
        isActive: boolean;
        labelEn: string;
        labelHi: string;
        icon: string | null;
        isSystem: boolean;
        sortOrder: number;
    }>;
    private resolveCategoryId;
    create(user: AuthUser, dto: CreateExpenseDto): Promise<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            key: string;
            isActive: boolean;
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
        description: string | null;
        unit: string | null;
        notes: string | null;
        plotId: string | null;
        farmId: string;
        cropCycleId: string | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        quantity: number | null;
        expenseDate: Date;
        receiptPhotoUrl: string | null;
        recordedById: string;
        categoryId: string;
        partyId: string | null;
        vendorName: string | null;
        machineryId: string | null;
    }>;
    findAllForFarm(user: AuthUser, farmId: string): Promise<({
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            key: string;
            isActive: boolean;
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
        description: string | null;
        unit: string | null;
        notes: string | null;
        plotId: string | null;
        farmId: string;
        cropCycleId: string | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        quantity: number | null;
        expenseDate: Date;
        receiptPhotoUrl: string | null;
        recordedById: string;
        categoryId: string;
        partyId: string | null;
        vendorName: string | null;
        machineryId: string | null;
    })[]>;
    findAllForAdmin(): import(".prisma/client").Prisma.PrismaPromise<({
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            key: string;
            isActive: boolean;
            labelEn: string;
            labelHi: string;
            icon: string | null;
            isSystem: boolean;
            sortOrder: number;
        };
        plot: {
            name: string;
            id: string;
        } | null;
        cropCycle: {
            id: string;
            cropName: string;
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
        party: {
            name: string;
            mobile: string | null;
            id: string;
        } | null;
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
        description: string | null;
        unit: string | null;
        notes: string | null;
        plotId: string | null;
        farmId: string;
        cropCycleId: string | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        quantity: number | null;
        expenseDate: Date;
        receiptPhotoUrl: string | null;
        recordedById: string;
        categoryId: string;
        partyId: string | null;
        vendorName: string | null;
        machineryId: string | null;
    })[]>;
    findOneOrThrow(user: AuthUser, id: string): Promise<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            key: string;
            isActive: boolean;
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
            name: string;
            id: string;
            village: string | null;
            district: string | null;
            state: string | null;
            soilType: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            notes: string | null;
            ownerId: string;
            totalArea: number;
            areaUnit: import(".prisma/client").$Enums.AreaUnit;
            irrigationSource: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        unit: string | null;
        notes: string | null;
        plotId: string | null;
        farmId: string;
        cropCycleId: string | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        quantity: number | null;
        expenseDate: Date;
        receiptPhotoUrl: string | null;
        recordedById: string;
        categoryId: string;
        partyId: string | null;
        vendorName: string | null;
        machineryId: string | null;
    }>;
    update(user: AuthUser, id: string, dto: UpdateExpenseDto): Promise<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            key: string;
            isActive: boolean;
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
        description: string | null;
        unit: string | null;
        notes: string | null;
        plotId: string | null;
        farmId: string;
        cropCycleId: string | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        quantity: number | null;
        expenseDate: Date;
        receiptPhotoUrl: string | null;
        recordedById: string;
        categoryId: string;
        partyId: string | null;
        vendorName: string | null;
        machineryId: string | null;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        unit: string | null;
        notes: string | null;
        plotId: string | null;
        farmId: string;
        cropCycleId: string | null;
        paymentMode: import(".prisma/client").$Enums.PaymentMode | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        quantity: number | null;
        expenseDate: Date;
        receiptPhotoUrl: string | null;
        recordedById: string;
        categoryId: string;
        partyId: string | null;
        vendorName: string | null;
        machineryId: string | null;
    }>;
}
