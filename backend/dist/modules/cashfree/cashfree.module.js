"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashfreeModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("../prisma/prisma.module");
const cashfree_service_1 = require("./cashfree.service");
const cashfree_controller_1 = require("./cashfree.controller");
let CashfreeModule = class CashfreeModule {
};
exports.CashfreeModule = CashfreeModule;
exports.CashfreeModule = CashfreeModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, prisma_module_1.PrismaModule],
        controllers: [cashfree_controller_1.CashfreeController],
        providers: [cashfree_service_1.CashfreeService],
        exports: [cashfree_service_1.CashfreeService],
    })
], CashfreeModule);
//# sourceMappingURL=cashfree.module.js.map