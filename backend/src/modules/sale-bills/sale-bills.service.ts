import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateSaleBillDto } from './dto/create-sale-bill.dto';

@Injectable()
export class SaleBillsService {
  constructor(private readonly prisma: PrismaService) {}

  private nextBillNo(): string {
    return `FK-${Date.now().toString().slice(-8)}`;
  }

  async create(user: AuthUser, dto: CreateSaleBillDto) {
    return this.prisma.saleBill.create({
      data: {
        farmerId: user.id,
        billNo: this.nextBillNo(),
        farmerName: dto.farmerName,
        partyId: dto.partyId,
        partyName: dto.partyName,
        partyMobile: dto.partyMobile,
        isCash: dto.isCash,
        items: dto.items as unknown as object,
        totalItems: dto.totalItems,
        totalAmount: dto.totalAmount,
        amountReceived: dto.amountReceived,
        thisSaleBalance: dto.thisSaleBalance,
        previousBalance: dto.previousBalance,
        netReceivable: dto.netReceivable,
      },
    });
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    const bill = await this.prisma.saleBill.findUnique({ where: { id } });
    if (!bill) {
      throw new NotFoundException('Bill not found.');
    }
    if (bill.farmerId !== user.id) {
      throw new ForbiddenException('This bill does not belong to you.');
    }
    return bill;
  }

  async countMine(user: AuthUser) {
    const count = await this.prisma.saleBill.count({ where: { farmerId: user.id } });
    return { count };
  }
}
