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
var IsoControlsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsoControlsService = exports.DEFAULT_ISO_MODULES = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
exports.DEFAULT_ISO_MODULES = [
    {
        moduleKey: 'ADMIN',
        moduleName: 'Admin Control Center',
        maintenanceMessage: 'The Admin Management module is currently undergoing scheduled ISO compliance maintenance.',
    },
    {
        moduleKey: 'ECOMMERCE',
        moduleName: 'AgriStore E-Commerce',
        maintenanceMessage: 'AgriStore E-Commerce & Shopping is currently under scheduled maintenance.',
    },
    {
        moduleKey: 'CUSTOMER_FARMER_DASHBOARD',
        moduleName: 'Customer / Farmer Dashboard',
        maintenanceMessage: 'Customer & Farmer Tools are undergoing scheduled maintenance.',
    },
    {
        moduleKey: 'FARMER_DOCTOR',
        moduleName: 'Farmer Doctor & Crop Consultations',
        maintenanceMessage: 'Farmer Doctor Services are temporarily paused for maintenance.',
    },
    {
        moduleKey: 'GARDENER_DASHBOARD',
        moduleName: 'Gardener Dashboard',
        maintenanceMessage: 'Gardener Portal & Tools are currently undergoing maintenance.',
    },
    {
        moduleKey: 'GARDEN_ADVISOR',
        moduleName: 'Garden Advisor Services',
        maintenanceMessage: 'Garden Advisor Portal is currently undergoing scheduled maintenance.',
    },
    {
        moduleKey: 'STAFF_PORTAL',
        moduleName: 'Staff Portal & Technical Trainers',
        maintenanceMessage: 'Staff & Technical Trainer Services are under scheduled maintenance.',
    },
    {
        moduleKey: 'WALLET',
        moduleName: 'Wallet & Payout Engine',
        maintenanceMessage: 'Wallet Services & Payout operations are under scheduled maintenance.',
    },
    {
        moduleKey: 'ACCOUNTS',
        moduleName: 'Accounts & Financial Ledger',
        maintenanceMessage: 'Accounts & Financial Ledger module is undergoing scheduled maintenance.',
    },
];
let IsoControlsService = IsoControlsService_1 = class IsoControlsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(IsoControlsService_1.name);
    }
    async onModuleInit() {
        await this.seedDefaultModules();
    }
    async seedDefaultModules() {
        try {
            for (const mod of exports.DEFAULT_ISO_MODULES) {
                const existing = await this.prisma.isoModuleControl.findUnique({
                    where: { moduleKey: mod.moduleKey },
                });
                if (!existing) {
                    await this.prisma.isoModuleControl.create({
                        data: {
                            moduleKey: mod.moduleKey,
                            moduleName: mod.moduleName,
                            isEnabled: true,
                            maintenanceMessage: mod.maintenanceMessage,
                        },
                    });
                    this.logger.log(`Initialized ISO Module Control: ${mod.moduleKey}`);
                }
            }
        }
        catch (err) {
            this.logger.warn(`Failed to seed ISO module controls: ${err.message}`);
        }
    }
    async getAllModuleControls() {
        return this.prisma.isoModuleControl.findMany({
            orderBy: { createdAt: 'asc' },
        });
    }
    async getModuleControl(moduleKey) {
        const mod = await this.prisma.isoModuleControl.findUnique({
            where: { moduleKey: moduleKey.toUpperCase() },
        });
        if (!mod) {
            throw new common_1.NotFoundException(`ISO Module ${moduleKey} not found.`);
        }
        return mod;
    }
    async toggleModule(moduleKey, isEnabled, maintenanceMessage, actorId, actorName) {
        const key = moduleKey.toUpperCase();
        const existing = await this.prisma.isoModuleControl.findUnique({
            where: { moduleKey: key },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`ISO Module ${moduleKey} not found.`);
        }
        const updated = await this.prisma.isoModuleControl.update({
            where: { moduleKey: key },
            data: {
                isEnabled,
                maintenanceMessage: maintenanceMessage ?? existing.maintenanceMessage,
                updatedById: actorId,
            },
        });
        await this.prisma.isoAuditLog.create({
            data: {
                action: 'MODULE_TOGGLE',
                moduleKey: key,
                actorId: actorId || 'SYSTEM_ADMIN',
                actorName: actorName || 'Admin User',
                details: {
                    previousState: existing.isEnabled,
                    newState: isEnabled,
                    maintenanceMessage: updated.maintenanceMessage,
                },
            },
        });
        this.logger.log(`ISO Module [${key}] state toggled to ${isEnabled} by ${actorName || actorId}`);
        return updated;
    }
    async getAuditLogs() {
        return this.prisma.isoAuditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
};
exports.IsoControlsService = IsoControlsService;
exports.IsoControlsService = IsoControlsService = IsoControlsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IsoControlsService);
//# sourceMappingURL=iso-controls.service.js.map