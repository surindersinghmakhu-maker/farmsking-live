import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { getEffectiveFarmerId } from '../../common/utils/effective-farmer.util';

@Injectable()
export class FarmsService {
  constructor(private readonly prisma: PrismaService) {}

  create(user: AuthUser, dto: CreateFarmDto) {
    const ownerId = getEffectiveFarmerId(user);
    return this.prisma.farm.create({
      data: { ...dto, ownerId },
    });
  }

  async findAll(user: AuthUser) {
    if (!user?.id) return [];
    try {
      const ownerId = getEffectiveFarmerId(user);
      return await this.prisma.farm.findMany({
        where: {
          deletedAt: null,
          ...(user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN ? {} : { ownerId }),
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err: any) {
      console.error('[FarmsService.findAll] Error:', err);
      return [];
    }
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    const farm = await this.prisma.farm.findFirst({
      where: { id, deletedAt: null },
    });

    const ownerId = getEffectiveFarmerId(user);
    if (!farm || (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN && farm.ownerId !== ownerId)) {
      throw new NotFoundException('Farm not found.');
    }

    return farm;
  }

  async update(user: AuthUser, id: string, dto: UpdateFarmDto) {
    await this.findOneOrThrow(user, id);
    return this.prisma.farm.update({ where: { id }, data: dto });
  }

  async remove(user: AuthUser, id: string) {
    await this.findOneOrThrow(user, id);
    return this.prisma.farm.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
