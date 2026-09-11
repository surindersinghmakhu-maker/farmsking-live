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
    const mm = String(now.getMonth() + 1).padStart(2, '0'); // e.g. "09" for September
    const prefix = `${yy}${mm}`;

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Count sale bills created in current calendar month
    const countThisMonth = await this.prisma.saleBill.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    let nextSeq = countThisMonth + 1;
    let paddedSeq = String(nextSeq).padStart(2, '0');
    let candidate = `FK-${prefix}${paddedSeq}`;

    // Guarantee 100% Unique Bill Number across concurrent requests
    let exists = await this.prisma.saleBill.findFirst({ where: { billNo: candidate } });
    while (exists) {
      nextSeq++;
      paddedSeq = String(nextSeq).padStart(2, '0');
      candidate = `FK-${prefix}${paddedSeq}`;
      exists = await this.prisma.saleBill.findFirst({ where: { billNo: candidate } });
    }

    return candidate;
  }

  async create(user: AuthUser, dto: CreateSaleBillDto) {
    if (dto.billNo) {
      const existing = await this.prisma.saleBill.findFirst({
        where: { farmerId: user.id, billNo: dto.billNo },
      });
      if (existing) {
        return this.update(user, existing.id, dto);
      }
    }

    const billNo = dto.billNo ? dto.billNo : await this.nextBillNo();
    const nowIso = new Date().toISOString();

    // Attach exact timestamp to each sale item in JSON array
    const timestampedItems = Array.isArray(dto.items)
      ? dto.items.map((it: any) => ({
          ...it,
          timestamp: it.timestamp || nowIso,
          createdAt: it.createdAt || nowIso,
        }))
      : dto.items;

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
        amountReceivedMode: dto.amountReceivedMode || 'CASH',
        items: timestampedItems as unknown as object,
        totalItems: dto.totalItems,
        totalAmount: dto.totalAmount,
        amountReceived: dto.amountReceived,
        thisSaleBalance: dto.thisSaleBalance,
        previousBalance: dto.previousBalance,
        netReceivable: dto.netReceivable,
        discountAmount: dto.discountAmount !== undefined ? dto.discountAmount : 0,
        deliveryCharge: dto.deliveryCharge !== undefined ? dto.deliveryCharge : 0,
        notes: dto.notes ?? null,
        ...(dto.createdAt && { createdAt: new Date(dto.createdAt) }),
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
    const nowIso = new Date().toISOString();

    const timestampedItems = Array.isArray(dto.items)
      ? dto.items.map((it: any) => ({
          ...it,
          timestamp: it.timestamp || nowIso,
          createdAt: it.createdAt || nowIso,
        }))
      : dto.items;

    const updated = await this.prisma.saleBill.update({
      where: { id: existing.id },
      data: {
        billNo: existing.billNo,
        farmerName: dto.farmerName,
        partyId: dto.partyId,
        partyName: dto.partyName,
        partyMobile: dto.partyMobile,
        partyAddress: dto.partyAddress,
        isCash: dto.isCash,
        amountReceivedMode: dto.amountReceivedMode || 'CASH',
        items: timestampedItems as unknown as object,
        totalItems: dto.totalItems,
        totalAmount: dto.totalAmount,
        amountReceived: dto.amountReceived,
        thisSaleBalance: dto.thisSaleBalance,
        previousBalance: dto.previousBalance,
        netReceivable: dto.netReceivable,
        discountAmount: dto.discountAmount !== undefined ? dto.discountAmount : 0,
        deliveryCharge: dto.deliveryCharge !== undefined ? dto.deliveryCharge : 0,
        notes: dto.notes ?? null,
        ...(dto.createdAt && { createdAt: new Date(dto.createdAt) }),
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
                source: 'farmer_sale_bill_update',
              },
            });
          }
        }
      }
    } catch (err) {
      console.warn('Could not record market rate on bill update:', err);
    }

    return updated;
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    let bill: any = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      bill = await this.prisma.saleBill.findUnique({ where: { id } }).catch(() => null);
    }
    if (!bill) {
      bill = await this.prisma.saleBill.findFirst({
        where: { farmerId: user.id, billNo: id },
      });
    }
    if (!bill) {
      bill = await this.prisma.saleBill.findFirst({
        where: {
          farmerId: user.id,
          billNo: { equals: id, mode: 'insensitive' },
        },
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

  async remove(user: AuthUser, id: string) {
    const bill = await this.findOneOrThrow(user, id);
    // Delete all linked party ledger entries first to avoid orphaned records
    await this.prisma.partyLedgerEntry.deleteMany({
      where: { saleBillId: bill.id },
    });
    // Delete the sale bill
    return this.prisma.saleBill.delete({
      where: { id: bill.id },
    });
  }
}
