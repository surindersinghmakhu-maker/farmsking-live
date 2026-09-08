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
exports.SprayItemTemplatesController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const spray_item_templates_service_1 = require("./spray-item-templates.service");
const create_spray_item_template_dto_1 = require("./dto/create-spray-item-template.dto");
const update_spray_item_template_dto_1 = require("./dto/update-spray-item-template.dto");
let SprayItemTemplatesController = class SprayItemTemplatesController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(user, dto) {
        return this.service.create(user.id, dto);
    }
    listMine(user) {
        return this.service.listMine(user.id);
    }
    listAll() {
        return this.service.listAll();
    }
    listForMyAdvisor(user) {
        return this.service.listForMyAdvisor(user.id);
    }
    update(user, id, dto) {
        return this.service.update(user.id, id, dto);
    }
    remove(user, id) {
        return this.service.remove(user.id, id);
    }
};
exports.SprayItemTemplatesController = SprayItemTemplatesController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_spray_item_template_dto_1.CreateSprayItemTemplateDto]),
    __metadata("design:returntype", void 0)
], SprayItemTemplatesController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Get)('mine'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SprayItemTemplatesController.prototype, "listMine", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SprayItemTemplatesController.prototype, "listAll", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.GARDENER),
    (0, common_1.Get)('for-my-advisor'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SprayItemTemplatesController.prototype, "listForMyAdvisor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_spray_item_template_dto_1.UpdateSprayItemTemplateDto]),
    __metadata("design:returntype", void 0)
], SprayItemTemplatesController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SprayItemTemplatesController.prototype, "remove", null);
exports.SprayItemTemplatesController = SprayItemTemplatesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('spray-item-templates'),
    __metadata("design:paramtypes", [spray_item_templates_service_1.SprayItemTemplatesService])
], SprayItemTemplatesController);
//# sourceMappingURL=spray-item-templates.controller.js.map