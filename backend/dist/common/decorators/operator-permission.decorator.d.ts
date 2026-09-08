import { OperatorPermission } from '@prisma/client';
export declare const OPERATOR_PERMISSION_KEY = "operatorPermission";
export declare const RequireOperatorPermission: (permission: OperatorPermission) => import("@nestjs/common").CustomDecorator<string>;
