import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductModerationStatus, CatalogApprovalMode, SellerType } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(creator: AuthUser, dto: CreateProductDto) {
    let sellerStore: any = null;

    if (dto.sellerStoreId) {
      sellerStore = await this.prisma.sellerStore.findUnique({ where: { id: dto.sellerStoreId } });
    } else {
      sellerStore = await this.prisma.sellerStore.findUnique({ where: { sellerId: creator.id } });
    }

    if (!sellerStore) {
      const appSettings = await this.prisma.appSetting.findUnique({ where: { id: 'default' } });
      if (!appSettings?.allowDirectPlatformSales) {
        throw new BadRequestException('Direct FarmsKing self-selling is currently inactive. Please list products under a registered seller store (e.g. Surinder Agro Store).');
      }
    }

    const categorySlug = (dto.categorySlug || dto.category || '').toLowerCase().replace(/\s+/g, '-');

    if (sellerStore) {
      // 1. Category Restriction: Seeds & Pesticides strictly require Agri Inputs License No.
      if (categorySlug.includes('pesticide') || categorySlug === 'pesticides' || categorySlug.includes('seed') || categorySlug === 'seeds' || categorySlug.includes('crop-protection')) {
        if (!sellerStore.agriLicenseNo || !sellerStore.agriLicenseNo.trim()) {
          throw new BadRequestException('Agri Inputs License No. (Seeds / Pesticide License) is required to list Seeds & Agrochemical Pesticides. Please update your Agri License in Store Settings.');
        }
      }

      // 2. Category Restriction: Food products require FSSAI License No.
      if (categorySlug.includes('food') || categorySlug === 'food-products' || categorySlug.includes('organic-food')) {
        if (!sellerStore.fssaiNo || !sellerStore.fssaiNo.trim()) {
          throw new BadRequestException('FSSAI License No. is required to list Food Products. Please update your FSSAI License Number in Store Settings.');
        }
      }
    }

    // 3. Dimensional Weight & Billable Weight Calculation
    const deadWeightKg = dto.deadWeightKg ?? dto.weightKg ?? 0.5;
    const lengthCm = dto.lengthCm ?? 10;
    const widthCm = dto.widthCm ?? 10;
    const heightCm = dto.heightCm ?? 10;

    const volumetricWeight = (lengthCm * widthCm * heightCm) / 5000;
    const billableWeight = Math.max(deadWeightKg, volumetricWeight);

    // 4. COD Rule Engine: Auto-disable COD for khad-spray OR weight >= 25 kg
    let isCodAllowed = true;
    if (categorySlug === 'khad-spray' || categorySlug.includes('khad') || billableWeight >= 25) {
      isCodAllowed = false;
    }

    // 5. Catalog Moderation Mode
    let moderationStatus: ProductModerationStatus = ProductModerationStatus.PENDING_REVIEW;
    if (sellerStore?.catalogApprovalMode === CatalogApprovalMode.AUTO) {
      moderationStatus = ProductModerationStatus.ACTIVE;
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        title: dto.title || dto.name,
        brand: dto.brand,
        description: dto.description,
        category: dto.category,
        categorySlug,
        unit: dto.unit ?? 'piece',
        price: dto.price,
        sellingPrice: dto.sellingPrice ?? dto.price,
        mrp: dto.mrp ?? dto.price,
        imageUrl: dto.imageFrontUrl || dto.imageUrl,
        imageFrontUrl: dto.imageFrontUrl || dto.imageUrl,
        imageBackLabelUrl: dto.imageBackLabelUrl,
        imageDosageUrl: dto.imageDosageUrl,
        imageProductUrl: dto.imageProductUrl || dto.imageUrl,
        stockQty: dto.stockQty ?? 0,
        sellerStoreId: sellerStore ? sellerStore.id : dto.sellerStoreId,
        hsnCode: dto.hsnCode,
        sku: dto.sku,
        gstPercentage: dto.gstPercentage ?? 18.0,
        weightKg: billableWeight,
        deadWeightKg,
        lengthCm,
        widthCm,
        heightCm,
        technicalName: dto.technicalName,
        dosageInstructions: dto.dosageInstructions,
        suitableCrops: dto.suitableCrops,
        targetPests: dto.targetPests,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        batchNumber: dto.batchNumber,
        isCodAllowed,
        isReturnable: dto.isReturnable ?? true,
        returnWindowDays: dto.returnWindowDays ?? 7,
        isReplaceable: dto.isReplaceable ?? true,
        replacementWindowDays: dto.replacementWindowDays ?? 7,
        returnPolicyNotes: dto.returnPolicyNotes,
        commissionOverridePercentage: dto.commissionOverridePercentage,
        bulkDiscountMinQty: dto.bulkDiscountMinQty,
        bulkDiscountPercentage: dto.bulkDiscountPercentage,
        moderationStatus,
        createdById: creator.id,
      },
    });
  }

  /** Customers browsing only ever see active products */
  listAll(includeInactive: boolean, sellerStoreId?: string, slug?: string, categorySlug?: string) {
    const where: any = includeInactive
      ? {}
      : { isActive: true, moderationStatus: ProductModerationStatus.ACTIVE };

    if (sellerStoreId) where.sellerStoreId = sellerStoreId;
    if (slug) where.sellerStore = { slug };
    if (categorySlug) where.categorySlug = categorySlug;

    return this.prisma.product.findMany({
      where,
      take: 150, // Defensive bound to prevent massive catalog crash
      include: {
        sellerStore: {
          select: {
            id: true,
            storeName: true,
            slug: true,
            sellerType: true,
            rating: true,
            kycStatus: true,
            pickupState: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findOneOrThrow(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { sellerStore: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOneOrThrow(id);
    return this.prisma.product.update({ where: { id }, data: dto as any });
  }

  /** Soft-delete */
  async remove(id: string) {
    await this.findOneOrThrow(id);
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  /** Add Customer Review & Trigger Auto-Suspension if 3 consecutive <= 2 star ratings */
  async addReview(user: AuthUser, productId: string, rating: number, title?: string, comment?: string, photoUrls?: string[]) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5 stars.');
    }

    const product = await this.findOneOrThrow(productId);

    const review = await this.prisma.productReview.create({
      data: {
        productId,
        userId: user.id,
        rating,
        title: title || '',
        comment: comment || '',
        photoUrls: photoUrls || [],
      },
    });

    // Check last 3 consecutive reviews for this product
    const recentReviews = await this.prisma.productReview.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    if (recentReviews.length >= 3 && recentReviews.every((r) => r.rating <= 2)) {
      // Auto-suspend product due to 3 consecutive <= 2 star ratings
      await this.prisma.product.update({
        where: { id: productId },
        data: {
          isActive: false,
          moderationStatus: ProductModerationStatus.REJECTED,
          rejectionReason: 'AUTO_SUSPENDED: Received 3 consecutive <= 2-star reviews. Pending Admin safety review.',
        },
      });

      // Check total blocked products for this seller store
      if (product.sellerStoreId) {
        const totalBlocked = await this.prisma.product.count({
          where: {
            sellerStoreId: product.sellerStoreId,
            moderationStatus: ProductModerationStatus.REJECTED,
          },
        });

        if (totalBlocked >= 2) {
          // Trigger Seller Re-approval required
          await this.prisma.sellerStore.update({
            where: { id: product.sellerStoreId },
            data: {
              kycStatus: 'REJECTED',
              rejectionReason: 'RE_APPROVAL_REQUIRED: Accumulated 2 blocked products due to negative ratings. Pending Admin Re-Approval.',
            },
          });
        }
      }
    }

    return review;
  }

  /** List reviews for a product */
  async getReviews(productId: string) {
    const reviews = await this.prisma.productReview.findMany({
      where: { productId },
      take: 200,
      include: {
        user: { select: { id: true, name: true, mobile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = reviews.length;
    const avgRating = total > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1) : '5.0';

    return {
      reviews,
      total,
      avgRating: parseFloat(avgRating),
    };
  }

  /** Admin: List products pending catalog review or blocked */
  async listPendingForAdmin() {
    return this.prisma.product.findMany({
      where: {
        OR: [
          { moderationStatus: ProductModerationStatus.PENDING_REVIEW },
          { moderationStatus: ProductModerationStatus.REJECTED },
        ],
      },
      take: 100,
      include: {
        sellerStore: {
          select: { id: true, storeName: true, sellerType: true, rating: true, kycStatus: true },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Admin: Approve / Unblock product */
  async approveProductByAdmin(id: string) {
    await this.findOneOrThrow(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: true, moderationStatus: ProductModerationStatus.ACTIVE, rejectionReason: null },
    });
  }

  /** Admin: Reject product with reason */
  async rejectProductByAdmin(id: string, reason: string) {
    if (!reason?.trim()) {
      throw new BadRequestException('A reason is required when rejecting a product.');
    }
    await this.findOneOrThrow(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false, moderationStatus: ProductModerationStatus.REJECTED, rejectionReason: reason.trim() },
    });
  }
}

