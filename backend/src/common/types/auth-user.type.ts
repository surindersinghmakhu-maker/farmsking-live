import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  mobile: string;
  role: Role;
  name: string;
}
