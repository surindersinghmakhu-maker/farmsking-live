import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMode, Role } from '@prisma/client';
import type { AuthUser } from '../../common/types/auth-user.type';
import * as argon2 from 'argon2';
import { generateUniqueKingId } from '../../common/utils/king-id.util';
import { CreateLabourWorkerDto, UpdateLabourWorkerDto } from './dto/create-labour-worker.dto';
import { CreateWorkEntryDto } from './dto/create-work-entry.dto';
import { CreateLabourPaymentDto } from './dto/create-labour-payment.dto';

@Injectable()
export class LabourService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search registered worker profiles & user account by 10-digit mobile number.
   * Collects all registered names created by ANY farmer across the entire database.
   */
  async searchByMobile(mobile: string) {
    const rawDigits = mobile ? mobile.replace(/\D/g, '') : '';
    const cleanMobile = rawDigits.slice(-10);
    if (!cleanMobile || cleanMobile.length !== 10) {
      return { exists: false, user: null, profiles: [] };
    }

    // Search ALL users matching the 10-digit mobile number using fast indexed lookups
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { mobile: cleanMobile },
          { mobile: `+91${cleanMobile}` },
          { mobile: { endsWith: cleanMobile } },
        ],
      },
      select: {
        id: true,
        kingId: true,
        mobile: true,
        name: true,
        photoUrl: true,
        village: true,
        district: true,
        state: true,
      },
      take: 5,
    });

    const userIds = users.map((u) => u.id);
    const primaryUser = users[0] || null;

    // Search ALL labourWorker profiles in the ENTIRE database matching mobile or linked user IDs
    const dbProfiles = await this.prisma.labourWorker.findMany({
      where: {
        OR: [
          { mobile: cleanMobile },
          { mobile: `+91${cleanMobile}` },
          { mobile: { endsWith: cleanMobile } },
          ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : []),
        ],
        deletedAt: null,
      },
      include: {
        farmer: { select: { id: true, name: true, village: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const profileMap = new Map<string, any>();

    // 1. Add User account names
    for (const u of users) {
      if (u.name?.trim()) {
        const key = u.name.trim().toLowerCase();
        profileMap.set(key, {
          id: `user-${u.id}`,
          name: u.name.trim(),
          relation: 'Head / Self',
          mobile: u.mobile,
          address: [u.village, u.district, u.state].filter(Boolean).join(', ') || null,
          photoUrl: u.photoUrl,
          defaultRate: null,
          defaultUnit: 'Days',
        });
      }
    }

    // 2. Add ALL labourWorker profiles created by ANY farmer across the ENTIRE database
    for (const p of dbProfiles) {
      if (!p.name?.trim()) continue;
      const key = p.name.trim().toLowerCase();
      if (!profileMap.has(key)) {
        profileMap.set(key, {
          id: p.id,
          name: p.name.trim(),
          relation: p.relation || 'Member',
          mobile: p.mobile || cleanMobile,
          address: p.address,
          photoUrl: p.photoUrl,
          defaultRate: p.defaultRate,
          defaultUnit: p.defaultUnit || 'Days',
          farmerName: p.farmer?.name || null,
        });
      }
    }

    const profiles = Array.from(profileMap.values());

    return {
      exists: users.length > 0 || profiles.length > 0,
      user: primaryUser,
      profiles,
    };
  }

  /**
   * Create a new Labour worker.
   * If a mobile number is provided, automatically links/creates 1 single User account with role LABOUR (1 King ID per mobile number).
   * Enforces duplicate name prevention under the same mobile number.
   */
  /**
   * Create a new Labour worker.
   * If a mobile number is provided, automatically links/creates 1 single User account with role LABOUR (1 King ID per mobile number).
   * Enforces duplicate name prevention under the same mobile number.
   */
  async createWorker(user: AuthUser, dto: CreateLabourWorkerDto) {
    let farmerId = user.id;
    if (user.role === Role.LABOUR) {
      const myWorkerRecord = await this.prisma.labourWorker.findFirst({
        where: {
          OR: [
            { userId: user.id },
            ...(user.mobile ? [{ mobile: user.mobile }] : []),
          ],
          deletedAt: null,
        },
      });
      if (myWorkerRecord?.farmerId) {
        farmerId = myWorkerRecord.farmerId;
      }
    }

    let userId: string | undefined = undefined;
    let sharedAddress = dto.address?.trim() || null;

    if (dto.mobile?.trim()) {
      const cleanMobile = dto.mobile.trim();

      // Duplicate Name Check for the same mobile number
      const duplicateNameWorker = await this.prisma.labourWorker.findFirst({
        where: {
          farmerId,
          mobile: cleanMobile,
          name: { equals: dto.name.trim(), mode: 'insensitive' },
          deletedAt: null,
        },
      });
      if (duplicateNameWorker) {
        throw new BadRequestException(
          `Worker "${dto.name}" is already registered under mobile ${cleanMobile}. Duplicate names are not allowed.`
        );
      }

      let linkedUser = await this.prisma.user.findUnique({ where: { mobile: cleanMobile } });

      if (!linkedUser) {
        const passwordHash = await argon2.hash(cleanMobile);
        const kingId = await generateUniqueKingId(this.prisma);
        linkedUser = await this.prisma.user.create({
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
        if (!linkedUser.roles.includes(Role.LABOUR)) {
          await this.prisma.user.update({
            where: { id: linkedUser.id },
            data: { roles: { push: Role.LABOUR } },
          });
        }
      }

      userId = linkedUser.id;

      // Share address from existing worker under same mobile if available
      if (!sharedAddress) {
        const existingWithAddress = await this.prisma.labourWorker.findFirst({
          where: { mobile: cleanMobile, address: { not: null } },
        });
        if (existingWithAddress?.address) {
          sharedAddress = existingWithAddress.address;
        }
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
        photoUrl: dto.photoUrl?.trim() || null,
        relation: dto.relation?.trim() || null,
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
  async getWorkersForFarmer(user: AuthUser) {
    let farmerId = user.id;
    if (user.role === Role.LABOUR) {
      const myWorkerRecord = await this.prisma.labourWorker.findFirst({
        where: {
          OR: [
            { userId: user.id },
            ...(user.mobile ? [{ mobile: user.mobile }] : []),
          ],
          deletedAt: null,
        },
      });
      if (myWorkerRecord?.farmerId) {
        farmerId = myWorkerRecord.farmerId;
      }
    }

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
  async updateWorker(user: AuthUser, id: string, dto: UpdateLabourWorkerDto) {
    const existing = await this.prisma.labourWorker.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Worker not found');
    }

    let userId = existing.userId;
    const cleanMobile = dto.mobile !== undefined ? (dto.mobile?.trim() || null) : existing.mobile;
    const effectiveMobile = cleanMobile || (existing.userId === user.id ? user.mobile : null);

    if (effectiveMobile) {
      let linkedUser = await this.prisma.user.findUnique({ where: { mobile: effectiveMobile } });
      if (!linkedUser) {
        const passwordHash = await argon2.hash(effectiveMobile);
        const kingId = await generateUniqueKingId(this.prisma);
        linkedUser = await this.prisma.user.create({
          data: {
            kingId,
            mobile: effectiveMobile,
            passwordHash,
            name: dto.name || existing.name,
            role: Role.LABOUR,
            roles: [Role.LABOUR],
          },
        });
      } else {
        await this.prisma.user.update({
          where: { id: linkedUser.id },
          data: {
            ...(dto.name && { name: dto.name.trim() }),
            ...(dto.photoUrl !== undefined && { photoUrl: dto.photoUrl?.trim() || null }),
          },
        }).catch(() => null);
      }
      userId = linkedUser.id;
    }

    const updatedWorker = await this.prisma.labourWorker.update({
      where: { id },
      data: {
        userId,
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.mobile !== undefined && { mobile: dto.mobile?.trim() || null }),
        ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
        ...(dto.photoUrl !== undefined && { photoUrl: dto.photoUrl?.trim() || null }),
        ...(dto.relation !== undefined && { relation: dto.relation?.trim() || null }),
        ...(dto.defaultRate !== undefined && { defaultRate: dto.defaultRate }),
        ...(dto.defaultUnit && { defaultUnit: dto.defaultUnit }),
        ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null }),
      },
      include: {
        user: { select: { id: true, mobile: true, kingId: true, name: true, photoUrl: true } },
      },
    });

    const targetUserId = userId || existing.userId || (existing.mobile === user.mobile ? user.id : null);
    if (targetUserId) {
      await this.prisma.user.update({
        where: { id: targetUserId },
        data: {
          ...(dto.name && { name: dto.name.trim() }),
          ...(dto.photoUrl !== undefined && { photoUrl: dto.photoUrl?.trim() || null }),
        },
      }).catch(() => null);
    }

    return updatedWorker;
  }

  /** Delete worker */
  async deleteWorker(user: AuthUser, id: string) {
    const existing = await this.prisma.labourWorker.findFirst({
      where: { id, deletedAt: null },
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
   * Labour Dashboard Data for logged-in Labour User account (supports multiple worker profiles under 1 mobile number).
   */
  async getLabourDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mobile: true, name: true, photoUrl: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const workers = await this.prisma.labourWorker.findMany({
      where: {
        OR: [
          { userId },
          ...(user.mobile ? [{ mobile: user.mobile }] : []),
        ],
        deletedAt: null,
      },
      include: {
        farmer: { select: { id: true, name: true, mobile: true, village: true, photoUrl: true } },
        workEntries: { where: { deletedAt: null }, orderBy: { workDate: 'desc' } },
        payments: { where: { deletedAt: null }, orderBy: { paymentDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (workers.length === 0) {
      const fallbackProfile = {
        worker: {
          id: user.id,
          name: user.name,
          mobile: user.mobile,
          address: null,
          photoUrl: user.photoUrl,
          relation: 'Head / Self',
          defaultRate: null,
          defaultUnit: 'Days',
          farmer: null,
        },
        summary: { totalEarned: 0, totalPaid: 0, pendingBalance: 0 },
        workEntries: [],
        payments: [],
      };
      return {
        worker: fallbackProfile.worker,
        summary: fallbackProfile.summary,
        workEntries: [],
        payments: [],
        profiles: [fallbackProfile],
      };
    }

    const profiles = workers.map((worker) => {
      const totalEarned = worker.workEntries.reduce((sum, e) => sum + Number(e.totalAmount), 0);
      const totalPaid = worker.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const pendingBalance = totalEarned - totalPaid;

      return {
        worker: {
          id: worker.id,
          name: worker.name,
          mobile: worker.mobile,
          address: worker.address,
          photoUrl: worker.photoUrl,
          relation: worker.relation,
          defaultRate: worker.defaultRate,
          defaultUnit: worker.defaultUnit,
          farmer: worker.farmer,
        },
        summary: {
          totalEarned,
          totalPaid,
          pendingBalance,
        },
        workEntries: worker.workEntries,
        payments: worker.payments,
      };
    });

    // Main primary profile (first worker profile) for backward compatibility
    const primary = profiles[0];

    return {
      worker: primary.worker,
      summary: primary.summary,
      workEntries: primary.workEntries,
      payments: primary.payments,
      profiles,
    };
  }
}
