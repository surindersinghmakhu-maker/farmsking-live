import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AdvisorAssignmentStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateAdvisorAssignmentDto } from './dto/create-advisor-assignment.dto';

@Injectable()
export class AdvisorAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  /** Assigned farmers for the logged-in advisor, with their farms/plots/crops nested for the dashboard. */
  findMyFarmers(user: AuthUser) {
    return this.prisma.advisorAssignment.findMany({
      where: { advisorId: user.id, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            mobile: true,
            village: true,
            district: true,
            state: true,
            farms: {
              where: { deletedAt: null },
              include: {
                plots: {
                  where: { deletedAt: null },
                  include: {
                    cropCycles: { where: { deletedAt: null } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /** The logged-in farmer's active advisor, if any. */
  findMyAdvisor(user: AuthUser) {
    return this.prisma.advisorAssignment.findFirst({
      where: { farmerId: user.id, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
      include: {
        advisor: { select: { id: true, name: true, mobile: true, village: true, district: true, state: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /** Confirms this advisor currently has an ACTIVE assignment to this farmer — used by schedule/problem modules. */
  async assertAdvisorAssignedToFarmer(advisorId: string, farmerId: string) {
    const assignment = await this.prisma.advisorAssignment.findFirst({
      where: { advisorId, farmerId, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
    });
    if (!assignment) {
      throw new NotFoundException('You are not the assigned advisor for this farmer.');
    }
    return assignment;
  }

  /** Least-loaded active ADVISOR-role user — no real load-balancing yet, just an even-ish spread. */
  private async pickAdvisorForAssignment() {
    const advisors = await this.prisma.user.findMany({
      where: { role: Role.ADVISOR, deletedAt: null },
      select: {
        id: true,
        _count: { select: { advisorAssignmentsAsAdvisor: { where: { status: AdvisorAssignmentStatus.ACTIVE } } } },
      },
    });

    if (advisors.length === 0) {
      throw new NotFoundException('No advisor is available to assign right now. Please try again later.');
    }

    advisors.sort((a, b) => a._count.advisorAssignmentsAsAdvisor - b._count.advisorAssignmentsAsAdvisor);
    return advisors[0].id;
  }

  /** Called by SubscriptionsService once a subscription is ACTIVE — auto-picks an advisor and creates the assignment. */
  async createFromSubscription(subscriptionId: string, farmerId: string) {
    const advisorId = await this.pickAdvisorForAssignment();
    return this.prisma.advisorAssignment.create({
      data: {
        advisorId,
        farmerId,
        subscriptionId,
        status: AdvisorAssignmentStatus.ACTIVE,
        assignedById: farmerId,
        startDate: new Date(),
      },
      include: { advisor: { select: { id: true, name: true, mobile: true } } },
    });
  }

  /** Admin-only manual override, e.g. for support cases. */
  async create(user: AuthUser, dto: CreateAdvisorAssignmentDto) {
    const existing = await this.prisma.advisorAssignment.findFirst({
      where: { farmerId: dto.farmerId, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('This farmer already has an active advisor assignment.');
    }

    return this.prisma.advisorAssignment.create({
      data: {
        advisorId: dto.advisorId,
        farmerId: dto.farmerId,
        subscriptionId: dto.subscriptionId,
        status: AdvisorAssignmentStatus.ACTIVE,
        assignedById: user.id,
        startDate: new Date(),
      },
    });
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    const assignment = await this.prisma.advisorAssignment.findFirst({ where: { id, deletedAt: null } });
    if (
      !assignment ||
      (user.role !== Role.ADMIN && assignment.advisorId !== user.id && assignment.farmerId !== user.id)
    ) {
      throw new NotFoundException('Advisor assignment not found.');
    }
    return assignment;
  }

  async revoke(user: AuthUser, id: string) {
    await this.findOneOrThrow(user, id);
    return this.prisma.advisorAssignment.update({
      where: { id },
      data: { status: AdvisorAssignmentStatus.REVOKED, endDate: new Date() },
    });
  }
}
