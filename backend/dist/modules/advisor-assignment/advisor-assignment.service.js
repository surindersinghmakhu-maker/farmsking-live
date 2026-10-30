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
exports.AdvisorAssignmentService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const wallet_service_1 = require("../wallet/wallet.service");
const whatsapp_group_sync_service_1 = require("../whatsapp/whatsapp-group-sync.service");
const auth_user_util_1 = require("../../common/utils/auth-user.util");
let AdvisorAssignmentService = class AdvisorAssignmentService {
    constructor(prisma, notificationsService, walletService, whatsAppGroupSyncService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.walletService = walletService;
        this.whatsAppGroupSyncService = whatsAppGroupSyncService;
        this.STANDARD_OR_PREMIUM_FARMER_CLAUSE = {
            farmer: { farmerPlan: { plan: { in: [client_1.FarmerSubscriptionPlan.PRO, client_1.FarmerSubscriptionPlan.SMART, client_1.FarmerSubscriptionPlan.SUPER] } } },
        };
        this.FARMER_BASIC_SELECT = {
            id: true,
            kingId: true,
            name: true,
            mobile: true,
            village: true,
            district: true,
            state: true,
            photoUrl: true,
            sprayTankSizeL: true,
            soilType: true,
            waterType: true,
            farmerPlan: { select: { plan: true, endDate: true, expiredAt: true } },
        };
    }
    async onApplicationBootstrap() {
        setTimeout(() => {
            this.reassignAllToSudhir().catch(err => console.error('Boot seed failed', err));
        }, 5000);
    }
    async reassignAllToSudhir() {
        const sudhirAdvisor = await this.prisma.user.findFirst({
            where: {
                name: { contains: 'Sudhir', mode: 'insensitive' },
                OR: [{ role: client_1.Role.ADVISOR }, { roles: { has: client_1.Role.ADVISOR } }],
                deletedAt: null,
            },
        });
        if (!sudhirAdvisor)
            return;
        await this.prisma.advisorAssignment.updateMany({
            where: {
                advisorId: { not: sudhirAdvisor.id },
            },
            data: {
                advisorId: sudhirAdvisor.id,
            },
        });
        await this.prisma.cropProblem.updateMany({
            where: {
                assignedAdvisorId: { not: sudhirAdvisor.id },
            },
            data: {
                assignedAdvisorId: sudhirAdvisor.id,
            },
        });
        await this.prisma.callRequest.updateMany({
            where: {
                advisorId: { not: sudhirAdvisor.id },
            },
            data: {
                advisorId: sudhirAdvisor.id,
            },
        });
    }
    async getFarmerStats(user) {
        const [active, inactive] = await Promise.all([
            this.prisma.advisorAssignment.count({
                where: { advisorId: user.id, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null, ...this.STANDARD_OR_PREMIUM_FARMER_CLAUSE },
            }),
            this.prisma.advisorAssignment.count({
                where: { advisorId: user.id, status: client_1.AdvisorAssignmentStatus.REVOKED, deletedAt: null, ...this.STANDARD_OR_PREMIUM_FARMER_CLAUSE },
            }),
        ]);
        return { total: active + inactive, active, inactive };
    }
    isAssignmentExpired(assignment) {
        return !!assignment.subscription?.endDate && assignment.subscription.endDate < new Date();
    }
    notExpiredClause() {
        return {
            OR: [{ subscriptionId: null }, { subscription: { endDate: null } }, { subscription: { endDate: { gt: new Date() } } }],
        };
    }
    findFarmersByStatus(user, status) {
        const requiredType = this.roleToAdvisorType(user);
        const clientRoleClause = requiredType === client_1.AdvisorType.GARDEN
            ? { OR: [{ role: client_1.Role.GARDENER }, { roles: { has: client_1.Role.GARDENER } }] }
            : { OR: [{ role: client_1.Role.FARMER }, { roles: { has: client_1.Role.FARMER } }] };
        const statusFilter = status === 'ACTIVE'
            ? client_1.AdvisorAssignmentStatus.ACTIVE
            : status === 'INACTIVE'
                ? client_1.AdvisorAssignmentStatus.REVOKED
                : status === 'PENDING'
                    ? client_1.AdvisorAssignmentStatus.PENDING
                    : { in: [client_1.AdvisorAssignmentStatus.ACTIVE, client_1.AdvisorAssignmentStatus.REVOKED, client_1.AdvisorAssignmentStatus.PENDING] };
        const activeClause = status === 'ACTIVE'
            ? {
                OR: [
                    { subscriptionId: null },
                    { subscription: { endDate: null } },
                    { subscription: { endDate: { gt: new Date() } } },
                ],
            }
            : {};
        return this.prisma.advisorAssignment.findMany({
            where: {
                advisorId: user.id,
                status: statusFilter,
                deletedAt: null,
                farmer: { deletedAt: null, ...clientRoleClause },
                ...activeClause,
            },
            include: {
                farmer: { select: this.FARMER_BASIC_SELECT },
                subscription: { include: { plan: true } },
            },
            orderBy: { startDate: 'desc' },
        });
    }
    async findFarmerDetail(user, farmerId) {
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: {
                farmerId,
                deletedAt: null,
                ...((0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADMIN) || (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SUPER_ADMIN) ? {} : { advisorId: user.id }),
            },
            include: { subscription: { include: { plan: true } } },
            orderBy: { startDate: 'desc' },
        });
        const isExpired = assignment ? this.isAssignmentExpired(assignment) : false;
        const farmer = await this.prisma.user.findFirst({
            where: { id: farmerId },
            select: {
                ...this.FARMER_BASIC_SELECT,
                createdAt: true,
                deletedAt: true,
                ...(isExpired
                    ? {}
                    : {
                        farms: {
                            where: { deletedAt: null },
                            include: {
                                plots: {
                                    where: { deletedAt: null },
                                    include: { cropCycles: { where: { deletedAt: null } } },
                                },
                            },
                        },
                    }),
            },
        });
        if (!farmer) {
            throw new common_1.NotFoundException('Farmer not found.');
        }
        return { farmer: { ...farmer, farms: farmer.farms ?? [] }, assignment, isExpired };
    }
    async getDoctorRatingStats(advisorIds) {
        if (!advisorIds.length)
            return new Map();
        const stats = await this.prisma.cropProblem.groupBy({
            by: ['assignedAdvisorId'],
            where: {
                assignedAdvisorId: { in: advisorIds },
                farmerRating: { not: null },
                deletedAt: null,
            },
            _avg: { farmerRating: true },
            _count: { farmerRating: true },
        });
        const map = new Map();
        for (const stat of stats) {
            if (stat.assignedAdvisorId && stat._count.farmerRating > 0 && stat._avg.farmerRating !== null) {
                const avg = Math.round(stat._avg.farmerRating * 10) / 10;
                const count = stat._count.farmerRating;
                map.set(stat.assignedAdvisorId, {
                    rating: avg,
                    ratingCount: count,
                    ratingLabel: `${avg} ★ (${count})`,
                });
            }
        }
        return map;
    }
    async findMyAdvisor(user) {
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: { farmerId: user.id, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
            include: {
                advisor: {
                    select: {
                        id: true,
                        name: true,
                        mobile: true,
                        village: true,
                        district: true,
                        state: true,
                        photoUrl: true,
                        specialization: true,
                        bio: true,
                        yearsExperience: true,
                    },
                },
            },
            orderBy: { startDate: 'desc' },
        });
        if (!assignment || !assignment.advisor)
            return assignment;
        const ratingMap = await this.getDoctorRatingStats([assignment.advisor.id]);
        const rStats = ratingMap.get(assignment.advisor.id) ?? { rating: null, ratingCount: 0, ratingLabel: 'No rating till now' };
        return {
            ...assignment,
            advisor: {
                ...assignment.advisor,
                ...rStats,
            },
        };
    }
    async listAvailableAdvisors(user) {
        const requiredType = this.roleToAdvisorType(user);
        const advisors = await this.prisma.user.findMany({
            where: {
                AND: [
                    { OR: [{ role: client_1.Role.ADVISOR }, { roles: { has: client_1.Role.ADVISOR } }] },
                    {
                        OR: [
                            { advisorType: requiredType },
                            ...(requiredType === client_1.AdvisorType.FARM ? [{ advisorType: null }] : []),
                        ],
                    },
                ],
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                photoUrl: true,
                specialization: true,
                bio: true,
                yearsExperience: true,
                village: true,
                district: true,
                state: true,
                isSeniorDoctor: true,
                seniorDoctorId: true,
                doctorConsultationFee: true,
                _count: { select: { advisorAssignmentsAsAdvisor: { where: { status: client_1.AdvisorAssignmentStatus.ACTIVE } } } },
            },
            orderBy: { createdAt: 'asc' },
        });
        const ratingMap = await this.getDoctorRatingStats(advisors.map((a) => a.id));
        return advisors.map(({ _count, ...advisor }) => {
            const rStats = ratingMap.get(advisor.id) ?? { rating: null, ratingCount: 0, ratingLabel: 'No rating till now' };
            return {
                ...advisor,
                activeFarmerCount: _count.advisorAssignmentsAsAdvisor,
                ...rStats,
            };
        });
    }
    async assertAdvisorAssignedToFarmer(advisorId, farmerId) {
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: { advisorId, farmerId, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null, ...this.notExpiredClause() },
        });
        if (!assignment) {
            throw new common_1.NotFoundException('You are not the assigned advisor for this farmer.');
        }
        return assignment;
    }
    async assertAdvisorAssignedToFarmerAnyExpiry(advisorId, farmerId) {
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: { advisorId, farmerId, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
        });
        if (!assignment) {
            throw new common_1.NotFoundException('You are not the assigned advisor for this farmer.');
        }
        return assignment;
    }
    async pickAdvisorForAssignment(advisorType) {
        const sudhirAdvisor = await this.prisma.user.findFirst({
            where: {
                name: { contains: 'Sudhir', mode: 'insensitive' },
                AND: [
                    { OR: [{ role: client_1.Role.ADVISOR }, { roles: { has: client_1.Role.ADVISOR } }] },
                    {
                        OR: [
                            { advisorType },
                            ...(advisorType === client_1.AdvisorType.FARM ? [{ advisorType: null }] : []),
                        ],
                    },
                ],
                deletedAt: null,
            },
            select: { id: true },
        });
        if (sudhirAdvisor && advisorType === client_1.AdvisorType.FARM) {
            return sudhirAdvisor.id;
        }
        const advisors = await this.prisma.user.findMany({
            where: {
                AND: [
                    { OR: [{ role: client_1.Role.ADVISOR }, { roles: { has: client_1.Role.ADVISOR } }] },
                    {
                        OR: [
                            { advisorType },
                            ...(advisorType === client_1.AdvisorType.FARM ? [{ advisorType: null }] : []),
                        ],
                    },
                ],
                deletedAt: null,
            },
            select: {
                id: true,
                _count: { select: { advisorAssignmentsAsAdvisor: { where: { status: client_1.AdvisorAssignmentStatus.ACTIVE } } } },
            },
        });
        if (advisors.length === 0) {
            throw new common_1.NotFoundException(`No ${advisorType === client_1.AdvisorType.FARM ? 'Crop Doctor / Farm Advisor' : 'Garden Advisor'} is available right now.`);
        }
        advisors.sort((a, b) => a._count.advisorAssignmentsAsAdvisor - b._count.advisorAssignmentsAsAdvisor);
        return advisors[0].id;
    }
    roleToAdvisorType(user) {
        if ((0, auth_user_util_1.hasActiveRole)(user, client_1.Role.GARDENER))
            return client_1.AdvisorType.GARDEN;
        return client_1.AdvisorType.FARM;
    }
    async createFromSubscription(subscriptionId, farmerId) {
        const assignee = await this.prisma.user.findFirst({ where: { id: farmerId, deletedAt: null } });
        if (!assignee) {
            throw new common_1.NotFoundException('User not found.');
        }
        const advisorType = this.roleToAdvisorType(assignee);
        const advisorId = await this.pickAdvisorForAssignment(advisorType);
        const assignment = await this.prisma.advisorAssignment.create({
            data: {
                advisorId,
                farmerId,
                subscriptionId,
                status: client_1.AdvisorAssignmentStatus.PENDING,
                assignedById: farmerId,
                startDate: new Date(),
            },
            include: { advisor: { select: { id: true, name: true, mobile: true } } },
        });
        await this.notificationsService.create(advisorId, client_1.NotificationType.SYSTEM, 'New farmer hire request', `${assignee.name} wants to hire you as their advisor. Review their profile and accept or reject.`);
        return assignment;
    }
    findMyPendingRequest(user) {
        return this.prisma.advisorAssignment.findFirst({
            where: {
                farmerId: user.id,
                status: { in: [client_1.AdvisorAssignmentStatus.PENDING, client_1.AdvisorAssignmentStatus.ADMIN_APPROVAL_PENDING] },
                deletedAt: null,
            },
            include: {
                advisor: { select: { id: true, name: true, photoUrl: true, specialization: true } },
            },
            orderBy: { startDate: 'desc' },
        });
    }
    async requestSpecificAdvisor(farmerId, advisorId) {
        const existingSame = await this.prisma.advisorAssignment.findFirst({
            where: {
                farmerId,
                advisorId,
                status: { in: [client_1.AdvisorAssignmentStatus.PENDING, client_1.AdvisorAssignmentStatus.ADMIN_APPROVAL_PENDING, client_1.AdvisorAssignmentStatus.ACTIVE] },
                deletedAt: null,
            },
        });
        if (existingSame) {
            return existingSame;
        }
        const farmer = await this.prisma.user.findFirst({ where: { id: farmerId, deletedAt: null } });
        if (!farmer) {
            throw new common_1.NotFoundException('User not found.');
        }
        const currentActive = await this.prisma.advisorAssignment.findFirst({
            where: { farmerId, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
            include: { advisor: { select: { id: true, name: true, mobile: true } } },
        });
        await this.prisma.advisorAssignment.updateMany({
            where: { farmerId, status: client_1.AdvisorAssignmentStatus.PENDING, deletedAt: null },
            data: { status: client_1.AdvisorAssignmentStatus.REVOKED, endDate: new Date(), notes: 'Replaced by new doctor hire request' },
        });
        const isDoctorChange = !!currentActive && currentActive.advisorId !== advisorId;
        const initialStatus = isDoctorChange
            ? client_1.AdvisorAssignmentStatus.ADMIN_APPROVAL_PENDING
            : client_1.AdvisorAssignmentStatus.PENDING;
        const assignment = await this.prisma.advisorAssignment.create({
            data: {
                advisorId,
                farmerId,
                status: initialStatus,
                assignedById: farmerId,
                startDate: new Date(),
                notes: isDoctorChange ? `Doctor Change Request from Dr. ${currentActive.advisor.name}` : undefined,
            },
            include: {
                advisor: { select: { id: true, name: true, mobile: true, photoUrl: true, specialization: true, bio: true, yearsExperience: true } },
            },
        });
        if (isDoctorChange) {
            const admins = await this.prisma.user.findMany({
                where: { roles: { hasSome: [client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN] }, deletedAt: null },
                select: { id: true },
            });
            for (const admin of admins) {
                await this.notificationsService.create(admin.id, client_1.NotificationType.SYSTEM, 'Doctor Change Request Pending Review', `Farmer ${farmer.name} requested to switch doctor from Dr. ${currentActive.advisor.name} to Dr. ${assignment.advisor.name}. Admin review required.`);
            }
            await this.notificationsService.create(farmerId, client_1.NotificationType.SYSTEM, 'Doctor Change Request Submitted', 'Your request to change crop doctor has been submitted to Admin for approval. Admin will notify your current doctor.');
        }
        else {
            await this.notificationsService.create(advisorId, client_1.NotificationType.SYSTEM, 'New farmer hire request', `${farmer.name} wants to hire you as their advisor. Review their profile and accept or reject.`);
        }
        return assignment;
    }
    async findPendingDoctorChangeRequests() {
        return this.prisma.advisorAssignment.findMany({
            where: { status: client_1.AdvisorAssignmentStatus.ADMIN_APPROVAL_PENDING, deletedAt: null },
            include: {
                farmer: { select: { id: true, name: true, mobile: true, kingId: true, state: true, district: true } },
                advisor: { select: { id: true, name: true, mobile: true, photoUrl: true, specialization: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async adminApproveDoctorChange(adminUser, assignmentId) {
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: { id: assignmentId, status: client_1.AdvisorAssignmentStatus.ADMIN_APPROVAL_PENDING, deletedAt: null },
            include: {
                farmer: { select: { id: true, name: true, mobile: true } },
                advisor: { select: { id: true, name: true, mobile: true } },
            },
        });
        if (!assignment) {
            throw new common_1.NotFoundException('Pending Doctor Change Request not found.');
        }
        const currentActive = await this.prisma.advisorAssignment.findFirst({
            where: { farmerId: assignment.farmerId, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
            include: { advisor: { select: { id: true, name: true } } },
        });
        if (currentActive) {
            await this.notificationsService.create(currentActive.advisorId, client_1.NotificationType.SYSTEM, 'Farmer Doctor Change Notice', `Farmer ${assignment.farmer.name} is changing their crop doctor. Admin has approved the request.`);
        }
        const updated = await this.prisma.advisorAssignment.update({
            where: { id: assignmentId },
            data: { status: client_1.AdvisorAssignmentStatus.PENDING },
        });
        await this.notificationsService.create(assignment.advisorId, client_1.NotificationType.SYSTEM, 'New farmer hire request', `${assignment.farmer.name} wants to hire you as their advisor. Review their profile and accept or reject.`);
        await this.notificationsService.create(assignment.farmerId, client_1.NotificationType.SYSTEM, 'Doctor Change Request Approved by Admin', `Admin approved your doctor change request! Request has been forwarded to Dr. ${assignment.advisor.name}.`);
        return updated;
    }
    async adminRejectDoctorChange(adminUser, assignmentId, reason) {
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: { id: assignmentId, status: client_1.AdvisorAssignmentStatus.ADMIN_APPROVAL_PENDING, deletedAt: null },
        });
        if (!assignment) {
            throw new common_1.NotFoundException('Pending Doctor Change Request not found.');
        }
        const updated = await this.prisma.advisorAssignment.update({
            where: { id: assignmentId },
            data: {
                status: client_1.AdvisorAssignmentStatus.REVOKED,
                endDate: new Date(),
                notes: `Doctor change rejected by Admin: ${reason || 'No reason specified'}`,
            },
        });
        await this.notificationsService.create(assignment.farmerId, client_1.NotificationType.SYSTEM, 'Doctor Change Request Update', `Your doctor change request was not approved by Admin${reason ? `: ${reason}` : '.'}`);
        return updated;
    }
    async cancelMyPendingRequest(user) {
        const pending = await this.prisma.advisorAssignment.findFirst({
            where: { farmerId: user.id, status: client_1.AdvisorAssignmentStatus.PENDING, deletedAt: null },
        });
        if (!pending) {
            throw new common_1.NotFoundException('No pending advisor request found.');
        }
        const updated = await this.prisma.advisorAssignment.update({
            where: { id: pending.id },
            data: { status: client_1.AdvisorAssignmentStatus.REVOKED, endDate: new Date(), notes: 'Cancelled by farmer' },
        });
        return updated;
    }
    async accept(user, id) {
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: { id, advisorId: user.id, deletedAt: null },
        });
        if (!assignment) {
            throw new common_1.NotFoundException('Hire request not found.');
        }
        if (assignment.status !== client_1.AdvisorAssignmentStatus.PENDING) {
            throw new common_1.ConflictException('This request has already been responded to.');
        }
        const updated = await this.prisma.advisorAssignment.update({
            where: { id },
            data: { status: client_1.AdvisorAssignmentStatus.ACTIVE, startDate: new Date() },
        });
        await this.prisma.advisorAssignment.updateMany({
            where: {
                farmerId: assignment.farmerId,
                id: { not: assignment.id },
                status: { in: [client_1.AdvisorAssignmentStatus.ACTIVE, client_1.AdvisorAssignmentStatus.PENDING] },
                deletedAt: null,
            },
            data: { status: client_1.AdvisorAssignmentStatus.REVOKED, endDate: new Date(), notes: 'Replaced by new doctor acceptance' },
        });
        await this.payoutAdvisorShareOnAccept(assignment.farmerId, user.id);
        await this.notificationsService.create(assignment.farmerId, client_1.NotificationType.SYSTEM, 'Advisor accepted your request', 'Your advisor has accepted your hire request — you can now chat and get crop guidance.');
        this.whatsAppGroupSyncService.syncSingleFarmerGroupStatus(assignment.farmerId).catch(() => { });
        return updated;
    }
    async payoutAdvisorShareOnAccept(farmerId, advisorId) {
        const plan = await this.prisma.farmerPlan.findUnique({ where: { farmerId } });
        if (!plan?.endDate || plan.endDate <= new Date())
            return;
        if (plan.plan === client_1.FarmerSubscriptionPlan.FREE)
            return;
        const pricing = await this.prisma.farmerPlanPricing.findFirst({ where: { plan: plan.plan } });
        if (!pricing?.advisorShareValue)
            return;
        const daysRemaining = Math.ceil((plan.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        const ratio = daysRemaining / pricing.billingPeriodDays;
        const amount = Math.round(Number(pricing.advisorShareValue) * ratio * 100) / 100;
        if (amount <= 0)
            return;
        const farmer = await this.prisma.user.findUnique({ where: { id: farmerId }, select: { name: true, kingId: true } });
        const advisor = await this.prisma.user.findUnique({ where: { id: advisorId }, select: { id: true, seniorDoctorId: true, name: true } });
        const recipientId = advisor?.seniorDoctorId || advisorId;
        const farmerLabel = farmer ? `${farmer.name}${farmer.kingId ? ` (ID: ${farmer.kingId})` : ''}` : 'a farmer';
        const advisorLabel = advisor?.seniorDoctorId ? ` (via Assistant Doctor ${advisor.name})` : '';
        await this.walletService.credit(recipientId, amount, `Advisor fee for ${plan.plan} plan — accepted ${farmerLabel}${advisorLabel} on ${new Date().toLocaleDateString('en-IN')}`, { relatedUserId: farmerId });
    }
    async reject(user, id, reason) {
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: { id, advisorId: user.id, deletedAt: null },
        });
        if (!assignment) {
            throw new common_1.NotFoundException('Hire request not found.');
        }
        if (assignment.status !== client_1.AdvisorAssignmentStatus.PENDING) {
            throw new common_1.ConflictException('This request has already been responded to.');
        }
        const updated = await this.prisma.advisorAssignment.update({
            where: { id },
            data: { status: client_1.AdvisorAssignmentStatus.REVOKED, endDate: new Date(), notes: reason?.trim() || undefined },
        });
        await this.notificationsService.create(assignment.farmerId, client_1.NotificationType.SYSTEM, 'Advisor request declined', reason?.trim()
            ? `Your advisor request was declined: ${reason.trim()}. You can send another request.`
            : 'Your advisor request was declined. You can send another request.');
        this.whatsAppGroupSyncService.syncSingleFarmerGroupStatus(assignment.farmerId).catch(() => { });
        return updated;
    }
    async create(user, dto) {
        const existing = await this.prisma.advisorAssignment.findFirst({
            where: { farmerId: dto.farmerId, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
        });
        if (existing) {
            throw new common_1.ConflictException('This farmer already has an active advisor assignment.');
        }
        const [advisor, assignee] = await Promise.all([
            this.prisma.user.findFirst({ where: { id: dto.advisorId, deletedAt: null } }),
            this.prisma.user.findFirst({ where: { id: dto.farmerId, deletedAt: null } }),
        ]);
        if (!advisor || !(0, auth_user_util_1.hasActiveRole)(advisor, client_1.Role.ADVISOR)) {
            throw new common_1.BadRequestException('advisorId must belong to a user with the ADVISOR role.');
        }
        if (!assignee) {
            throw new common_1.NotFoundException('User not found.');
        }
        const requiredType = this.roleToAdvisorType(assignee);
        if (advisor.advisorType !== requiredType) {
            throw new common_1.BadRequestException(`A ${requiredType === client_1.AdvisorType.FARM ? 'Farm' : 'Garden'} Advisor is required for this user.`);
        }
        return this.prisma.advisorAssignment.create({
            data: {
                advisorId: dto.advisorId,
                farmerId: dto.farmerId,
                subscriptionId: dto.subscriptionId,
                status: client_1.AdvisorAssignmentStatus.ACTIVE,
                assignedById: user.id,
                startDate: new Date(),
            },
        });
    }
    async findOneOrThrow(user, id) {
        const assignment = await this.prisma.advisorAssignment.findFirst({ where: { id, deletedAt: null } });
        if (!assignment ||
            (user.role !== client_1.Role.ADMIN &&
                user.role !== client_1.Role.SUPER_ADMIN &&
                assignment.advisorId !== user.id &&
                assignment.farmerId !== user.id)) {
            throw new common_1.NotFoundException('Advisor assignment not found.');
        }
        return assignment;
    }
    async revoke(user, id) {
        const assignment = await this.findOneOrThrow(user, id);
        const updated = await this.prisma.advisorAssignment.update({
            where: { id },
            data: { status: client_1.AdvisorAssignmentStatus.REVOKED, endDate: new Date() },
        });
        this.whatsAppGroupSyncService.syncSingleFarmerGroupStatus(assignment.farmerId).catch(() => { });
        return updated;
    }
    async sendRenewalReminder(user, farmerId) {
        const hadAssignment = await this.prisma.advisorAssignment.findFirst({
            where: { advisorId: user.id, farmerId, deletedAt: null },
        });
        if (!hadAssignment) {
            throw new common_1.NotFoundException('This farmer has never been assigned to you.');
        }
        const farmer = await this.prisma.user.findFirst({ where: { id: farmerId, deletedAt: null }, select: { name: true } });
        if (!farmer) {
            throw new common_1.NotFoundException('Farmer not found.');
        }
        await this.notificationsService.create(farmerId, client_1.NotificationType.PAYMENT_DUE, 'Renew your plan', `Your advisor ${user.name} is waiting to help you again — renew your plan to restore your advisor support.`, { advisorId: user.id, isReminder: true });
        return { success: true };
    }
};
exports.AdvisorAssignmentService = AdvisorAssignmentService;
exports.AdvisorAssignmentService = AdvisorAssignmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        wallet_service_1.WalletService,
        whatsapp_group_sync_service_1.WhatsAppGroupSyncService])
], AdvisorAssignmentService);
//# sourceMappingURL=advisor-assignment.service.js.map