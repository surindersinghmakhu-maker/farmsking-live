import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdvisorAssignmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSprayItemTemplateDto } from './dto/create-spray-item-template.dto';
import { UpdateSprayItemTemplateDto } from './dto/update-spray-item-template.dto';

@Injectable()
export class SprayItemTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  create(advisorId: string, dto: CreateSprayItemTemplateDto) {
    return this.prisma.sprayItemTemplate.create({ data: { ...dto, advisorId } });
  }

  listMine(advisorId: string) {
    return this.prisma.sprayItemTemplate.findMany({
      where: { advisorId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Farmer/Gardener: their currently-assigned advisor's item library — used to look up
   * alternative1/alternative2 for products named in a spray schedule's recommendedProduct text. */
  async listForMyAdvisor(farmerId: string) {
    const assignment = await this.prisma.advisorAssignment.findFirst({
      where: { farmerId, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
    });
    if (!assignment) return [];
    return this.listMine(assignment.advisorId);
  }

  /** Super Admin: every advisor's templates, with the advisor's identity attached. */
  listAll() {
    return this.prisma.sprayItemTemplate.findMany({
      where: { deletedAt: null },
      include: { advisor: { select: { id: true, name: true, kingId: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findOwned(advisorId: string, id: string) {
    const existing = await this.prisma.sprayItemTemplate.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Item template not found.');
    }
    if (existing.advisorId !== advisorId) {
      throw new ForbiddenException('You can only manage your own item templates.');
    }
    return existing;
  }

  async update(advisorId: string, id: string, dto: UpdateSprayItemTemplateDto) {
    await this.findOwned(advisorId, id);
    return this.prisma.sprayItemTemplate.update({ where: { id }, data: dto });
  }

  async remove(advisorId: string, id: string) {
    await this.findOwned(advisorId, id);
    return this.prisma.sprayItemTemplate.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
