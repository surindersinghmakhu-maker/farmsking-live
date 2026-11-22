import type { AuthUser } from '../../common/types/auth-user.type';
import { PlotsService } from './plots.service';
import { CreatePlotDto } from './dto/create-plot.dto';
import { UpdatePlotDto } from './dto/update-plot.dto';
export declare class PlotsController {
    private readonly plotsService;
    constructor(plotsService: PlotsService);
    create(user: AuthUser, dto: CreatePlotDto): Promise<{
        deletedAt: Date | null;
        id: string;
        name: string;
        soilType: string | null;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        area: number;
        farmId: string;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        irrigationType: string | null;
        waterSource: string | null;
    }>;
    findAllForFarm(user: AuthUser, farmId: string): Promise<{
        deletedAt: Date | null;
        id: string;
        name: string;
        soilType: string | null;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        area: number;
        farmId: string;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        irrigationType: string | null;
        waterSource: string | null;
    }[]>;
    findOne(user: AuthUser, id: string): Promise<{
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
        name: string;
        soilType: string | null;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        area: number;
        farmId: string;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        irrigationType: string | null;
        waterSource: string | null;
    }>;
    update(user: AuthUser, id: string, dto: UpdatePlotDto): Promise<{
        deletedAt: Date | null;
        id: string;
        name: string;
        soilType: string | null;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        area: number;
        farmId: string;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        irrigationType: string | null;
        waterSource: string | null;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        deletedAt: Date | null;
        id: string;
        name: string;
        soilType: string | null;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        area: number;
        farmId: string;
        areaUnit: import(".prisma/client").$Enums.AreaUnit;
        irrigationType: string | null;
        waterSource: string | null;
    }>;
}
