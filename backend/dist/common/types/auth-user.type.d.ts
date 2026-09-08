import { Role } from '@prisma/client';
export interface AuthUser {
    id: string;
    mobile: string;
    role: Role;
    roles: Role[];
    deactivatedRoles: Role[];
    name: string;
}
