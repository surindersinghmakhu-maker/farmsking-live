import type { AuthUser } from '../../common/types/auth-user.type';
import { PlotsService } from './plots.service';
import { CreatePlotDto } from './dto/create-plot.dto';
import { UpdatePlotDto } from './dto/update-plot.dto';
export declare class PlotsController {
    private readonly plotsService;
    constructor(plotsService: PlotsService);
    create(user: AuthUser, dto: CreatePlotDto): Promise<{
        name: string;
        id: string;
        soilType: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        notes: string | null;
        farmId: string;
        area: number;
        irrigationType: string | null;
        waterSource: string | null;
    }>;
    findAllForFarm(user: AuthUser, farmId: string): Promise<{
        name: string;
        id: string;
        soilType: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        notes: string | null;
        farmId: string;
        area: number;
        irrigationType: string | null;
        waterSource: string | null;
    }[]>;
    findOne(user: AuthUser, id: string): Promise<{
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
    } & {
        name: string;
        id: string;
        soilType: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        notes: string | null;
        farmId: string;
        area: number;
        irrigationType: string | null;
        waterSource: string | null;
    }>;
    update(user: AuthUser, id: string, dto: UpdatePlotDto): Promise<{
        name: string;
        id: string;
        soilType: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        notes: string | null;
        farmId: string;
        area: number;
        irrigationType: string | null;
        waterSource: string | null;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        name: string;
        id: string;
        soilType: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        notes: string | null;
        farmId: string;
        area: number;
        irrigationType: string | null;
        waterSource: string | null;
    }>;
}
