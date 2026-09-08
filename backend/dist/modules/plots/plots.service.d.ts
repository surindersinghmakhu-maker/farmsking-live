import { PrismaService } from '../prisma/prisma.service';
import { FarmsService } from '../farms/farms.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreatePlotDto } from './dto/create-plot.dto';
import { UpdatePlotDto } from './dto/update-plot.dto';
export declare class PlotsService {
    private readonly prisma;
    private readonly farmsService;
    constructor(prisma: PrismaService, farmsService: FarmsService);
    create(user: AuthUser, dto: CreatePlotDto): Promise<{
        id: string;
        name: string;
        soilType: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        farmId: string;
        area: number;
        irrigationType: string | null;
        waterSource: string | null;
    }>;
    findAllForFarm(user: AuthUser, farmId: string): Promise<{
        id: string;
        name: string;
        soilType: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        farmId: string;
        area: number;
        irrigationType: string | null;
        waterSource: string | null;
    }[]>;
    findOneOrThrow(user: AuthUser, id: string): Promise<{
        farm: {
            id: string;
            name: string;
            village: string | null;
            district: string | null;
            state: string | null;
            soilType: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            notes: string | null;
            totalArea: number;
            areaUnit: import(".prisma/client").$Enums.AreaUnit;
            irrigationSource: string | null;
            ownerId: string;
        };
    } & {
        id: string;
        name: string;
        soilType: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        farmId: string;
        area: number;
        irrigationType: string | null;
        waterSource: string | null;
    }>;
    update(user: AuthUser, id: string, dto: UpdatePlotDto): Promise<{
        id: string;
        name: string;
        soilType: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        farmId: string;
        area: number;
        irrigationType: string | null;
        waterSource: string | null;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        name: string;
        soilType: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        farmId: string;
        area: number;
        irrigationType: string | null;
        waterSource: string | null;
    }>;
}
