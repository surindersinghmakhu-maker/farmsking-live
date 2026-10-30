import { SupervisorPermission } from '@prisma/client';
export declare class CreateSupervisorDto {
    firebaseIdToken?: string;
    mobile: string;
    name: string;
    password?: string;
    permissions?: SupervisorPermission[];
}
