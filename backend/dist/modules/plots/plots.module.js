"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlotsModule = void 0;
const common_1 = require("@nestjs/common");
const farms_module_1 = require("../farms/farms.module");
const plots_controller_1 = require("./plots.controller");
const plots_service_1 = require("./plots.service");
let PlotsModule = class PlotsModule {
};
exports.PlotsModule = PlotsModule;
exports.PlotsModule = PlotsModule = __decorate([
    (0, common_1.Module)({
        imports: [farms_module_1.FarmsModule],
        controllers: [plots_controller_1.PlotsController],
        providers: [plots_service_1.PlotsService],
        exports: [plots_service_1.PlotsService],
    })
], PlotsModule);
//# sourceMappingURL=plots.module.js.map