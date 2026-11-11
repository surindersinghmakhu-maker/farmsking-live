import type { AuthUser } from '../../common/types/auth-user.type';
import { SprayItemTemplatesService } from './spray-item-templates.service';
import { CreateSprayItemTemplateDto } from './dto/create-spray-item-template.dto';
import { UpdateSprayItemTemplateDto } from './dto/update-spray-item-template.dto';
export declare class SprayItemTemplatesController {
    private readonly service;
    constructor(service: SprayItemTemplatesService);
    create(user: AuthUser, dto: CreateSprayItemTemplateDto): import(".prisma/client").Prisma.Prisma__SprayItemTemplateClient<{
        dose: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        sprayType: import(".prisma/client").$Enums.SprayType | null;
        item: string;
        alternative1: string | null;
        alternative2: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    listMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<{
        dose: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        sprayType: import(".prisma/client").$Enums.SprayType | null;
        item: string;
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
        dose: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        sprayType: import(".prisma/client").$Enums.SprayType | null;
        item: string;
        alternative1: string | null;
        alternative2: string | null;
    })[]>;
    listForMyAdvisor(user: AuthUser): Promise<{
        dose: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        sprayType: import(".prisma/client").$Enums.SprayType | null;
        item: string;
        alternative1: string | null;
        alternative2: string | null;
    }[]>;
    update(user: AuthUser, id: string, dto: UpdateSprayItemTemplateDto): Promise<{
        dose: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        sprayType: import(".prisma/client").$Enums.SprayType | null;
        item: string;
        alternative1: string | null;
        alternative2: string | null;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        dose: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        sprayType: import(".prisma/client").$Enums.SprayType | null;
        item: string;
        alternative1: string | null;
        alternative2: string | null;
    }>;
}
