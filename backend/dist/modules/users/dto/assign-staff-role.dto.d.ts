import { Role } from '@prisma/client';
export declare class AssignStaffRoleDto {
    userId: string;
    role: Role;
    staffId?: string;
    advisorType?: 'FARM' | 'GARDEN';
}
