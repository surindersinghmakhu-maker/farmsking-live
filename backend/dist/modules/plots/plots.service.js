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
exports.PlotsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const farms_service_1 = require("../farms/farms.service");
let PlotsService = class PlotsService {
    prisma;
    farmsService;
    constructor(prisma, farmsService) {
        this.prisma = prisma;
        this.farmsService = farmsService;
    }
    async create(user, dto) {
        await this.farmsService.findOneOrThrow(user, dto.farmId);
        const { farmId, ...rest } = dto;
        return this.prisma.plot.create({ data: { ...rest, farmId } });
    }
    findAllForFarm(user, farmId) {
        return this.farmsService.findOneOrThrow(user, farmId).then(() => this.prisma.plot.findMany({
            where: { farmId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        }));
    }
    async findOneOrThrow(user, id) {
        const plot = await this.prisma.plot.findFirst({
            where: { id, deletedAt: null },
            include: { farm: true },
        });
        if (!plot || (user.role !== client_1.Role.ADMIN && user.role !== client_1.Role.SUPER_ADMIN && plot.farm.ownerId !== user.id)) {
            throw new common_1.NotFoundException('Plot not found.');
        }
        return plot;
    }
    async update(user, id, dto) {
        await this.findOneOrThrow(user, id);
        return this.prisma.plot.update({ where: { id }, data: dto });
    }
    async remove(user, id) {
        await this.findOneOrThrow(user, id);
        return this.prisma.plot.update({ where: { id }, data: { deletedAt: new Date() } });
    }
};
exports.PlotsService = PlotsService;
exports.PlotsService = PlotsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        farms_service_1.FarmsService])
], PlotsService);
//# sourceMappingURL=plots.service.js.map