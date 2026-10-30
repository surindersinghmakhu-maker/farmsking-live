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
exports.ShiprocketController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const shiprocket_service_1 = require("./shiprocket.service");
const shiprocket_dto_1 = require("./dto/shiprocket.dto");
let ShiprocketController = class ShiprocketController {
    constructor(shiprocketService) {
        this.shiprocketService = shiprocketService;
    }
    addPickupLocation(storeId) {
        return this.shiprocketService.addPickupLocation(storeId);
    }
    createOrder(dto) {
        return this.shiprocketService.createShipmentOrder(dto);
    }
    assignAwb(dto) {
        return this.shiprocketService.assignAwb(dto);
    }
    handleWebhook(body) {
        return this.shiprocketService.handleWebhook(body);
    }
};
exports.ShiprocketController = ShiprocketController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('pickup-location/:storeId'),
    __param(0, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ShiprocketController.prototype, "addPickupLocation", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('orders'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shiprocket_dto_1.CreateShiprocketOrderDto]),
    __metadata("design:returntype", void 0)
], ShiprocketController.prototype, "createOrder", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('awb'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shiprocket_dto_1.GenerateAwbDto]),
    __metadata("design:returntype", void 0)
], ShiprocketController.prototype, "assignAwb", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ShiprocketController.prototype, "handleWebhook", null);
exports.ShiprocketController = ShiprocketController = __decorate([
    (0, common_1.Controller)('shiprocket'),
    __metadata("design:paramtypes", [shiprocket_service_1.ShiprocketService])
], ShiprocketController);
//# sourceMappingURL=shiprocket.controller.js.map