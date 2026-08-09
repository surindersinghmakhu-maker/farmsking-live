import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PlotsService } from '../plots/plots.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';

const DATE_FIELDS = ['sowingDate', 'transplantDate', 'expectedHarvestDate', 'actualHarvestDate'] as const;

function toDateFields<T extends Partial<Record<(typeof DATE_FIELDS)[number], string>>>(dto: T) {
  const result: Record<string, Date> = {};
  for (const field of DATE_FIELDS) {
    const value = dto[field];
    if (value) {
      result[field] = new Date(value);
    }
  }
  return result;
}

@Injectable()
export class CropsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plotsService: PlotsService,
  ) {}

  async create(user: AuthUser, dto: CreateCropDto) {
    // Verifies the plot exists and belongs to this user (or ADMIN) before allowing a crop cycle on it.
    await this.plotsService.findOneOrThrow(user, dto.plotId);
    const { plotId, sowingDate, transplantDate, expectedHarvestDate, actualHarvestDate, ...rest } = dto;
    return this.prisma.cropCycle.create({
      data: { ...rest, plotId, ...toDateFields(dto) },
    });
  }

  findAllForPlot(user: AuthUser, plotId: string) {
    return this.plotsService.findOneOrThrow(user, plotId).then(() =>
      this.prisma.cropCycle.findMany({
        where: { plotId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    const cropCycle = await this.prisma.cropCycle.findFirst({
      where: { id, deletedAt: null },
      include: { plot: { include: { farm: true } } },
    });

    if (!cropCycle || (user.role !== Role.ADMIN && cropCycle.plot.farm.ownerId !== user.id)) {
      throw new NotFoundException('Crop cycle not found.');
    }

    return cropCycle;
  }

  async update(user: AuthUser, id: string, dto: UpdateCropDto) {
    await this.findOneOrThrow(user, id);
    const { sowingDate, transplantDate, expectedHarvestDate, actualHarvestDate, ...rest } = dto;
    return this.prisma.cropCycle.update({
      where: { id },
      data: { ...rest, ...toDateFields(dto) },
    });
  }

  async remove(user: AuthUser, id: string) {
    await this.findOneOrThrow(user, id);
    return this.prisma.cropCycle.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
