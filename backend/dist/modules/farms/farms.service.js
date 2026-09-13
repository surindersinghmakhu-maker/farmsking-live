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
exports.FarmsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let FarmsService = class FarmsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(user, dto) {
        return this.prisma.farm.create({
            data: { ...dto, ownerId: user.id },
        });
    }
    findAll(user) {
        return this.prisma.farm.findMany({
            where: {
                deletedAt: null,
                ...(user.role === client_1.Role.ADMIN || user.role === client_1.Role.SUPER_ADMIN ? {} : { ownerId: user.id }),
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOneOrThrow(user, id) {
        const farm = await this.prisma.farm.findFirst({
            where: { id, deletedAt: null },
        });
        if (!farm || (user.role !== client_1.Role.ADMIN && user.role !== client_1.Role.SUPER_ADMIN && farm.ownerId !== user.id)) {
            throw new common_1.NotFoundException('Farm not found.');
        }
        return farm;
    }
    async update(user, id, dto) {
        await this.findOneOrThrow(user, id);
        return this.prisma.farm.update({ where: { id }, data: dto });
    }
    async remove(user, id) {
        await this.findOneOrThrow(user, id);
        return this.prisma.farm.update({ where: { id }, data: { deletedAt: new Date() } });
    }
};
exports.FarmsService = FarmsService;
exports.FarmsService = FarmsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FarmsService);
//# sourceMappingURL=farms.service.js.map