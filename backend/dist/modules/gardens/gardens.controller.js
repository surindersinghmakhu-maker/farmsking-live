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
exports.GardensController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const gardens_service_1 = require("./gardens.service");
const create_garden_dto_1 = require("./dto/create-garden.dto");
const create_plant_dto_1 = require("./dto/create-plant.dto");
let GardensController = class GardensController {
    gardensService;
    constructor(gardensService) {
        this.gardensService = gardensService;
    }
    create(user, dto) {
        return this.gardensService.create(user, dto);
    }
    findAll(user) {
        return this.gardensService.findAll(user);
    }
    findOne(user, id) {
        return this.gardensService.findOneOrThrow(user, id);
    }
    addPlant(user, id, dto) {
        return this.gardensService.addPlant(user, id, dto);
    }
    listPlants(user, id) {
        return this.gardensService.listPlants(user, id);
    }
};
exports.GardensController = GardensController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_garden_dto_1.CreateGardenDto]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('mine'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/plants'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_plant_dto_1.CreatePlantDto]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "addPlant", null);
__decorate([
    (0, common_1.Get)(':id/plants'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "listPlants", null);
exports.GardensController = GardensController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.GARDENER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Controller)('gardens'),
    __metadata("design:paramtypes", [gardens_service_1.GardensService])
], GardensController);
//# sourceMappingURL=gardens.controller.js.map