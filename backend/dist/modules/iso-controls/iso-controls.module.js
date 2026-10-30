"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsoControlsModule = void 0;
const common_1 = require("@nestjs/common");
const iso_controls_service_1 = require("./iso-controls.service");
const iso_controls_controller_1 = require("./iso-controls.controller");
const prisma_module_1 = require("../prisma/prisma.module");
let IsoControlsModule = class IsoControlsModule {
};
exports.IsoControlsModule = IsoControlsModule;
exports.IsoControlsModule = IsoControlsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        providers: [iso_controls_service_1.IsoControlsService],
        controllers: [iso_controls_controller_1.IsoControlsController],
        exports: [iso_controls_service_1.IsoControlsService],
    })
], IsoControlsModule);
//# sourceMappingURL=iso-controls.module.js.map