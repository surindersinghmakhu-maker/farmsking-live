import { PrismaService } from '../prisma/prisma.service';
import { CreateSprayItemTemplateDto } from './dto/create-spray-item-template.dto';
import { UpdateSprayItemTemplateDto } from './dto/update-spray-item-template.dto';
export declare class SprayItemTemplatesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(advisorId: string, dto: CreateSprayItemTemplateDto): import(".prisma/client").Prisma.Prisma__SprayItemTemplateClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        sprayType: import(".prisma/client").$Enums.SprayType | null;
        item: string;
        dose: string | null;
        alternative1: string | null;
        alternative2: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    listMine(advisorId: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        sprayType: import(".prisma/client").$Enums.SprayType | null;
        item: string;
        dose: string | null;
        alternative1: string | null;
        alternative2: string | null;
    }[]>;
    listForMyAdvisor(farmerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        sprayType: import(".prisma/client").$Enums.SprayType | null;
        item: string;
        dose: string | null;
        alternative1: string | null;
        alternative2: string | null;
    }[]>;
    listAll(): import(".prisma/client").Prisma.PrismaPromise<({
        advisor: {
            id: string;
            kingId: string | null;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        sprayType: import(".prisma/client").$Enums.SprayType | null;
        item: string;
        dose: string | null;
        alternative1: string | null;
        alternative2: string | null;
    })[]>;
    private findOwned;
    update(advisorId: string, id: string, dto: UpdateSprayItemTemplateDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        sprayType: import(".prisma/client").$Enums.SprayType | null;
        item: string;
        dose: string | null;
        alternative1: string | null;
        alternative2: string | null;
    }>;
    remove(advisorId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        sprayType: import(".prisma/client").$Enums.SprayType | null;
        item: string;
        dose: string | null;
        alternative1: string | null;
        alternative2: string | null;
    }>;
}
