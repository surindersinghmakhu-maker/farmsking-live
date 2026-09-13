"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SatelliteModule = void 0;
const common_1 = require("@nestjs/common");
const satellite_service_1 = require("./satellite.service");
const satellite_controller_1 = require("./satellite.controller");
let SatelliteModule = class SatelliteModule {
};
exports.SatelliteModule = SatelliteModule;
exports.SatelliteModule = SatelliteModule = __decorate([
    (0, common_1.Module)({
        controllers: [satellite_controller_1.SatelliteController],
        providers: [satellite_service_1.SatelliteService],
        exports: [satellite_service_1.SatelliteService],
    })
], SatelliteModule);
//# sourceMappingURL=satellite.module.js.map