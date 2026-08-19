import { SetMetadata } from '@nestjs/common';
import { OperatorPermission } from '@prisma/client';

export const OPERATOR_PERMISSION_KEY = 'operatorPermission';

/** Only matters for callers with role OPERATOR — ADMIN/SUPER_ADMIN pass through unaffected (see OperatorPermissionGuard). */
export const RequireOperatorPermission = (permission: OperatorPermission) => SetMetadata(OPERATOR_PERMISSION_KEY, permission);
