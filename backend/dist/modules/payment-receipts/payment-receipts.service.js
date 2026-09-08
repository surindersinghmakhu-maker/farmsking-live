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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentReceiptsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PaymentReceiptsService = class PaymentReceiptsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOneOrThrow(user, id) {
        const receipt = await this.prisma.paymentReceipt.findUnique({ where: { id } });
        if (!receipt) {
            throw new common_1.NotFoundException('Receipt not found.');
        }
        if (receipt.farmerId !== user.id) {
            throw new common_1.ForbiddenException('This receipt does not belong to you.');
        }
        return receipt;
    }
    async countMine(user) {
        const count = await this.prisma.paymentReceipt.count({ where: { farmerId: user.id } });
        return { count };
    }
};
exports.PaymentReceiptsService = PaymentReceiptsService;
exports.PaymentReceiptsService = PaymentReceiptsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentReceiptsService);
//# sourceMappingURL=payment-receipts.service.js.map