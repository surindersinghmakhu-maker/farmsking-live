import { PrismaService } from '../prisma/prisma.service';
import { GardenerPlansService } from '../gardener-plans/gardener-plans.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateGardenDto } from './dto/create-garden.dto';
import { CreatePlantDto } from './dto/create-plant.dto';
export declare class GardensService {
    private readonly prisma;
    private readonly gardenerPlansService;
    constructor(prisma: PrismaService, gardenerPlansService: GardenerPlansService);
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
    findOneOrThrow(user: AuthUser, id: string): Promise<{
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
    addPlant(user: AuthUser, gardenId: string, dto: CreatePlantDto): Promise<{
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
    listPlants(user: AuthUser, gardenId: string): Promise<{
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
