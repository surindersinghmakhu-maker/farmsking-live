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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const advisor_assignment_service_1 = require("../advisor-assignment/advisor-assignment.service");
const whatsapp_group_sync_service_1 = require("../whatsapp/whatsapp-group-sync.service");
const DAY_MS = 24 * 60 * 60 * 1000;
let SubscriptionsService = class SubscriptionsService {
    prisma;
    advisorAssignmentService;
    whatsAppGroupSyncService;
    constructor(prisma, advisorAssignmentService, whatsAppGroupSyncService) {
        this.prisma = prisma;
        this.advisorAssignmentService = advisorAssignmentService;
        this.whatsAppGroupSyncService = whatsAppGroupSyncService;
    }
    async upgradePlanForSubscription(userId, billingCycle) {
        const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
        if (!user)
            return;
        const durationDays = billingCycle === 'YEARLY' ? 365 : 30;
        const now = new Date();
        if (user.role === client_1.Role.FARMER) {
            const current = await this.prisma.farmerPlan.findUnique({ where: { farmerId: userId } });
            const baseDate = current?.endDate && current.endDate > now ? current.endDate : now;
            const endDate = new Date(baseDate.getTime() + durationDays * DAY_MS);
            await this.prisma.farmerPlan.upsert({
                where: { farmerId: userId },
                create: { farmerId: userId, plan: client_1.FarmerSubscriptionPlan.PRO, endDate },
                update: { plan: client_1.FarmerSubscriptionPlan.PRO, endDate },
            });
        }
        else if (user.role === client_1.Role.GARDENER) {
            const current = await this.prisma.gardenerPlan.findUnique({ where: { gardenerId: userId } });
            const baseDate = current?.endDate && current.endDate > now ? current.endDate : now;
            const endDate = new Date(baseDate.getTime() + durationDays * DAY_MS);
            await this.prisma.gardenerPlan.upsert({
                where: { gardenerId: userId },
                create: { gardenerId: userId, plan: client_1.GardenerSubscriptionPlan.PREMIUM, endDate },
                update: { plan: client_1.GardenerSubscriptionPlan.PREMIUM, endDate },
            });
        }
    }
    listPlans() {
        return this.prisma.advisorPlan.findMany({
            where: { isActive: true },
            orderBy: { price: 'asc' },
        });
    }
    async create(user, dto) {
        if (user.role === client_1.Role.FARMER) {
            const farmerPlan = await this.prisma.farmerPlan.findUnique({ where: { farmerId: user.id } });
            const now = new Date();
            const isSoftwarePlanActive = Boolean(farmerPlan &&
                farmerPlan.plan !== client_1.FarmerSubscriptionPlan.FREE &&
                farmerPlan.endDate &&
                farmerPlan.endDate > now);
            if (!isSoftwarePlanActive) {
                throw new common_1.BadRequestException('You must have an active Paid Software Plan before hiring an Advisor.');
            }
        }
        const existing = await this.prisma.advisorSubscription.findFirst({
            where: { farmerId: user.id, status: client_1.SubscriptionPlanStatus.ACTIVE, deletedAt: null },
        });
        if (existing) {
            throw new common_1.ConflictException('You already have an active Farmer Advisor subscription.');
        }
        const plan = await this.prisma.advisorPlan.findFirst({ where: { id: dto.planId, isActive: true } });
        if (!plan) {
            throw new common_1.NotFoundException('Advisor plan not found.');
        }
        const now = new Date();
        const subscription = await this.prisma.advisorSubscription.create({
            data: {
                farmerId: user.id,
                planId: dto.planId,
                status: client_1.SubscriptionPlanStatus.ACTIVE,
                approvedAt: now,
                startDate: now,
            },
            include: { plan: true },
        });
        const assignment = await this.advisorAssignmentService.createFromSubscription(subscription.id, user.id);
        await this.upgradePlanForSubscription(user.id, plan.billingCycle);
        this.whatsAppGroupSyncService.syncSingleFarmerGroupStatus(user.id).catch(() => { });
        return { ...subscription, advisorAssignment: assignment };
    }
    findMine(user) {
        return this.prisma.advisorSubscription.findFirst({
            where: { farmerId: user.id, deletedAt: null },
            include: {
                plan: true,
                advisorAssignment: {
                    include: { advisor: { select: { id: true, name: true, mobile: true, village: true, district: true, state: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOneOrThrow(user, id) {
        const subscription = await this.prisma.advisorSubscription.findFirst({ where: { id, deletedAt: null } });
        if (!subscription || (user.role !== client_1.Role.ADMIN && user.role !== client_1.Role.SUPER_ADMIN && subscription.farmerId !== user.id)) {
            throw new common_1.NotFoundException('Subscription not found.');
        }
        return subscription;
    }
    async approve(user, id) {
        const subscription = await this.findOneOrThrow(user, id);
        const now = new Date();
        const updated = await this.prisma.advisorSubscription.update({
            where: { id },
            data: { status: client_1.SubscriptionPlanStatus.ACTIVE, approvedAt: now, approvedById: user.id, startDate: now },
        });
        const hasAssignment = await this.prisma.advisorAssignment.findFirst({ where: { subscriptionId: id } });
        if (!hasAssignment) {
            await this.advisorAssignmentService.createFromSubscription(id, subscription.farmerId);
        }
        const plan = await this.prisma.advisorPlan.findFirst({ where: { id: subscription.planId } });
        await this.upgradePlanForSubscription(subscription.farmerId, plan?.billingCycle ?? 'MONTHLY');
        this.whatsAppGroupSyncService.syncSingleFarmerGroupStatus(subscription.farmerId).catch(() => { });
        return updated;
    }
    async reject(user, id) {
        const subscription = await this.findOneOrThrow(user, id);
        const updated = await this.prisma.advisorSubscription.update({
            where: { id },
            data: { status: client_1.SubscriptionPlanStatus.REJECTED },
        });
        this.whatsAppGroupSyncService.syncSingleFarmerGroupStatus(subscription.farmerId).catch(() => { });
        return updated;
    }
    async cancel(user, id) {
        const subscription = await this.findOneOrThrow(user, id);
        const updated = await this.prisma.advisorSubscription.update({
            where: { id },
            data: { status: client_1.SubscriptionPlanStatus.CANCELLED, cancelledAt: new Date() },
        });
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: { subscriptionId: subscription.id, status: 'ACTIVE' },
        });
        if (assignment) {
            await this.advisorAssignmentService.revoke(user, assignment.id);
        }
        this.whatsAppGroupSyncService.syncSingleFarmerGroupStatus(subscription.farmerId).catch(() => { });
        return updated;
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        advisor_assignment_service_1.AdvisorAssignmentService,
        whatsapp_group_sync_service_1.WhatsAppGroupSyncService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map