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
exports.SatelliteController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const satellite_service_1 = require("./satellite.service");
let SatelliteController = class SatelliteController {
    satelliteService;
    constructor(satelliteService) {
        this.satelliteService = satelliteService;
    }
    getPlotSatelliteHealth(plotId) {
        return this.satelliteService.getPlotSatelliteHealth(plotId);
    }
};
exports.SatelliteController = SatelliteController;
__decorate([
    (0, common_1.Get)('plot/:plotId/health'),
    __param(0, (0, common_1.Param)('plotId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SatelliteController.prototype, "getPlotSatelliteHealth", null);
exports.SatelliteController = SatelliteController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('satellite'),
    __metadata("design:paramtypes", [satellite_service_1.SatelliteService])
], SatelliteController);
//# sourceMappingURL=satellite.controller.js.map