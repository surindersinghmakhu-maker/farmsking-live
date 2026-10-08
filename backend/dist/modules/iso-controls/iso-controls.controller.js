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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsoControlsController = void 0;
const common_1 = require("@nestjs/common");
const iso_controls_service_1 = require("./iso-controls.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let IsoControlsController = class IsoControlsController {
    constructor(isoControlsService) {
        this.isoControlsService = isoControlsService;
    }
    getAllControls() {
        return this.isoControlsService.getAllModuleControls();
    }
    getModuleControl(moduleKey) {
        return this.isoControlsService.getModuleControl(moduleKey);
    }
    toggleModule(moduleKey, body, user) {
        return this.isoControlsService.toggleModule(moduleKey, body.isEnabled, body.maintenanceMessage, user.id, user.name || user.mobile);
    }
    getAuditLogs() {
        return this.isoControlsService.getAuditLogs();
    }
};
exports.IsoControlsController = IsoControlsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IsoControlsController.prototype, "getAllControls", null);
__decorate([
    (0, common_1.Get)(':moduleKey'),
    __param(0, (0, common_1.Param)('moduleKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IsoControlsController.prototype, "getModuleControl", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Put)(':moduleKey/toggle'),
    __param(0, (0, common_1.Param)('moduleKey')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], IsoControlsController.prototype, "toggleModule", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('audit/logs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IsoControlsController.prototype, "getAuditLogs", null);
exports.IsoControlsController = IsoControlsController = __decorate([
    (0, common_1.Controller)('iso-controls'),
    __metadata("design:paramtypes", [iso_controls_service_1.IsoControlsService])
], IsoControlsController);
//# sourceMappingURL=iso-controls.controller.js.map