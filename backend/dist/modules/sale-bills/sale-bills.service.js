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
exports.SaleBillsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SaleBillsService = class SaleBillsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async nextBillNo() {
        const now = new Date();
        const fullYear = now.getFullYear();
        const yy = String(fullYear).slice(-2);
        const prefix = `FK-${yy}`;
        const latestBill = await this.prisma.saleBill.findFirst({
            where: {
                billNo: {
                    startsWith: prefix,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                billNo: true,
            },
        });
        let nextSeq = 1;
        if (latestBill && latestBill.billNo) {
            const seqPart = latestBill.billNo.slice(prefix.length);
            const parsed = parseInt(seqPart, 10);
            if (!isNaN(parsed) && parsed >= 1) {
                nextSeq = parsed + 1;
            }
            else {
                const startOfYear = new Date(fullYear, 0, 1);
                const count = await this.prisma.saleBill.count({
                    where: {
                        createdAt: {
                            gte: startOfYear,
                        },
                    },
                });
                nextSeq = count + 1;
            }
        }
        let paddedSeq = String(nextSeq).padStart(2, '0');
        let candidate = `${prefix}${paddedSeq}`;
        let exists = await this.prisma.saleBill.findFirst({ where: { billNo: candidate } });
        while (exists) {
            nextSeq++;
            paddedSeq = String(nextSeq).padStart(2, '0');
            candidate = `${prefix}${paddedSeq}`;
            exists = await this.prisma.saleBill.findFirst({ where: { billNo: candidate } });
        }
        return candidate;
    }
    async create(user, dto) {
        const billNo = await this.nextBillNo();
        const bill = await this.prisma.saleBill.create({
            data: {
                farmerId: user.id,
                billNo,
                farmerName: dto.farmerName,
                partyId: dto.partyId,
                partyName: dto.partyName,
                partyMobile: dto.partyMobile,
                partyAddress: dto.partyAddress,
                isCash: dto.isCash,
                items: dto.items,
                totalItems: dto.totalItems,
                totalAmount: dto.totalAmount,
                amountReceived: dto.amountReceived,
                thisSaleBalance: dto.thisSaleBalance,
                previousBalance: dto.previousBalance,
                netReceivable: dto.netReceivable,
            },
        });
        try {
            const userProfile = await this.prisma.user.findUnique({
                where: { id: user.id },
                select: { state: true, district: true },
            });
            const items = dto.items;
            if (Array.isArray(items)) {
                for (const item of items) {
                    if (item.cropName && Number(item.rate) > 0) {
                        const cleanName = item.cropName.split('(')[0].trim();
                        await this.prisma.marketRate.create({
                            data: {
                                cropName: cleanName,
                                variety: 'Farmer Sale',
                                market: userProfile?.district ? `${userProfile.district} Mandi` : 'Local Mandi',
                                state: userProfile?.state || 'Punjab',
                                district: userProfile?.district || null,
                                modalPrice: Number(item.rate),
                                minPrice: Number(item.rate),
                                maxPrice: Number(item.rate),
                                unit: item.unit || 'KG',
                                rateDate: new Date(),
                                source: 'farmer_sale_bill',
                            },
                        });
                    }
                }
            }
        }
        catch (err) {
            console.warn('Could not record market rate from sale bill:', err);
        }
        return bill;
    }
    async update(user, id, dto) {
        const existing = await this.findOneOrThrow(user, id);
        return this.prisma.saleBill.update({
            where: { id: existing.id },
            data: {
                farmerName: dto.farmerName,
                partyId: dto.partyId,
                partyName: dto.partyName,
                partyMobile: dto.partyMobile,
                partyAddress: dto.partyAddress,
                isCash: dto.isCash,
                items: dto.items,
                totalItems: dto.totalItems,
                totalAmount: dto.totalAmount,
                amountReceived: dto.amountReceived,
                thisSaleBalance: dto.thisSaleBalance,
                previousBalance: dto.previousBalance,
                netReceivable: dto.netReceivable,
            },
        });
    }
    async findOneOrThrow(user, id) {
        const bill = await this.prisma.saleBill.findUnique({ where: { id } });
        if (!bill) {
            throw new common_1.NotFoundException('Bill not found.');
        }
        if (bill.farmerId !== user.id) {
            throw new common_1.ForbiddenException('This bill does not belong to you.');
        }
        return bill;
    }
    async countMine(user) {
        const count = await this.prisma.saleBill.count({ where: { farmerId: user.id } });
        return { count };
    }
};
exports.SaleBillsService = SaleBillsService;
exports.SaleBillsService = SaleBillsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SaleBillsService);
//# sourceMappingURL=sale-bills.service.js.map