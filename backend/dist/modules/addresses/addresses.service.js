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
exports.AddressesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AddressesService = class AddressesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(user, dto) {
        return this.prisma.customerAddress.create({
            data: { ownerId: user.id, ...dto },
        });
    }
    listMine(user) {
        return this.prisma.customerAddress.findMany({
            where: { ownerId: user.id },
            orderBy: { createdAt: 'desc' },
        });
    }
    async remove(user, id) {
        const address = await this.prisma.customerAddress.findUnique({ where: { id } });
        if (!address) {
            throw new common_1.NotFoundException('Address not found.');
        }
        if (address.ownerId !== user.id) {
            throw new common_1.ForbiddenException('This address does not belong to you.');
        }
        await this.prisma.customerAddress.delete({ where: { id } });
        return { success: true };
    }
    async update(user, id, dto) {
        const address = await this.prisma.customerAddress.findUnique({ where: { id } });
        if (!address) {
            throw new common_1.NotFoundException('Address not found.');
        }
        if (address.ownerId !== user.id) {
            throw new common_1.ForbiddenException('This address does not belong to you.');
        }
        return this.prisma.customerAddress.update({
            where: { id },
            data: dto,
        });
    }
};
exports.AddressesService = AddressesService;
exports.AddressesService = AddressesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AddressesService);
//# sourceMappingURL=addresses.service.js.map