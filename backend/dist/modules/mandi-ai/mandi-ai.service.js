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
exports.MandiAIService = exports.CreatePriceLockDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
class CreatePriceLockDto {
    cropName;
    quantityQuintal;
    lockedRate;
    buyerId;
}
exports.CreatePriceLockDto = CreatePriceLockDto;
let MandiAIService = class MandiAIService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async get30DayPricePrediction(cropName = 'Wheat', mandiName = 'Khanna') {
        const existing = await this.prisma.mandiPricePrediction.findMany({
            where: { cropName, mandiName },
            orderBy: { predictedDate: 'asc' },
        });
        if (existing.length > 0)
            return existing;
        const basePrice = cropName.toLowerCase().includes('wheat') ? 2275 : 2320;
        const predictions = [];
        const today = new Date();
        for (let i = 1; i <= 30; i++) {
            const predDate = new Date(today);
            predDate.setDate(today.getDate() + i);
            const trendOffset = Math.sin(i / 5) * 60 + i * 4;
            const predictedPrice = Math.round(basePrice + trendOffset);
            predictions.push({
                cropName,
                mandiName,
                predictedDate: predDate,
                predictedPrice,
                confidenceScore: 0.92,
            });
        }
        await this.prisma.mandiPricePrediction.createMany({ data: predictions });
        return this.prisma.mandiPricePrediction.findMany({
            where: { cropName, mandiName },
            orderBy: { predictedDate: 'asc' },
        });
    }
    async createPriceLockContract(user, dto) {
        if (!dto.quantityQuintal || dto.quantityQuintal <= 0 || !dto.lockedRate || dto.lockedRate <= 0) {
            throw new common_1.BadRequestException('Provide valid quantity and locked rate');
        }
        const escrowDeposit = Math.round(dto.quantityQuintal * dto.lockedRate * 0.1 * 100) / 100;
        return this.prisma.priceLockContract.create({
            data: {
                farmerId: user.id,
                buyerId: dto.buyerId || user.id,
                cropName: dto.cropName,
                quantityQuintal: dto.quantityQuintal,
                lockedRate: dto.lockedRate,
                status: 'ACTIVE',
                escrowDeposit,
            },
        });
    }
    async getMyPriceLockContracts(user) {
        return this.prisma.priceLockContract.findMany({
            where: {
                OR: [{ farmerId: user.id }, { buyerId: user.id }],
            },
            include: {
                farmer: { select: { id: true, name: true, kingId: true } },
                buyer: { select: { id: true, name: true, kingId: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.MandiAIService = MandiAIService;
exports.MandiAIService = MandiAIService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MandiAIService);
//# sourceMappingURL=mandi-ai.service.js.map