"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorPermissionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../modules/prisma/prisma.service");
const operator_permission_decorator_1 = require("../decorators/operator-permission.decorator");
let OperatorPermissionGuard = class OperatorPermissionGuard {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const required = this.reflector.getAllAndOverride(operator_permission_decorator_1.OPERATOR_PERMISSION_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!required)
            return true;
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || user.role !== client_1.Role.OPERATOR)
            return true;
        const record = await this.prisma.user.findUnique({ where: { id: user.id }, select: { operatorPermissions: true } });
        if (!record?.operatorPermissions.includes(required)) {
            throw new common_1.ForbiddenException(`You don't have the ${required} permission. Ask an admin to grant it.`);
        }
        return true;
    }
};
exports.OperatorPermissionGuard = OperatorPermissionGuard;
exports.OperatorPermissionGuard = OperatorPermissionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], OperatorPermissionGuard);
//# sourceMappingURL=operator-permission.guard.js.map