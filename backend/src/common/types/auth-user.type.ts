import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  mobile: string;
  role: Role;
  /** Every role this account has ever been granted — `role` is just the current/primary one. */
  roles: Role[];
  /** Roles the admin has deactivated — still listed in `roles` for history, but not usable until reactivated. */
  deactivatedRoles: Role[];
  name: string;
}
