"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MandiAIModule = void 0;
const common_1 = require("@nestjs/common");
const mandi_ai_service_1 = require("./mandi-ai.service");
const mandi_ai_controller_1 = require("./mandi-ai.controller");
let MandiAIModule = class MandiAIModule {
};
exports.MandiAIModule = MandiAIModule;
exports.MandiAIModule = MandiAIModule = __decorate([
    (0, common_1.Module)({
        controllers: [mandi_ai_controller_1.MandiAIController],
        providers: [mandi_ai_service_1.MandiAIService],
        exports: [mandi_ai_service_1.MandiAIService],
    })
], MandiAIModule);
//# sourceMappingURL=mandi-ai.module.js.map