import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';

@Injectable()
export class FarmsService {
  constructor(private readonly prisma: PrismaService) {}

  create(user: AuthUser, dto: CreateFarmDto) {
    return this.prisma.farm.create({
      data: { ...dto, ownerId: user.id },
    });
  }

  findAll(user: AuthUser) {
    return this.prisma.farm.findMany({
      where: {
        deletedAt: null,
        ...(user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN ? {} : { ownerId: user.id }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    const farm = await this.prisma.farm.findFirst({
      where: { id, deletedAt: null },
    });

    if (!farm || (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN && farm.ownerId !== user.id)) {
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
