import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';

export class CreatePriceLockDto {
  cropName: string;
  quantityQuintal: number;
  lockedRate: number;
  buyerId?: string;
}

@Injectable()
export class MandiAIService {
  constructor(private readonly prisma: PrismaService) {}

  /** Get 30-Day AI Mandi Price Prediction for a crop */
  async get30DayPricePrediction(cropName: string = 'Wheat', mandiName: string = 'Khanna') {
    const existing = await this.prisma.mandiPricePrediction.findMany({
      where: { cropName, mandiName },
      orderBy: { predictedDate: 'asc' },
    });

    if (existing.length > 0) return existing;

    // Seed 30-Day ML Price Forecast
    const basePrice = cropName.toLowerCase().includes('wheat') ? 2275 : 2320;
    const predictions: Prisma.MandiPricePredictionCreateManyInput[] = [];
    const today = new Date();


    for (let i = 1; i <= 30; i++) {
      const predDate = new Date(today);
      predDate.setDate(today.getDate() + i);

      // Simulated time-series trend curve
      const trendOffset = Math.sin(i / 5) * 60 + i * 4;
      const predictedPrice = Math.round(basePrice + trendOffset);

      predictions.push({
        cropName,
        mandiName,
        predictedDate: predDate,
        predictedPrice,
        confidenceScore: 0.92,
      });
    }

    await this.prisma.mandiPricePrediction.createMany({ data: predictions });

    return this.prisma.mandiPricePrediction.findMany({
      where: { cropName, mandiName },
      orderBy: { predictedDate: 'asc' },
    });
  }

  /** Create a binding Forward Price Guarantee Contract with Buyer Escrow Deposit */
  async createPriceLockContract(user: AuthUser, dto: CreatePriceLockDto) {
    if (!dto.quantityQuintal || dto.quantityQuintal <= 0 || !dto.lockedRate || dto.lockedRate <= 0) {
      throw new BadRequestException('Provide valid quantity and locked rate');
    }

    const escrowDeposit = Math.round(dto.quantityQuintal * dto.lockedRate * 0.1 * 100) / 100; // 10% Escrow

    return this.prisma.priceLockContract.create({
      data: {
        farmerId: user.id,
        buyerId: dto.buyerId || user.id,
        cropName: dto.cropName,
        quantityQuintal: dto.quantityQuintal,
        lockedRate: dto.lockedRate,
        status: 'ACTIVE',
        escrowDeposit,
      },
    });
  }

  /** Get active Price Lock Contracts */
  async getMyPriceLockContracts(user: AuthUser) {
    return this.prisma.priceLockContract.findMany({
      where: {
        OR: [{ farmerId: user.id }, { buyerId: user.id }],
      },
      include: {
        farmer: { select: { id: true, name: true, kingId: true } },
        buyer: { select: { id: true, name: true, kingId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
