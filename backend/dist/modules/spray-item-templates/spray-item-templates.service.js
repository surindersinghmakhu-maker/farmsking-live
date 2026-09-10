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
exports.SprayItemTemplatesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let SprayItemTemplatesService = class SprayItemTemplatesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(advisorId, dto) {
        return this.prisma.sprayItemTemplate.create({ data: { ...dto, advisorId } });
    }
    listMine(advisorId) {
        return this.prisma.sprayItemTemplate.findMany({
            where: { advisorId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
    }
    async listForMyAdvisor(farmerId) {
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: { farmerId, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
        });
        if (!assignment)
            return [];
        return this.listMine(assignment.advisorId);
    }
    listAll() {
        return this.prisma.sprayItemTemplate.findMany({
            where: { deletedAt: null },
            include: { advisor: { select: { id: true, name: true, kingId: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOwned(advisorId, id) {
        const existing = await this.prisma.sprayItemTemplate.findFirst({ where: { id, deletedAt: null } });
        if (!existing) {
            throw new common_1.NotFoundException('Item template not found.');
        }
        if (existing.advisorId !== advisorId) {
            throw new common_1.ForbiddenException('You can only manage your own item templates.');
        }
        return existing;
    }
    async update(advisorId, id, dto) {
        await this.findOwned(advisorId, id);
        return this.prisma.sprayItemTemplate.update({ where: { id }, data: dto });
    }
    async remove(advisorId, id) {
        await this.findOwned(advisorId, id);
        return this.prisma.sprayItemTemplate.update({ where: { id }, data: { deletedAt: new Date() } });
    }
};
exports.SprayItemTemplatesService = SprayItemTemplatesService;
exports.SprayItemTemplatesService = SprayItemTemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SprayItemTemplatesService);
//# sourceMappingURL=spray-item-templates.service.js.map