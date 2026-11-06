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
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(user, dto) {
        const existingCount = await this.prisma.customerAddress.count({
            where: { ownerId: user.id },
        });
        const shouldBeDefault = existingCount === 0 || dto.isDefault === true;
        if (shouldBeDefault && existingCount > 0) {
            await this.prisma.customerAddress.updateMany({
                where: { ownerId: user.id },
                data: { isDefault: false },
            });
        }
        return this.prisma.customerAddress.create({
            data: {
                ownerId: user.id,
                tag: dto.tag,
                line: dto.line,
                mobile: dto.mobile,
                postOffice: dto.postOffice,
                district: dto.district,
                state: dto.state,
                pincode: dto.pincode,
                isDefault: shouldBeDefault,
            },
        });
    }
    listMine(user) {
        return this.prisma.customerAddress.findMany({
            where: { ownerId: user.id },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });
    }
    async setDefault(user, id) {
        const address = await this.prisma.customerAddress.findUnique({ where: { id } });
        if (!address) {
            throw new common_1.NotFoundException('Address not found.');
        }
        if (address.ownerId !== user.id) {
            throw new common_1.ForbiddenException('This address does not belong to you.');
        }
        await this.prisma.customerAddress.updateMany({
            where: { ownerId: user.id },
            data: { isDefault: false },
        });
        return this.prisma.customerAddress.update({
            where: { id },
            data: { isDefault: true },
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
        const wasDefault = address.isDefault;
        await this.prisma.customerAddress.delete({ where: { id } });
        if (wasDefault) {
            const nextAddress = await this.prisma.customerAddress.findFirst({
                where: { ownerId: user.id },
                orderBy: { createdAt: 'desc' },
            });
            if (nextAddress) {
                await this.prisma.customerAddress.update({
                    where: { id: nextAddress.id },
                    data: { isDefault: true },
                });
            }
        }
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
        if (dto.isDefault === true) {
            await this.prisma.customerAddress.updateMany({
                where: { ownerId: user.id },
                data: { isDefault: false },
            });
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