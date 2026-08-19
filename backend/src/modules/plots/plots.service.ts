import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FarmsService } from '../farms/farms.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreatePlotDto } from './dto/create-plot.dto';
import { UpdatePlotDto } from './dto/update-plot.dto';

@Injectable()
export class PlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly farmsService: FarmsService,
  ) {}

  async create(user: AuthUser, dto: CreatePlotDto) {
    // Verifies the farm exists and belongs to this user (or ADMIN) before allowing a plot on it.
    await this.farmsService.findOneOrThrow(user, dto.farmId);
    const { farmId, ...rest } = dto;
    return this.prisma.plot.create({ data: { ...rest, farmId } });
  }

  findAllForFarm(user: AuthUser, farmId: string) {
    return this.farmsService.findOneOrThrow(user, farmId).then(() =>
      this.prisma.plot.findMany({
        where: { farmId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    const plot = await this.prisma.plot.findFirst({
      where: { id, deletedAt: null },
      include: { farm: true },
    });

    if (!plot || (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN && plot.farm.ownerId !== user.id)) {
      throw new NotFoundException('Plot not found.');
    }

    return plot;
  }

  async update(user: AuthUser, id: string, dto: UpdatePlotDto) {
    await this.findOneOrThrow(user, id);
    return this.prisma.plot.update({ where: { id }, data: dto });
  }

  async remove(user: AuthUser, id: string) {
    await this.findOneOrThrow(user, id);
    return this.prisma.plot.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
