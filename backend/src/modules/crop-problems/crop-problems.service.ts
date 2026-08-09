import { Injectable, NotFoundException } from '@nestjs/common';
import { CropProblemStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CropsService } from '../crops/crops.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateCropProblemDto } from './dto/create-crop-problem.dto';
import { RespondCropProblemDto } from './dto/respond-crop-problem.dto';
import { UpdateCropProblemStatusDto } from './dto/update-crop-problem-status.dto';

const DETAIL_INCLUDE = {
  photos: true,
  reportedBy: { select: { id: true, name: true, mobile: true } },
  assignedAdvisor: { select: { id: true, name: true, mobile: true } },
  cropCycle: { select: { id: true, cropName: true, plot: { select: { id: true, name: true, farmId: true } } } },
} as const;

@Injectable()
export class CropProblemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cropsService: CropsService,
  ) {}

  async create(user: AuthUser, dto: CreateCropProblemDto) {
    await this.cropsService.findOneOrThrow(user, dto.cropCycleId);

    const activeAssignment = await this.prisma.advisorAssignment.findFirst({
      where: { farmerId: user.id, status: 'ACTIVE', deletedAt: null },
    });

    const { photoUrls, ...rest } = dto;
    return this.prisma.cropProblem.create({
      data: {
        ...rest,
        reportedById: user.id,
        assignedAdvisorId: activeAssignment?.advisorId,
        photos: photoUrls?.length ? { create: photoUrls.map((photoUrl) => ({ photoUrl })) } : undefined,
      },
      include: DETAIL_INCLUDE,
    });
  }

  findAllForFarmer(user: AuthUser) {
    return this.prisma.cropProblem.findMany({
      where: { reportedById: user.id, deletedAt: null },
      include: DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllForAdvisor(user: AuthUser) {
    return this.prisma.cropProblem.findMany({
      where: { assignedAdvisorId: user.id, deletedAt: null },
      include: DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    const problem = await this.prisma.cropProblem.findFirst({
      where: { id, deletedAt: null },
      include: DETAIL_INCLUDE,
    });

    if (
      !problem ||
      (user.role !== Role.ADMIN && problem.reportedById !== user.id && problem.assignedAdvisorId !== user.id)
    ) {
      throw new NotFoundException('Crop problem not found.');
    }

    return problem;
  }

  async respond(user: AuthUser, id: string, dto: RespondCropProblemDto) {
    const problem = await this.findOneOrThrow(user, id);
    if (problem.assignedAdvisorId !== user.id) {
      throw new NotFoundException('Crop problem not found.');
    }

    const { followUpDate, status, ...rest } = dto;
    const nextStatus = status ?? CropProblemStatus.ADVISOR_RESPONDED;

    return this.prisma.cropProblem.update({
      where: { id },
      data: {
        ...rest,
        status: nextStatus,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        resolvedAt: nextStatus === CropProblemStatus.RESOLVED ? new Date() : undefined,
      },
      include: DETAIL_INCLUDE,
    });
  }

  async updateStatus(user: AuthUser, id: string, dto: UpdateCropProblemStatusDto) {
    await this.findOneOrThrow(user, id);
    return this.prisma.cropProblem.update({
      where: { id },
      data: {
        status: dto.status,
        resolvedAt: dto.status === CropProblemStatus.RESOLVED ? new Date() : undefined,
      },
      include: DETAIL_INCLUDE,
    });
  }
}
