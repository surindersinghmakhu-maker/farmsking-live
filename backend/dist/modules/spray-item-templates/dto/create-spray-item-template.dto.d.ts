import { SprayType } from '@prisma/client';
export declare class CreateSprayItemTemplateDto {
    sprayType?: SprayType;
    item: string;
    dose?: string;
    alternative1?: string;
    alternative2?: string;
}
