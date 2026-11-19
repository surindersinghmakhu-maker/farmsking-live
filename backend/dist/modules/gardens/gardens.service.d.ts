import { PrismaService } from '../prisma/prisma.service';
import { GardenerPlansService } from '../gardener-plans/gardener-plans.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateGardenDto } from './dto/create-garden.dto';
import { CreatePlantDto } from './dto/create-plant.dto';
import { CreateGardenExpenseDto } from './dto/create-garden-expense.dto';
export declare class GardensService {
    private readonly prisma;
    private readonly gardenerPlansService;
    constructor(prisma: PrismaService, gardenerPlansService: GardenerPlansService);
    create(user: AuthUser, dto: CreateGardenDto): import(".prisma/client").Prisma.Prisma__GardenClient<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        gardenerId: string;
        area: number | null;
        location: string | null;
        healthScore: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    findAll(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        plants: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            gardenId: string;
            plantedDate: Date | null;
            species: string | null;
            healthNotes: string | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        gardenerId: string;
        area: number | null;
        location: string | null;
        healthScore: number;
    })[]>;
    findOneOrThrow(user: AuthUser, id: string): Promise<{
        plants: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            gardenId: string;
            plantedDate: Date | null;
            species: string | null;
            healthNotes: string | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        gardenerId: string;
        area: number | null;
        location: string | null;
        healthScore: number;
    }>;
    addPlant(user: AuthUser, gardenId: string, dto: CreatePlantDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        gardenId: string;
        plantedDate: Date | null;
        species: string | null;
        healthNotes: string | null;
    }>;
    listPlants(user: AuthUser, gardenId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        gardenId: string;
        plantedDate: Date | null;
        species: string | null;
        healthNotes: string | null;
    }[]>;
    addExpense(user: AuthUser, dto: CreateGardenExpenseDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        description: string | null;
        recordedById: string;
        expenseDate: Date;
        receiptPhotoUrl: string | null;
        gardenId: string;
        plantId: string | null;
        categoryName: string;
    }>;
    listExpenses(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        garden: {
            name: string;
            id: string;
        };
        plant: {
            name: string;
            id: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        description: string | null;
        recordedById: string;
        expenseDate: Date;
        receiptPhotoUrl: string | null;
        gardenId: string;
        plantId: string | null;
        categoryName: string;
    })[]>;
    deleteExpense(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        description: string | null;
        recordedById: string;
        expenseDate: Date;
        receiptPhotoUrl: string | null;
        gardenId: string;
        plantId: string | null;
        categoryName: string;
    }>;
}
