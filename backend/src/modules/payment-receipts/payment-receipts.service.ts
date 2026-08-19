import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';

@Injectable()
export class PaymentReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOneOrThrow(user: AuthUser, id: string) {
    const receipt = await this.prisma.paymentReceipt.findUnique({ where: { id } });
    if (!receipt) {
      throw new NotFoundException('Receipt not found.');
    }
    if (receipt.farmerId !== user.id) {
      throw new ForbiddenException('This receipt does not belong to you.');
    }
    return receipt;
  }

  async countMine(user: AuthUser) {
    const count = await this.prisma.paymentReceipt.count({ where: { farmerId: user.id } });
    return { count };
  }
}
