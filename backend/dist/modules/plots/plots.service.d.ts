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
        createdAt: Date;
        updatedAt: Date;
        name: string;
        soilType: string | null;
        deletedAt: Date | null;
        notes: string | null;
        farmId: string;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        waterSource: string | null;
        area: number;
        irrigationType: string | null;
    }>;
    findAllForFarm(user: AuthUser, farmId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        soilType: string | null;
        deletedAt: Date | null;
        notes: string | null;
        farmId: string;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        waterSource: string | null;
        area: number;
        irrigationType: string | null;
    }[]>;
    findOneOrThrow(user: AuthUser, id: string): Promise<{
        farm: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            village: string | null;
            district: string | null;
            state: string | null;
            soilType: string | null;
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
        name: string;
        soilType: string | null;
        deletedAt: Date | null;
        notes: string | null;
        farmId: string;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        waterSource: string | null;
        area: number;
        irrigationType: string | null;
    }>;
    update(user: AuthUser, id: string, dto: UpdatePlotDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        soilType: string | null;
        deletedAt: Date | null;
        notes: string | null;
        farmId: string;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        waterSource: string | null;
        area: number;
        irrigationType: string | null;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        soilType: string | null;
        deletedAt: Date | null;
        notes: string | null;
        farmId: string;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        waterSource: string | null;
        area: number;
        irrigationType: string | null;
    }>;
}
