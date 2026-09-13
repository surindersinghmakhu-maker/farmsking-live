"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaleBillsModule = void 0;
const common_1 = require("@nestjs/common");
const sale_bills_controller_1 = require("./sale-bills.controller");
const sale_bills_service_1 = require("./sale-bills.service");
let SaleBillsModule = class SaleBillsModule {
};
exports.SaleBillsModule = SaleBillsModule;
exports.SaleBillsModule = SaleBillsModule = __decorate([
    (0, common_1.Module)({
        controllers: [sale_bills_controller_1.SaleBillsController],
        providers: [sale_bills_service_1.SaleBillsService],
    })
], SaleBillsModule);
//# sourceMappingURL=sale-bills.module.js.map