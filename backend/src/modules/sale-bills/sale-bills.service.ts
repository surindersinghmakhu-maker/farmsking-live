import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateSaleBillDto } from './dto/create-sale-bill.dto';

@Injectable()
export class SaleBillsService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextBillNo(): Promise<string> {
    const now = new Date();
    const fullYear = now.getFullYear();
    const yy = String(fullYear).slice(-2); // e.g. "26" for 2026
    const prefix = `FK-${yy}`;

    // Query latest bill for the current year prefix across all farmers
    const latestBill = await this.prisma.saleBill.findFirst({
      where: {
        billNo: {
          startsWith: prefix,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        billNo: true,
      },
    });

    let nextSeq = 1;
    if (latestBill && latestBill.billNo) {
      const seqPart = latestBill.billNo.slice(prefix.length);
      const parsed = parseInt(seqPart, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        nextSeq = parsed + 1;
      } else {
        const startOfYear = new Date(fullYear, 0, 1);
        const count = await this.prisma.saleBill.count({
          where: {
            createdAt: {
              gte: startOfYear,
            },
          },
        });
        nextSeq = count + 1;
      }
    }

    let paddedSeq = String(nextSeq).padStart(2, '0');
    let candidate = `${prefix}${paddedSeq}`;

    // Guarantee 100% Unique Bill Number across concurrent requests
    let exists = await this.prisma.saleBill.findFirst({ where: { billNo: candidate } });
    while (exists) {
      nextSeq++;
      paddedSeq = String(nextSeq).padStart(2, '0');
      candidate = `${prefix}${paddedSeq}`;
      exists = await this.prisma.saleBill.findFirst({ where: { billNo: candidate } });
    }

    return candidate;
  }

  async create(user: AuthUser, dto: CreateSaleBillDto) {
    const billNo = dto.billNo ? dto.billNo : await this.nextBillNo();
    const bill = await this.prisma.saleBill.create({
      data: {
        farmerId: user.id,
        billNo,
        farmerName: dto.farmerName,
        partyId: dto.partyId,
        partyName: dto.partyName,
        partyMobile: dto.partyMobile,
        partyAddress: dto.partyAddress,
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

    try {
      const userProfile = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { state: true, district: true },
      });
      const items = dto.items as any[];
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.cropName && Number(item.rate) > 0) {
            const cleanName = item.cropName.split('(')[0].trim();
            await this.prisma.marketRate.create({
              data: {
                cropName: cleanName,
                variety: 'Farmer Sale',
                market: userProfile?.district ? `${userProfile.district} Mandi` : 'Local Mandi',
                state: userProfile?.state || 'Punjab',
                district: userProfile?.district || null,
                modalPrice: Number(item.rate),
                minPrice: Number(item.rate),
                maxPrice: Number(item.rate),
                unit: item.unit || 'KG',
                rateDate: new Date(),
                source: 'farmer_sale_bill',
              },
            });
          }
        }
      }
    } catch (err) {
      console.warn('Could not record market rate from sale bill:', err);
    }

    return bill;
  }

  async update(user: AuthUser, id: string, dto: CreateSaleBillDto) {
    const existing = await this.findOneOrThrow(user, id);
    return this.prisma.saleBill.update({
      where: { id: existing.id },
      data: {
        billNo: dto.billNo || existing.billNo,
        farmerName: dto.farmerName,
        partyId: dto.partyId,
        partyName: dto.partyName,
        partyMobile: dto.partyMobile,
        partyAddress: dto.partyAddress,
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
    let bill = await this.prisma.saleBill.findUnique({ where: { id } }).catch(() => null);
    if (!bill) {
      bill = await this.prisma.saleBill.findFirst({
        where: { farmerId: user.id, billNo: id },
      });
    }
    if (!bill) {
      throw new NotFoundException('Bill not found.');
    }
    if (bill.farmerId !== user.id) {
      throw new ForbiddenException('This bill does not belong to you.');
    }
    return bill;
  }

  async listMine(user: AuthUser) {
    return this.prisma.saleBill.findMany({
      where: { farmerId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countMine(user: AuthUser) {
    const count = await this.prisma.saleBill.count({ where: { farmerId: user.id } });
    return { count };
  }
}
