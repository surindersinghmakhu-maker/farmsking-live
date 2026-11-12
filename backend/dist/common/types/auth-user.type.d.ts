import { AdminStaffPermission, OperatorPermission, Role, SupervisorPermission } from '@prisma/client';
export interface AuthUser {
    id: string;
    mobile: string;
    role: Role;
    roles: Role[];
    deactivatedRoles: Role[];
    name: string;
    kingId?: string | null;
    isSeniorDoctor?: boolean;
    employerFarmerId?: string | null;
    supervisorPermissions?: SupervisorPermission[];
    operatorPermissions?: OperatorPermission[];
    adminStaffPermissions?: AdminStaffPermission[];
    supervisorFeaturesConfig?: any;
}
