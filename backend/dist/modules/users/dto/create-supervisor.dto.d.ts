import { SupervisorPermission } from '@prisma/client';
export declare class CreateSupervisorDto {
    mobile: string;
    name: string;
    password?: string;
    permissions?: SupervisorPermission[];
}
