import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  create(admin: AuthUser, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        unit: dto.unit ?? 'piece',
        price: dto.price,
        imageUrl: dto.imageUrl,
        stockQty: dto.stockQty ?? 0,
        createdById: admin.id,
      },
    });
  }

  /** Customers/shop browsing only ever sees active products; admins can request everything. */
  listAll(includeInactive: boolean) {
    return this.prisma.product.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findOneOrThrow(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOneOrThrow(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  /** Soft-delete — keeps past order history intact and the product simply stops being purchasable. */
  async remove(id: string) {
    await this.findOneOrThrow(id);
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }
}
