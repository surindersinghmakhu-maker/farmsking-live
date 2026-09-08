"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabourService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const king_id_util_1 = require("../../common/utils/king-id.util");
let LabourService = class LabourService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createWorker(farmerId, dto) {
        let userId = undefined;
        if (dto.mobile?.trim()) {
            const cleanMobile = dto.mobile.trim();
            let user = await this.prisma.user.findUnique({ where: { mobile: cleanMobile } });
            if (!user) {
                const passwordHash = await argon2.hash(cleanMobile);
                const kingId = await (0, king_id_util_1.generateUniqueKingId)(this.prisma);
                user = await this.prisma.user.create({
                    data: {
                        kingId,
                        mobile: cleanMobile,
                        passwordHash,
                        name: dto.name,
                        role: client_1.Role.LABOUR,
                        roles: [client_1.Role.LABOUR],
                    },
                });
            }
            else {
                if (!user.roles.includes(client_1.Role.LABOUR)) {
                    await this.prisma.user.update({
                        where: { id: user.id },
                        data: { roles: { push: client_1.Role.LABOUR } },
                    });
                }
            }
            const existingWorkerWithUser = await this.prisma.labourWorker.findFirst({
                where: { userId: user.id },
            });
            if (!existingWorkerWithUser) {
                userId = user.id;
            }
        }
        const worker = await this.prisma.labourWorker.create({
            data: {
                farmerId,
                farmId: dto.farmId,
                userId,
                name: dto.name,
                mobile: dto.mobile?.trim() || null,
                address: dto.address?.trim() || null,
                defaultDailyWage: dto.defaultRate !== undefined ? dto.defaultRate : null,
                defaultRate: dto.defaultRate !== undefined ? dto.defaultRate : null,
                defaultUnit: dto.defaultUnit || 'DAILY',
                notes: dto.notes?.trim() || null,
            },
            include: {
                user: { select: { id: true, mobile: true } },
            },
        });
        return worker;
    }
    async getWorkersForFarmer(farmerId) {
        const workers = await this.prisma.labourWorker.findMany({
            where: { farmerId, deletedAt: null },
            include: {
                workEntries: { where: { deletedAt: null } },
                payments: { where: { deletedAt: null } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return workers.map((w) => {
            const totalEarned = w.workEntries.reduce((sum, e) => sum + Number(e.totalAmount), 0);
            const totalPaid = w.payments.reduce((sum, p) => sum + Number(p.amount), 0);
            const pendingBalance = totalEarned - totalPaid;
            const { workEntries, payments, ...rest } = w;
            return {
                ...rest,
                totalEarned,
                totalPaid,
                pendingBalance,
            };
        });
    }
    async updateWorker(farmerId, id, dto) {
        const existing = await this.prisma.labourWorker.findFirst({
            where: { id, farmerId, deletedAt: null },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Worker not found');
        }
        let userId = existing.userId;
        if (dto.mobile?.trim() && dto.mobile.trim() !== existing.mobile) {
            const cleanMobile = dto.mobile.trim();
            let user = await this.prisma.user.findUnique({ where: { mobile: cleanMobile } });
            if (!user) {
                const passwordHash = await argon2.hash(cleanMobile);
                const kingId = await (0, king_id_util_1.generateUniqueKingId)(this.prisma);
                user = await this.prisma.user.create({
                    data: {
                        kingId,
                        mobile: cleanMobile,
                        passwordHash,
                        name: dto.name || existing.name,
                        role: client_1.Role.LABOUR,
                        roles: [client_1.Role.LABOUR],
                    },
                });
            }
            const existingWorkerWithUser = await this.prisma.labourWorker.findFirst({
                where: { userId: user.id },
            });
            if (!existingWorkerWithUser || existingWorkerWithUser.id === existing.id) {
                userId = user.id;
            }
        }
        return this.prisma.labourWorker.update({
            where: { id },
            data: {
                userId,
                ...(dto.name && { name: dto.name }),
                ...(dto.mobile !== undefined && { mobile: dto.mobile?.trim() || null }),
                ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
                ...(dto.defaultRate !== undefined && { defaultRate: dto.defaultRate }),
                ...(dto.defaultUnit && { defaultUnit: dto.defaultUnit }),
                ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null }),
            },
        });
    }
    async deleteWorker(farmerId, id) {
        const existing = await this.prisma.labourWorker.findFirst({
            where: { id, farmerId, deletedAt: null },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Worker not found');
        }
        return this.prisma.labourWorker.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async createWorkEntry(farmerId, recordedById, dto) {
        const worker = await this.prisma.labourWorker.findFirst({
            where: { id: dto.workerId, farmerId, deletedAt: null },
        });
        if (!worker) {
            throw new common_1.BadRequestException('Labour worker not found or does not belong to farmer.');
        }
        const totalAmount = dto.quantity * dto.rate;
        const workEntry = await this.prisma.labourWorkEntry.create({
            data: {
                farmerId,
                workerId: dto.workerId,
                farmId: dto.farmId || worker.farmId,
                plotId: dto.plotId,
                cropCycleId: dto.cropCycleId,
                workDate: new Date(dto.workDate),
                workType: dto.workType,
                unit: dto.unit,
                quantity: dto.quantity,
                rate: dto.rate,
                totalAmount,
                notes: dto.notes?.trim() || null,
                recordedById,
            },
            include: {
                worker: { select: { id: true, name: true } },
            },
        });
        if (dto.cropCycleId) {
            try {
                const cropCycle = await this.prisma.cropCycle.findUnique({
                    where: { id: dto.cropCycleId },
                    include: { plot: { select: { farmId: true } } },
                });
                if (cropCycle) {
                    let labourCat = await this.prisma.expenseCategory.findFirst({
                        where: {
                            OR: [
                                { key: { contains: 'labour', mode: 'insensitive' } },
                                { labelEn: { contains: 'Labour', mode: 'insensitive' } },
                                { labelHi: { contains: 'मजदूरी', mode: 'insensitive' } },
                            ],
                        },
                    });
                    if (!labourCat) {
                        labourCat = await this.prisma.expenseCategory.findFirst({ where: { isActive: true } });
                    }
                    if (labourCat) {
                        await this.prisma.expense.create({
                            data: {
                                farmId: cropCycle.plot.farmId,
                                plotId: cropCycle.plotId,
                                cropCycleId: dto.cropCycleId,
                                categoryId: labourCat.id,
                                amount: totalAmount,
                                expenseDate: new Date(dto.workDate),
                                notes: `👷 Labour Work: ${dto.workType} (${worker.name}) - ${dto.quantity} ${dto.unit} @ ₹${dto.rate}`,
                                paymentMode: client_1.PaymentMode.CASH,
                                recordedById,
                            },
                        });
                    }
                }
            }
            catch (err) {
                console.error('Failed to auto-record crop expense for labour work entry:', err);
            }
        }
        return workEntry;
    }
    async getWorkEntries(farmerId, workerId) {
        return this.prisma.labourWorkEntry.findMany({
            where: {
                farmerId,
                ...(workerId && { workerId }),
                deletedAt: null,
            },
            include: {
                worker: { select: { id: true, name: true, mobile: true } },
            },
            orderBy: { workDate: 'desc' },
        });
    }
    async createPayment(farmerId, recordedById, dto) {
        const worker = await this.prisma.labourWorker.findFirst({
            where: { id: dto.workerId, farmerId, deletedAt: null },
        });
        if (!worker) {
            throw new common_1.BadRequestException('Labour worker not found.');
        }
        return this.prisma.labourPayment.create({
            data: {
                farmerId,
                workerId: dto.workerId,
                paymentDate: new Date(dto.paymentDate),
                amount: dto.amount,
                paymentMode: dto.paymentMode || 'CASH',
                notes: dto.notes?.trim() || null,
                recordedById,
            },
            include: {
                worker: { select: { id: true, name: true } },
            },
        });
    }
    async getPayments(farmerId, workerId) {
        return this.prisma.labourPayment.findMany({
            where: {
                farmerId,
                ...(workerId && { workerId }),
                deletedAt: null,
            },
            include: {
                worker: { select: { id: true, name: true } },
            },
            orderBy: { paymentDate: 'desc' },
        });
    }
    async getWorkerStatement(farmerId, workerId) {
        const worker = await this.prisma.labourWorker.findFirst({
            where: { id: workerId, farmerId, deletedAt: null },
        });
        if (!worker) {
            throw new common_1.NotFoundException('Worker not found');
        }
        const workEntries = await this.prisma.labourWorkEntry.findMany({
            where: { workerId, deletedAt: null },
            orderBy: { workDate: 'asc' },
        });
        const payments = await this.prisma.labourPayment.findMany({
            where: { workerId, deletedAt: null },
            orderBy: { paymentDate: 'asc' },
        });
        const totalEarned = workEntries.reduce((sum, e) => sum + Number(e.totalAmount), 0);
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const pendingBalance = totalEarned - totalPaid;
        const combined = [
            ...workEntries.map((w) => ({
                id: w.id,
                type: 'WORK',
                date: w.workDate,
                title: w.workType,
                description: `${w.quantity} ${w.unit} @ ₹${w.rate}/${w.unit}`,
                amount: Number(w.totalAmount),
                notes: w.notes,
            })),
            ...payments.map((p) => ({
                id: p.id,
                type: 'PAYMENT',
                date: p.paymentDate,
                title: `Payment (${p.paymentMode || 'CASH'})`,
                description: `Payment Received`,
                amount: Number(p.amount),
                notes: p.notes,
            })),
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let running = 0;
        const timeline = combined.map((entry) => {
            if (entry.type === 'WORK') {
                running += entry.amount;
            }
            else {
                running -= entry.amount;
            }
            return {
                ...entry,
                runningBalance: running,
            };
        });
        return {
            worker,
            totalEarned,
            totalPaid,
            pendingBalance,
            timeline: [...timeline].reverse(),
            workEntries,
            payments,
        };
    }
    async getLabourDashboard(userId) {
        const worker = await this.prisma.labourWorker.findFirst({
            where: { userId, deletedAt: null },
            include: {
                farmer: { select: { id: true, name: true, mobile: true, village: true, photoUrl: true } },
            },
        });
        if (!worker) {
            throw new common_1.NotFoundException('No Labour profile associated with this account.');
        }
        const workEntries = await this.prisma.labourWorkEntry.findMany({
            where: { workerId: worker.id, deletedAt: null },
            orderBy: { workDate: 'desc' },
        });
        const payments = await this.prisma.labourPayment.findMany({
            where: { workerId: worker.id, deletedAt: null },
            orderBy: { paymentDate: 'desc' },
        });
        const totalEarned = workEntries.reduce((sum, e) => sum + Number(e.totalAmount), 0);
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const pendingBalance = totalEarned - totalPaid;
        return {
            worker: {
                id: worker.id,
                name: worker.name,
                mobile: worker.mobile,
                address: worker.address,
                defaultRate: worker.defaultRate,
                defaultUnit: worker.defaultUnit,
                farmer: worker.farmer,
            },
            summary: {
                totalEarned,
                totalPaid,
                pendingBalance,
            },
            workEntries,
            payments,
        };
    }
};
exports.LabourService = LabourService;
exports.LabourService = LabourService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LabourService);
//# sourceMappingURL=labour.service.js.map