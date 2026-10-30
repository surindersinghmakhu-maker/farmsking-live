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
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../decorators/roles.decorator");
let RolesGuard = class RolesGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user)
            return false;
        const isPrimaryUsable = !user.deactivatedRoles?.includes(user.role);
        const activeRoles = (user.roles ?? []).filter((r) => !user.deactivatedRoles?.includes(r));
        const allUserRoles = new Set();
        if (isPrimaryUsable)
            allUserRoles.add(user.role);
        activeRoles.forEach((r) => allUserRoles.add(r));
        if (allUserRoles.has(client_1.Role.SUPER_ADMIN)) {
            return true;
        }
        if (allUserRoles.has(client_1.Role.ADMIN)) {
            if (requiredRoles.includes(client_1.Role.ADMIN) ||
                requiredRoles.includes(client_1.Role.MANAGER) ||
                requiredRoles.includes(client_1.Role.OPERATOR)) {
                return true;
            }
        }
        if (allUserRoles.has(client_1.Role.MANAGER)) {
            if (requiredRoles.includes(client_1.Role.MANAGER) || requiredRoles.includes(client_1.Role.OPERATOR)) {
                return true;
            }
        }
        return requiredRoles.some((r) => allUserRoles.has(r));
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RolesGuard);
//# sourceMappingURL=roles.guard.js.map