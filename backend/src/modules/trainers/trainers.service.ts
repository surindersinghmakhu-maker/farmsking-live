import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { WhatsappBotService } from '../whatsapp/whatsapp.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { Role, TrainingStatus } from '@prisma/client';

@Injectable()
export class TrainersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly whatsappBotService: WhatsappBotService,
  ) {}

  /** Auto-assign newly registered farmer to their State/District Technical Trainer */
  async autoAssignFarmer(farmerId: string, state?: string | null, district?: string | null) {
    if (!state) return null;

    try {
      // 1. Try finding trainer assigned to specific District + State
      let assignment = district
        ? await this.prisma.trainerAssignment.findFirst({
            where: {
              state: { equals: state, mode: 'insensitive' },
              district: { equals: district, mode: 'insensitive' },
            },
          })
        : null;

      // 2. Fallback to State-level trainer
      if (!assignment) {
        assignment = await this.prisma.trainerAssignment.findFirst({
          where: { state: { equals: state, mode: 'insensitive' } },
        });
      }

      if (!assignment) return null;

      // Create initial training log entry
      return await this.prisma.farmerTrainingLog.upsert({
        where: { farmerId },
        create: {
          farmerId,
          trainerId: assignment.trainerId,
          state,
          district: district || null,
          status: TrainingStatus.PENDING_CALL,
          payoutAmount: assignment.commissionRate,
        },
        update: {},
      });
    } catch (e) {
      console.warn('[TrainersService] Auto-assign error:', e);
      return null;
    }
  }

  /** Technical Trainer: fetch list of assigned farmers for welcome call & training */
  async getMyAssignedFarmers(user: AuthUser) {
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

  /** Technical Trainer: Send 4-digit training verification code via WhatsApp to Farmer */
  async sendVerificationCode(trainerUser: AuthUser, farmerId: string) {
    const log = await this.prisma.farmerTrainingLog.findUnique({
      where: { farmerId },
      include: { farmer: { select: { mobile: true, name: true } } },
    });

    if (!log || log.trainerId !== trainerUser.id) {
      throw new NotFoundException('Farmer training record not found under your assigned list.');
    }

    if (log.status === TrainingStatus.VERIFIED_AND_PAID) {
      throw new BadRequestException('This farmer training has already been verified and paid.');
    }

    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    await this.prisma.farmerTrainingLog.update({
      where: { farmerId },
      data: {
        verificationCode: code,
        status: TrainingStatus.WAITING_VERIFICATION,
      },
    });

    // Send WhatsApp OTP message to farmer
    const msg = `🌾 *FarmsKing Training Verification Code* 🔑\n\n` +
      `Hello *${log.farmer.name || 'Farmer'}*,\n` +
      `Your Technical Trainer has requested to verify your app training completion.\n\n` +
      `Your 4-digit Verification Code is: *${code}*\n\n` +
      `Please share this code with your trainer only if you have received full app training. 🌾🚜`;

    this.whatsappBotService.sendDirectTextMessage(log.farmer.mobile, msg).catch(() => {});

    return {
      success: true,
      message: `4-digit verification code sent to farmer (${log.farmer.mobile}) via WhatsApp.`,
    };
  }

  /** Technical Trainer: Enter 4-digit code to verify training and receive instant wallet payout */
  async verifyTrainingWithCode(trainerUser: AuthUser, farmerId: string, inputCode: string, notes?: string) {
    const log = await this.prisma.farmerTrainingLog.findUnique({
      where: { farmerId },
      include: { farmer: { select: { name: true, mobile: true, kingId: true } } },
    });

    if (!log || log.trainerId !== trainerUser.id) {
      throw new NotFoundException('Farmer training record not found under your assigned list.');
    }

    if (log.status === TrainingStatus.VERIFIED_AND_PAID) {
      throw new BadRequestException('Training already verified & paid for this farmer.');
    }

    if (!log.verificationCode || log.verificationCode.trim() !== inputCode.trim()) {
      throw new BadRequestException('Invalid 4-digit verification code. Please check with farmer.');
    }

    // Fetch trainer assignment rate or fallback to 20
    const assignment = await this.prisma.trainerAssignment.findFirst({
      where: { trainerId: trainerUser.id },
    });
    const rewardAmount = assignment?.commissionRate ?? 20.0;

    // 1. Credit wallet to Technical Trainer
    const walletTx = await this.walletService.credit(
      trainerUser.id,
      rewardAmount,
      `🎉 Technical Training Reward (Farmer Verified: ${log.farmer.name || log.farmer.kingId || log.farmer.mobile})`,
      { relatedUserId: farmerId },
    );

    // 2. Mark log as VERIFIED_AND_PAID
    const updated = await this.prisma.farmerTrainingLog.update({
      where: { farmerId },
      data: {
        status: TrainingStatus.VERIFIED_AND_PAID,
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

  /** Farmer In-App Rating & Verification: Farmer rates 1 to 5 Stars in FarmsKing App */
  async farmerInAppVerify(farmerUser: AuthUser, rating: number, notes?: string) {
    const log = await this.prisma.farmerTrainingLog.findUnique({
      where: { farmerId: farmerUser.id },
      include: { farmer: { select: { name: true, kingId: true, mobile: true } } },
    });

    if (!log) {
      throw new NotFoundException('No pending training record found for your account.');
    }

    if (log.status === TrainingStatus.VERIFIED_AND_PAID) {
      return { success: true, message: 'Training already verified.' };
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5 stars.');
    }

    // Fetch AppSettings for 3-Tier reward amounts or fallbacks:
    // 3 Stars or lower: ₹0, 4 Stars: ₹15, 5 Stars: ₹25
    const settings = await this.prisma.appSetting.findUnique({ where: { id: 'default' } });
    
    let rewardAmount = 0;
    if (rating === 5) {
      rewardAmount = Number((settings as any)?.trainerCommission5Star ?? 25.0);
    } else if (rating === 4) {
      rewardAmount = Number((settings as any)?.trainerCommission4Star ?? 15.0);
    } else {
      rewardAmount = Number((settings as any)?.trainerCommission3StarOrLower ?? 0.0);
    }

    let payoutTxId: string | null = null;

    // Credit wallet to Technical Trainer if reward > 0
    if (rewardAmount > 0) {
      const walletTx = await this.walletService.credit(
        log.trainerId,
        rewardAmount,
        `🎉 Technical Training Reward (${rating}-Star Rating by ${log.farmer.name || log.farmer.kingId || log.farmer.mobile})`,
        { relatedUserId: farmerUser.id },
      );
      payoutTxId = walletTx.id;
    }

    const updated = await this.prisma.farmerTrainingLog.update({
      where: { farmerId: farmerUser.id },
      data: {
        status: TrainingStatus.VERIFIED_AND_PAID,
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

  /** Check if current logged-in farmer has an unverified training confirmation banner pending */
  async getFarmerPendingTrainingBanner(farmerUser: AuthUser) {
    const log = await this.prisma.farmerTrainingLog.findUnique({
      where: { farmerId: farmerUser.id },
      include: {
        trainer: {
          select: { id: true, name: true, mobile: true, photoUrl: true },
        },
      },
    });

    if (!log || log.status === TrainingStatus.VERIFIED_AND_PAID) {
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

  /** Admin: Assign Technical Trainer to a State/District with commission rate */
  async assignTrainerState(
    adminUser: AuthUser,
    trainerId: string,
    state: string,
    district?: string,
    commissionRate: number = 20.0,
  ) {
    const trainer = await this.prisma.user.findUnique({ where: { id: trainerId } });
    if (!trainer) {
      throw new NotFoundException('Trainer user account not found.');
    }

    // Grant TECHNICAL_TRAINER role to user if not already present
    if (trainer.role !== Role.TECHNICAL_TRAINER) {
      const currentRoles = trainer.roles || [];
      await this.prisma.user.update({
        where: { id: trainerId },
        data: {
          role: Role.TECHNICAL_TRAINER,
          roles: Array.from(new Set([...currentRoles, Role.TECHNICAL_TRAINER])),
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

  /** Admin: List all active Technical Trainer State Assignments */
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

  /** Farmer: 1-Tap "📞 Call Me Request" to assigned Technical Trainer */
  async requestTrainerCall(farmerUser: AuthUser, preferredSlot: string = 'ANYTIME') {
    const log = await this.prisma.farmerTrainingLog.findUnique({
      where: { farmerId: farmerUser.id },
      include: {
        trainer: { select: { id: true, name: true, mobile: true } },
      },
    });

    if (!log) {
      throw new NotFoundException('No assigned Technical Trainer found for your account.');
    }

    const updated = await this.prisma.farmerTrainingLog.update({
      where: { farmerId: farmerUser.id },
      data: {
        isCallRequested: true,
        preferredCallSlot: preferredSlot,
        callRequestedAt: new Date(),
        status: TrainingStatus.PENDING_CALL,
      },
    });

    // Notify assigned trainer via WhatsApp
    const msg = `📞 *New Farmer Call Request (FarmsKing Trainer)*\n\n` +
      `Farmer *${farmerUser.name || farmerUser.kingId || farmerUser.mobile}* requested phone assistance to learn the app.\n` +
      `Preferred Time Window: *${preferredSlot}*\n` +
      `Mobile Number: *${farmerUser.mobile}*\n\n` +
      `Please contact the farmer from your Trainer Dashboard. 🌾`;

    this.whatsappBotService.sendDirectTextMessage(log.trainer.mobile, msg).catch(() => {});

    return {
      success: true,
      message: '✅ Your call request has been recorded! Technical Trainer will call you shortly.',
      log: updated,
    };
  }

  /** Baseline Trainer: Forward complex issue to Upline Senior Trainer */
  async forwardToUplineTrainer(trainerUser: AuthUser, farmerId: string, forwardReason: string) {
    const log = await this.prisma.farmerTrainingLog.findUnique({
      where: { farmerId },
    });

    if (!log || log.trainerId !== trainerUser.id) {
      throw new NotFoundException('Farmer log not found under your assigned list.');
    }

    // Find state Upline Senior Trainer
    const uplineAssignment = await this.prisma.trainerAssignment.findFirst({
      where: {
        state: { equals: log.state, mode: 'insensitive' },
        level: TrainerLevel.UPLINE,
      },
    });

    const forwardedToId = uplineAssignment?.trainerId || null;

    const updated = await this.prisma.farmerTrainingLog.update({
      where: { farmerId },
      data: {
        isForwarded: true,
        forwardedToId,
        forwardReason,
        status: TrainingStatus.IN_PROGRESS,
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

  /** Technical Trainer: Update duty hours / availability status (Online / Offline / Shift Hours) */
  async updateTrainerAvailability(
    trainerUser: AuthUser,
    isAvailable: boolean,
    availableFrom?: string,
    availableTo?: string,
    shiftType?: string,
  ) {
    const assignment = await this.prisma.trainerAssignment.findFirst({
      where: { trainerId: trainerUser.id },
    });

    if (!assignment) {
      throw new NotFoundException('Trainer assignment not found.');
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

  /** Admin: Complete Accountability Reports for Technical Trainer System */
  async getAdminTrainerReports() {
    const [totalTrainers, totalLogs, pendingCalls, verifiedLogs, aggregatePayout] = await Promise.all([
      this.prisma.trainerAssignment.count(),
      this.prisma.farmerTrainingLog.count(),
      this.prisma.farmerTrainingLog.count({ where: { isCallRequested: true, status: TrainingStatus.PENDING_CALL } }),
      this.prisma.farmerTrainingLog.count({ where: { status: TrainingStatus.VERIFIED_AND_PAID } }),
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
}
