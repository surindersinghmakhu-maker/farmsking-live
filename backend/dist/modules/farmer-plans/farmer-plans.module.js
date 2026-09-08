"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FarmerPlansModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const advisor_assignment_module_1 = require("../advisor-assignment/advisor-assignment.module");
const wallet_module_1 = require("../wallet/wallet.module");
const farmer_plans_service_1 = require("./farmer-plans.service");
const farmer_plans_controller_1 = require("./farmer-plans.controller");
let FarmerPlansModule = class FarmerPlansModule {
};
exports.FarmerPlansModule = FarmerPlansModule;
exports.FarmerPlansModule = FarmerPlansModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, advisor_assignment_module_1.AdvisorAssignmentModule, wallet_module_1.WalletModule],
        controllers: [farmer_plans_controller_1.FarmerPlansController],
        providers: [farmer_plans_service_1.FarmerPlansService],
        exports: [farmer_plans_service_1.FarmerPlansService],
    })
], FarmerPlansModule);
//# sourceMappingURL=farmer-plans.module.js.map