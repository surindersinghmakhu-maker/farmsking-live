import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  create(user: AuthUser, dto: CreateAddressDto) {
    return this.prisma.customerAddress.create({
      data: { ownerId: user.id, ...dto },
    });
  }

  listMine(user: AuthUser) {
    return this.prisma.customerAddress.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(user: AuthUser, id: string) {
    const address = await this.prisma.customerAddress.findUnique({ where: { id } });
    if (!address) {
      throw new NotFoundException('Address not found.');
    }
    if (address.ownerId !== user.id) {
      throw new ForbiddenException('This address does not belong to you.');
    }
    await this.prisma.customerAddress.delete({ where: { id } });
    return { success: true };
  }

  async update(user: AuthUser, id: string, dto: Partial<CreateAddressDto>) {
    const address = await this.prisma.customerAddress.findUnique({ where: { id } });
    if (!address) {
      throw new NotFoundException('Address not found.');
    }
    if (address.ownerId !== user.id) {
      throw new ForbiddenException('This address does not belong to you.');
    }
    return this.prisma.customerAddress.update({
      where: { id },
      data: dto,
    });
  }
}
