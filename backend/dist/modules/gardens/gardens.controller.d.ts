import type { AuthUser } from '../../common/types/auth-user.type';
import { GardensService } from './gardens.service';
import { CreateGardenDto } from './dto/create-garden.dto';
import { CreatePlantDto } from './dto/create-plant.dto';
import { CreateGardenExpenseDto } from './dto/create-garden-expense.dto';
export declare class GardensController {
    private readonly gardensService;
    constructor(gardensService: GardensService);
    create(user: AuthUser, dto: CreateGardenDto): import(".prisma/client").Prisma.Prisma__GardenClient<{
        id: string;
        name: string;
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
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            gardenId: string;
            species: string | null;
            plantedDate: Date | null;
            healthNotes: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        gardenerId: string;
        area: number | null;
        location: string | null;
        healthScore: number;
    })[]>;
    findOne(user: AuthUser, id: string): Promise<{
        plants: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            gardenId: string;
            species: string | null;
            plantedDate: Date | null;
            healthNotes: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        gardenerId: string;
        area: number | null;
        location: string | null;
        healthScore: number;
    }>;
    addPlant(user: AuthUser, id: string, dto: CreatePlantDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        gardenId: string;
        species: string | null;
        plantedDate: Date | null;
        healthNotes: string | null;
    }>;
    listPlants(user: AuthUser, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        gardenId: string;
        species: string | null;
        plantedDate: Date | null;
        healthNotes: string | null;
    }[]>;
    addExpense(user: AuthUser, dto: CreateGardenExpenseDto): import(".prisma/client").Prisma.Prisma__GardenExpenseClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    listExpenses(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        garden: {
            id: string;
            name: string;
        };
        plant: {
            id: string;
            name: string;
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
