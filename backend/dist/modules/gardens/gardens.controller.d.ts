import type { AuthUser } from '../../common/types/auth-user.type';
import { GardensService } from './gardens.service';
import { CreateGardenDto } from './dto/create-garden.dto';
import { CreatePlantDto } from './dto/create-plant.dto';
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
            species: string | null;
            plantedDate: Date | null;
            healthNotes: string | null;
            gardenId: string;
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
            species: string | null;
            plantedDate: Date | null;
            healthNotes: string | null;
            gardenId: string;
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
        species: string | null;
        plantedDate: Date | null;
        healthNotes: string | null;
        gardenId: string;
    }>;
    listPlants(user: AuthUser, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        species: string | null;
        plantedDate: Date | null;
        healthNotes: string | null;
        gardenId: string;
    }[]>;
}
