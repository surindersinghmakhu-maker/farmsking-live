import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { hasActiveRole } from '../../common/utils/auth-user.util';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductModerationStatus, CatalogApprovalMode, SellerKycStatus, Role } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(creator: AuthUser, dto: CreateProductDto) {
    const isAdmin = hasActiveRole(creator, Role.ADMIN) || hasActiveRole(creator, Role.SUPER_ADMIN);
    let sellerStore: any = null;

    if (isAdmin && dto.sellerStoreId) {
      sellerStore = await this.prisma.sellerStore.findUnique({ where: { id: dto.sellerStoreId } });
    } else {
      sellerStore = await this.prisma.sellerStore.findUnique({ where: { sellerId: creator.id } });
      if (!isAdmin && dto.sellerStoreId && (!sellerStore || sellerStore.id !== dto.sellerStoreId)) {
        throw new ForbiddenException('You can only list products under your own verified seller store.');
      }
    }

    if (!sellerStore) {
      if (!isAdmin) {
        throw new BadRequestException('Please register and verify your Seller Store before listing products.');
      }
      const appSettings = await this.prisma.appSetting.findUnique({ where: { id: 'default' } });
      if (!appSettings?.allowDirectPlatformSales) {
        throw new BadRequestException('Direct FarmsKing self-selling is currently inactive. Please list products under a registered seller store.');
      }
    }

    if (sellerStore && !isAdmin && sellerStore.kycStatus !== SellerKycStatus.VERIFIED) {
      throw new BadRequestException(`Your Seller Store KYC is ${sellerStore.kycStatus}. Store verification is required before listing products.`);
    }

    const categorySlug = (dto.categorySlug || dto.category || '').toLowerCase().replace(/\s+/g, '-');

    if (sellerStore && !isAdmin) {
      const now = new Date();
      // 1. Category Restriction: Seeds, Pesticides & Fertilizers strictly require valid unexpired Agri Inputs License
      if (categorySlug.includes('seed') || categorySlug === 'seeds') {
        const seedLic = (sellerStore.seedLicenseNo || sellerStore.agriLicenseNo || '').trim();
        const seedExp = sellerStore.seedLicenseExpiry || sellerStore.agriLicenseExpiryDate;
        if (!seedLic) {
          throw new BadRequestException('A valid Seed Sale License No. is required to list seed products.');
        }
        if (seedExp && new Date(seedExp) < now) {
          throw new BadRequestException('Your Seed / Agri Inputs License has expired. Please upload a renewed license in Store KYC Settings.');
        }
      }
      if (categorySlug.includes('pesticide') || categorySlug === 'pesticides' || categorySlug.includes('crop-protection')) {
        const pestLic = (sellerStore.pesticideLicenseNo || sellerStore.agriLicenseNo || '').trim();
        const pestExp = sellerStore.pesticideLicenseExpiry || sellerStore.agriLicenseExpiryDate;
        if (!pestLic) {
          throw new BadRequestException('An Insecticides Act Pesticide License No. is required to list agrochemicals and crop protection products.');
        }
        if (pestExp && new Date(pestExp) < now) {
          throw new BadRequestException('Your Pesticide / Insecticide License has expired. Please renew it in Store KYC Settings.');
        }
      }
      if (categorySlug.includes('fertilizer') || categorySlug.includes('khad') || categorySlug.includes('nutrient')) {
        const fertLic = (sellerStore.fertilizerLicenseNo || sellerStore.agriLicenseNo || '').trim();
        const fertExp = sellerStore.fertilizerLicenseExpiry || sellerStore.agriLicenseExpiryDate;
        if (!fertLic) {
          throw new BadRequestException('A valid Fertilizer Control Order (FCO) / Agri Inputs License No. is required to list fertilizer products.');
        }
        if (fertExp && new Date(fertExp) < now) {
          throw new BadRequestException('Your Fertilizer / Agri Inputs License has expired. Please renew it in Store KYC Settings.');
        }
      }

      // 2. Category Restriction: Food products require valid unexpired FSSAI License No.
      if (categorySlug.includes('food') || categorySlug === 'food-products' || categorySlug.includes('organic-food')) {
        if (!sellerStore.fssaiNo || !sellerStore.fssaiNo.trim()) {
          throw new BadRequestException('FSSAI License No. is required to list Food Products. Please update your FSSAI License Number in Store Settings.');
        }
        if (sellerStore.fssaiExpiryDate && new Date(sellerStore.fssaiExpiryDate) < now) {
          throw new BadRequestException('Your FSSAI Food Safety License has expired. Please renew it in Store KYC Settings.');
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
    let isCodAllowed = dto.isCodAllowed !== undefined ? dto.isCodAllowed : true;
    if (categorySlug === 'khad-spray' || categorySlug.includes('khad') || billableWeight >= 25) {
      isCodAllowed = false;
    }

    // 5. Catalog Moderation Mode
    let moderationStatus: ProductModerationStatus = ProductModerationStatus.PENDING_REVIEW;
    if (isAdmin || sellerStore?.catalogApprovalMode === CatalogApprovalMode.AUTO) {
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
        sku: dto.sku || dto.skuCode,
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
        commissionOverridePercentage: isAdmin ? dto.commissionOverridePercentage : undefined,
        bulkDiscountMinQty: dto.bulkDiscountMinQty,
        bulkDiscountPercentage: dto.bulkDiscountPercentage,
        moderationStatus,
        createdById: creator.id,
      },
    });
  }

  /** Customers browsing only ever see active & approved products; sellers can view their own inactive items */
  async listAll(user?: AuthUser, includeInactiveRequested = false, sellerStoreId?: string, slug?: string, categorySlug?: string) {
    const isAdmin = Boolean(user && (hasActiveRole(user, Role.ADMIN) || hasActiveRole(user, Role.SUPER_ADMIN)));
    const isSeller = Boolean(user && hasActiveRole(user, Role.SELLER));

    let where: any = { isActive: true, moderationStatus: ProductModerationStatus.ACTIVE };

    if (includeInactiveRequested && isAdmin) {
      where = {};
    } else if (includeInactiveRequested && isSeller && user) {
      const ownStore = await this.prisma.sellerStore.findUnique({ where: { sellerId: user.id }, select: { id: true } });
      if (!ownStore) return [];
      where = { sellerStoreId: ownStore.id };
    }

    if (sellerStoreId && !(includeInactiveRequested && isSeller && !isAdmin)) {
      where.sellerStoreId = sellerStoreId;
    }
    if (slug) where.sellerStore = { slug };
    if (categorySlug) where.categorySlug = categorySlug;

    const list = await this.prisma.product.findMany({
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

    // Strip out heavy base64 strings from descriptions in catalog listing to ensure lightning-fast response (<150ms)
    return list.map((p) => {
      let desc = p.description || '';
      if (desc.includes('data:image')) {
        const idx = desc.search(/\n\nGallery:\n|\nGallery:\n|Gallery:\s*data:/i);
        if (idx > -1) {
          desc = desc.substring(0, idx).trim();
        }
      }
      return {
        ...p,
        description: desc,
      };
    });
  }

  async findOne(id: string) {
    return this.findOneOrThrow(id);
  }

  private async findOneOrThrow(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        sellerStore: {
          select: {
            id: true,
            sellerId: true,
            storeName: true,
            slug: true,
            sellerType: true,
            kycStatus: true,
            isFssaiApproved: true,
          },
        },
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    return product;
  }

  async update(user: AuthUser, id: string, dto: UpdateProductDto) {
    const product = await this.findOneOrThrow(id);
    const isAdmin = hasActiveRole(user, Role.ADMIN) || hasActiveRole(user, Role.SUPER_ADMIN);
    if (!isAdmin && product.sellerStore?.sellerId !== user.id) {
      throw new ForbiddenException('You can only edit products belonging to your own seller store.');
    }

    const updateData: Record<string, any> = { ...dto };
    delete updateData.moderationStatus;
    delete updateData.sellerStoreId;
    delete updateData.createdById;
    if (!isAdmin) {
      delete updateData.commissionOverridePercentage;
    }

    return this.prisma.product.update({ where: { id }, data: updateData });
  }

  /** Soft-delete */
  async remove(user: AuthUser, id: string) {
    const product = await this.findOneOrThrow(id);
    const isAdmin = hasActiveRole(user, Role.ADMIN) || hasActiveRole(user, Role.SUPER_ADMIN);
    if (!isAdmin && product.sellerStore?.sellerId !== user.id) {
      throw new ForbiddenException('You can only deactivate products belonging to your own seller store.');
    }
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

