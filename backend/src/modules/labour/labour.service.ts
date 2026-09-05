import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMode, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { generateUniqueKingId } from '../../common/utils/king-id.util';
import { CreateLabourWorkerDto, UpdateLabourWorkerDto } from './dto/create-labour-worker.dto';
import { CreateWorkEntryDto } from './dto/create-work-entry.dto';
import { CreateLabourPaymentDto } from './dto/create-labour-payment.dto';

@Injectable()
export class LabourService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new Labour worker.
   * If a mobile number is provided, automatically creates/links a User account with role LABOUR
   * where the password is set to the mobile number for Labour login!
   */
  async createWorker(farmerId: string, dto: CreateLabourWorkerDto) {
    let userId: string | undefined = undefined;

    if (dto.mobile?.trim()) {
      const cleanMobile = dto.mobile.trim();
      let user = await this.prisma.user.findUnique({ where: { mobile: cleanMobile } });

      if (!user) {
        const passwordHash = await argon2.hash(cleanMobile);
        const kingId = await generateUniqueKingId(this.prisma);
        user = await this.prisma.user.create({
          data: {
            kingId,
            mobile: cleanMobile,
            passwordHash,
            name: dto.name,
            role: Role.LABOUR,
            roles: [Role.LABOUR],
          },
        });
      } else {
        if (!user.roles.includes(Role.LABOUR)) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { roles: { push: Role.LABOUR } },
          });
        }
      }

      // Check if user account is already linked to a LabourWorker to avoid unique constraint error
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

  /** Get list of workers created by the farmer with calculated financial balances. */
  async getWorkersForFarmer(farmerId: string) {
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

  /** Update worker details */
  async updateWorker(farmerId: string, id: string, dto: UpdateLabourWorkerDto) {
    const existing = await this.prisma.labourWorker.findFirst({
      where: { id, farmerId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Worker not found');
    }

    let userId = existing.userId;
    if (dto.mobile?.trim() && dto.mobile.trim() !== existing.mobile) {
      const cleanMobile = dto.mobile.trim();
      let user = await this.prisma.user.findUnique({ where: { mobile: cleanMobile } });
      if (!user) {
        const passwordHash = await argon2.hash(cleanMobile);
        const kingId = await generateUniqueKingId(this.prisma);
        user = await this.prisma.user.create({
          data: {
            kingId,
            mobile: cleanMobile,
            passwordHash,
            name: dto.name || existing.name,
            role: Role.LABOUR,
            roles: [Role.LABOUR],
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

  /** Delete worker */
  async deleteWorker(farmerId: string, id: string) {
    const existing = await this.prisma.labourWorker.findFirst({
      where: { id, farmerId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Worker not found');
    }
    return this.prisma.labourWorker.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** Record work done / attendance for a labour worker */
  async createWorkEntry(farmerId: string, recordedById: string, dto: CreateWorkEntryDto) {
    const worker = await this.prisma.labourWorker.findFirst({
      where: { id: dto.workerId, farmerId, deletedAt: null },
    });
    if (!worker) {
      throw new BadRequestException('Labour worker not found or does not belong to farmer.');
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

    // If assigned to a crop cycle, automatically log as a Crop Expense record!
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
                paymentMode: PaymentMode.CASH,
                recordedById,
              },
            });
          }
        }
      } catch (err) {
        // Silently log error without failing work entry creation
        console.error('Failed to auto-record crop expense for labour work entry:', err);
      }
    }

    return workEntry;
  }

  /** Get work entries filterable by worker */
  async getWorkEntries(farmerId: string, workerId?: string) {
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

  /** Record payment made to labour worker */
  async createPayment(farmerId: string, recordedById: string, dto: CreateLabourPaymentDto) {
    const worker = await this.prisma.labourWorker.findFirst({
      where: { id: dto.workerId, farmerId, deletedAt: null },
    });
    if (!worker) {
      throw new BadRequestException('Labour worker not found.');
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

  /** Get payments filterable by worker */
  async getPayments(farmerId: string, workerId?: string) {
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

  /** Detailed ledger statement per worker */
  async getWorkerStatement(farmerId: string, workerId: string) {
    const worker = await this.prisma.labourWorker.findFirst({
      where: { id: workerId, farmerId, deletedAt: null },
    });
    if (!worker) {
      throw new NotFoundException('Worker not found');
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

    // Combine into chronological entries timeline
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
      } else {
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

  /**
   * Labour Dashboard Data for logged-in Labour User account.
   */
  async getLabourDashboard(userId: string) {
    const worker = await this.prisma.labourWorker.findFirst({
      where: { userId, deletedAt: null },
      include: {
        farmer: { select: { id: true, name: true, mobile: true, village: true, photoUrl: true } },
      },
    });

    if (!worker) {
      throw new NotFoundException('No Labour profile associated with this account.');
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
}
