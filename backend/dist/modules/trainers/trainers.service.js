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
exports.TrainersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const client_1 = require("@prisma/client");
let TrainersService = class TrainersService {
    constructor(prisma, walletService, whatsappBotService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.whatsappBotService = whatsappBotService;
    }
    async autoAssignFarmer(farmerId, state, district) {
        if (!state)
            return null;
        try {
            let assignment = district
                ? await this.prisma.trainerAssignment.findFirst({
                    where: {
                        state: { equals: state, mode: 'insensitive' },
                        district: { equals: district, mode: 'insensitive' },
                    },
                })
                : null;
            if (!assignment) {
                assignment = await this.prisma.trainerAssignment.findFirst({
                    where: { state: { equals: state, mode: 'insensitive' } },
                });
            }
            if (!assignment)
                return null;
            return await this.prisma.farmerTrainingLog.upsert({
                where: { farmerId },
                create: {
                    farmerId,
                    trainerId: assignment.trainerId,
                    state,
                    district: district || null,
                    status: client_1.TrainingStatus.PENDING_CALL,
                    payoutAmount: assignment.commissionRate,
                },
                update: {},
            });
        }
        catch (e) {
            console.warn('[TrainersService] Auto-assign error:', e);
            return null;
        }
    }
    async getMyAssignedFarmers(user) {
        const logs = await this.prisma.farmerTrainingLog.findMany({
            where: { trainerId: user.id },
            include: {
                farmer: {
                    select: {
                        id: true,
                        name: true,
                        mobile: true,
                        kingId: true,
                        village: true,
                        district: true,
                        state: true,
                        upiId: true,
                        sprayTankSizeL: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return logs;
    }
    async sendVerificationCode(trainerUser, farmerId) {
        const log = await this.prisma.farmerTrainingLog.findUnique({
            where: { farmerId },
            include: { farmer: { select: { mobile: true, name: true } } },
        });
        if (!log || log.trainerId !== trainerUser.id) {
            throw new common_1.NotFoundException('Farmer training record not found under your assigned list.');
        }
        if (log.status === client_1.TrainingStatus.VERIFIED_AND_PAID) {
            throw new common_1.BadRequestException('This farmer training has already been verified and paid.');
        }
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        await this.prisma.farmerTrainingLog.update({
            where: { farmerId },
            data: {
                verificationCode: code,
                status: client_1.TrainingStatus.WAITING_VERIFICATION,
            },
        });
        const msg = `🌾 *FarmsKing Training Verification Code* 🔑\n\n` +
            `Hello *${log.farmer.name || 'Farmer'}*,\n` +
            `Your Technical Trainer has requested to verify your app training completion.\n\n` +
            `Your 4-digit Verification Code is: *${code}*\n\n` +
            `Please share this code with your trainer only if you have received full app training. 🌾🚜`;
        this.whatsappBotService.sendDirectTextMessage(log.farmer.mobile, msg).catch(() => { });
        return {
            success: true,
            message: `4-digit verification code sent to farmer (${log.farmer.mobile}) via WhatsApp.`,
        };
    }
    async verifyTrainingWithCode(trainerUser, farmerId, inputCode, notes) {
        const log = await this.prisma.farmerTrainingLog.findUnique({
            where: { farmerId },
            include: { farmer: { select: { name: true, mobile: true, kingId: true } } },
        });
        if (!log || log.trainerId !== trainerUser.id) {
            throw new common_1.NotFoundException('Farmer training record not found under your assigned list.');
        }
        if (log.status === client_1.TrainingStatus.VERIFIED_AND_PAID) {
            throw new common_1.BadRequestException('Training already verified & paid for this farmer.');
        }
        if (!log.verificationCode || log.verificationCode.trim() !== inputCode.trim()) {
            throw new common_1.BadRequestException('Invalid 4-digit verification code. Please check with farmer.');
        }
        const assignment = await this.prisma.trainerAssignment.findFirst({
            where: { trainerId: trainerUser.id },
        });
        const rewardAmount = assignment?.commissionRate ?? 20.0;
        const walletTx = await this.walletService.credit(trainerUser.id, rewardAmount, `🎉 Technical Training Reward (Farmer Verified: ${log.farmer.name || log.farmer.kingId || log.farmer.mobile})`, { relatedUserId: farmerId });
        const updated = await this.prisma.farmerTrainingLog.update({
            where: { farmerId },
            data: {
                status: client_1.TrainingStatus.VERIFIED_AND_PAID,
                payoutAmount: rewardAmount,
                payoutTxId: walletTx.id,
                verifiedAt: new Date(),
                callNotes: notes || log.callNotes,
            },
        });
        return {
            success: true,
            rewardAmount,
            message: `✅ Training verified successfully! ₹${rewardAmount} credited to your FarmsKing Wallet.`,
            trainingLog: updated,
        };
    }
    async farmerInAppVerify(farmerUser, rating, notes) {
        const log = await this.prisma.farmerTrainingLog.findUnique({
            where: { farmerId: farmerUser.id },
            include: { farmer: { select: { name: true, kingId: true, mobile: true } } },
        });
        if (!log) {
            throw new common_1.NotFoundException('No pending training record found for your account.');
        }
        if (log.status === client_1.TrainingStatus.VERIFIED_AND_PAID) {
            return { success: true, message: 'Training already verified.' };
        }
        if (rating < 1 || rating > 5) {
            throw new common_1.BadRequestException('Rating must be between 1 and 5 stars.');
        }
        const settings = await this.prisma.appSetting.findUnique({ where: { id: 'default' } });
        let rewardAmount = 0;
        if (rating === 5) {
            rewardAmount = Number(settings?.trainerCommission5Star ?? 25.0);
        }
        else if (rating === 4) {
            rewardAmount = Number(settings?.trainerCommission4Star ?? 15.0);
        }
        else {
            rewardAmount = Number(settings?.trainerCommission3StarOrLower ?? 0.0);
        }
        let payoutTxId = null;
        if (rewardAmount > 0) {
            const walletTx = await this.walletService.credit(log.trainerId, rewardAmount, `🎉 Technical Training Reward (${rating}-Star Rating by ${log.farmer.name || log.farmer.kingId || log.farmer.mobile})`, { relatedUserId: farmerUser.id });
            payoutTxId = walletTx.id;
        }
        const updated = await this.prisma.farmerTrainingLog.update({
            where: { farmerId: farmerUser.id },
            data: {
                status: client_1.TrainingStatus.VERIFIED_AND_PAID,
                rating,
                payoutAmount: rewardAmount,
                payoutTxId,
                verifiedAt: new Date(),
                callNotes: notes || `Farmer Rated ${rating} Stars`,
            },
        });
        return {
            success: true,
            rewardAmount,
            message: rating >= 4
                ? `✨ Thank you! Your ${rating}-Star rating has been recorded.`
                : 'Thank you! Your feedback has been recorded.',
            log: updated,
        };
    }
    async getFarmerPendingTrainingBanner(farmerUser) {
        const log = await this.prisma.farmerTrainingLog.findUnique({
            where: { farmerId: farmerUser.id },
            include: {
                trainer: {
                    select: { id: true, name: true, mobile: true, photoUrl: true },
                },
            },
        });
        if (!log || log.status === client_1.TrainingStatus.VERIFIED_AND_PAID) {
            return { hasPending: false, training: null };
        }
        return {
            hasPending: true,
            training: {
                id: log.id,
                trainerName: log.trainer.name,
                trainerMobile: log.trainer.mobile,
                status: log.status,
            },
        };
    }
    async assignTrainerState(adminUser, trainerId, state, district, commissionRate = 20.0) {
        const trainer = await this.prisma.user.findUnique({ where: { id: trainerId } });
        if (!trainer) {
            throw new common_1.NotFoundException('Trainer user account not found.');
        }
        if (trainer.role !== client_1.Role.TECHNICAL_TRAINER) {
            const currentRoles = trainer.roles || [];
            await this.prisma.user.update({
                where: { id: trainerId },
                data: {
                    role: client_1.Role.TECHNICAL_TRAINER,
                    roles: Array.from(new Set([...currentRoles, client_1.Role.TECHNICAL_TRAINER])),
                },
            });
        }
        const assignment = await this.prisma.trainerAssignment.create({
            data: {
                trainerId,
                state: state.trim(),
                district: district?.trim() || null,
                commissionRate,
            },
        });
        return assignment;
    }
    async listTrainerAssignments() {
        return this.prisma.trainerAssignment.findMany({
            include: {
                trainer: {
                    select: { id: true, name: true, mobile: true, kingId: true, state: true, district: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async requestTrainerCall(farmerUser, preferredSlot = 'ANYTIME') {
        const log = await this.prisma.farmerTrainingLog.findUnique({
            where: { farmerId: farmerUser.id },
            include: {
                trainer: { select: { id: true, name: true, mobile: true } },
            },
        });
        if (!log) {
            throw new common_1.NotFoundException('No assigned Technical Trainer found for your account.');
        }
        const updated = await this.prisma.farmerTrainingLog.update({
            where: { farmerId: farmerUser.id },
            data: {
                isCallRequested: true,
                preferredCallSlot: preferredSlot,
                callRequestedAt: new Date(),
                status: client_1.TrainingStatus.PENDING_CALL,
            },
        });
        const msg = `📞 *New Farmer Call Request (FarmsKing Trainer)*\n\n` +
            `Farmer *${farmerUser.name || farmerUser.kingId || farmerUser.mobile}* requested phone assistance to learn the app.\n` +
            `Preferred Time Window: *${preferredSlot}*\n` +
            `Mobile Number: *${farmerUser.mobile}*\n\n` +
            `Please contact the farmer from your Trainer Dashboard. 🌾`;
        this.whatsappBotService.sendDirectTextMessage(log.trainer.mobile, msg).catch(() => { });
        return {
            success: true,
            message: '✅ Your call request has been recorded! Technical Trainer will call you shortly.',
            log: updated,
        };
    }
    async forwardToUplineTrainer(trainerUser, farmerId, forwardReason) {
        const log = await this.prisma.farmerTrainingLog.findUnique({
            where: { farmerId },
        });
        if (!log || log.trainerId !== trainerUser.id) {
            throw new common_1.NotFoundException('Farmer log not found under your assigned list.');
        }
        const uplineAssignment = await this.prisma.trainerAssignment.findFirst({
            where: {
                state: { equals: log.state, mode: 'insensitive' },
                level: client_1.TrainerLevel.UPLINE,
            },
        });
        const forwardedToId = uplineAssignment?.trainerId || null;
        const updated = await this.prisma.farmerTrainingLog.update({
            where: { farmerId },
            data: {
                isForwarded: true,
                forwardedToId,
                forwardReason,
                status: client_1.TrainingStatus.IN_PROGRESS,
            },
        });
        return {
            success: true,
            message: forwardedToId
                ? '⏩ Case forwarded successfully to Upline Senior Trainer.'
                : '⏩ Case marked as escalated.',
            log: updated,
        };
    }
    async updateTrainerAvailability(trainerUser, isAvailable, availableFrom, availableTo, shiftType) {
        const assignment = await this.prisma.trainerAssignment.findFirst({
            where: { trainerId: trainerUser.id },
        });
        if (!assignment) {
            throw new common_1.NotFoundException('Trainer assignment not found.');
        }
        return this.prisma.trainerAssignment.update({
            where: { id: assignment.id },
            data: {
                isAvailable,
                availableFrom: availableFrom || assignment.availableFrom,
                availableTo: availableTo || assignment.availableTo,
                shiftType: shiftType || assignment.shiftType,
            },
        });
    }
    async getAdminTrainerReports() {
        const [totalTrainers, totalLogs, pendingCalls, verifiedLogs, aggregatePayout] = await Promise.all([
            this.prisma.trainerAssignment.count(),
            this.prisma.farmerTrainingLog.count(),
            this.prisma.farmerTrainingLog.count({ where: { isCallRequested: true, status: client_1.TrainingStatus.PENDING_CALL } }),
            this.prisma.farmerTrainingLog.count({ where: { status: client_1.TrainingStatus.VERIFIED_AND_PAID } }),
            this.prisma.farmerTrainingLog.aggregate({ _sum: { payoutAmount: true } }),
        ]);
        const logs = await this.prisma.farmerTrainingLog.findMany({
            include: {
                farmer: { select: { name: true, mobile: true, kingId: true, state: true, district: true } },
                trainer: { select: { name: true, mobile: true, kingId: true } },
                forwardedTo: { select: { name: true, mobile: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return {
            summary: {
                totalTrainers,
                totalLogs,
                pendingCalls,
                verifiedLogs,
                totalPayoutDisbursed: aggregatePayout._sum.payoutAmount || 0,
            },
            logs,
        };
    }
};
exports.TrainersService = TrainersService;
exports.TrainersService = TrainersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        whatsapp_service_1.WhatsappBotService])
], TrainersService);
//# sourceMappingURL=trainers.service.js.map