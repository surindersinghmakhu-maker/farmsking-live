import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateAddressDto) {
    const existingCount = await this.prisma.customerAddress.count({
      where: { ownerId: user.id },
    });

    const shouldBeDefault = existingCount === 0 || dto.isDefault === true;

    if (shouldBeDefault && existingCount > 0) {
      await this.prisma.customerAddress.updateMany({
        where: { ownerId: user.id },
        data: { isDefault: false },
      });
    }

    return this.prisma.customerAddress.create({
      data: {
        ownerId: user.id,
        tag: dto.tag,
        name: dto.name,
        line: dto.line,
        mobile: dto.mobile,
        postOffice: dto.postOffice,
        district: dto.district,
        state: dto.state,
        pincode: dto.pincode,
        isDefault: shouldBeDefault,
      },
    });
  }

  listMine(user: AuthUser) {
    return this.prisma.customerAddress.findMany({
      where: { ownerId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async setDefault(user: AuthUser, id: string) {
    const address = await this.prisma.customerAddress.findUnique({ where: { id } });
    if (!address) {
      throw new NotFoundException('Address not found.');
    }
    if (address.ownerId !== user.id) {
      throw new ForbiddenException('This address does not belong to you.');
    }

    await this.prisma.customerAddress.updateMany({
      where: { ownerId: user.id },
      data: { isDefault: false },
    });

    return this.prisma.customerAddress.update({
      where: { id },
      data: { isDefault: true },
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
    const wasDefault = address.isDefault;
    await this.prisma.customerAddress.delete({ where: { id } });

    // If the deleted address was default, promote the newest address to default
    if (wasDefault) {
      const nextAddress = await this.prisma.customerAddress.findFirst({
        where: { ownerId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      if (nextAddress) {
        await this.prisma.customerAddress.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return { success: true };
  }

  async update(user: AuthUser, id: string, dto: UpdateAddressDto) {
    const address = await this.prisma.customerAddress.findUnique({ where: { id } });
    if (!address) {
      throw new NotFoundException('Address not found.');
    }
    if (address.ownerId !== user.id) {
      throw new ForbiddenException('This address does not belong to you.');
    }

    if (dto.isDefault === true) {
      await this.prisma.customerAddress.updateMany({
        where: { ownerId: user.id },
        data: { isDefault: false },
      });
    }

    return this.prisma.customerAddress.update({
      where: { id },
      data: {
        ...(dto.tag !== undefined ? { tag: dto.tag } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.line !== undefined ? { line: dto.line } : {}),
        ...(dto.mobile !== undefined ? { mobile: dto.mobile } : {}),
        ...(dto.postOffice !== undefined ? { postOffice: dto.postOffice } : {}),
        ...(dto.district !== undefined ? { district: dto.district } : {}),
        ...(dto.state !== undefined ? { state: dto.state } : {}),
        ...(dto.pincode !== undefined ? { pincode: dto.pincode } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
      },
    });
  }
}
