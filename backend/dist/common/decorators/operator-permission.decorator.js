"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireOperatorPermission = exports.OPERATOR_PERMISSION_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.OPERATOR_PERMISSION_KEY = 'operatorPermission';
const RequireOperatorPermission = (permission) => (0, common_1.SetMetadata)(exports.OPERATOR_PERMISSION_KEY, permission);
exports.RequireOperatorPermission = RequireOperatorPermission;
//# sourceMappingURL=operator-permission.decorator.js.map