import { Role } from '@prisma/client';
export declare class ListUsersQueryDto {
    role?: Role;
    status?: 'active' | 'inactive' | 'all';
    search?: string;
    page?: number;
    limit?: number;
}
