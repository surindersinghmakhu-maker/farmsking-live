"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const auth_user_util_1 = require("../../common/utils/auth-user.util");
const client_1 = require("@prisma/client");
let ProductsService = class ProductsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(creator, dto) {
        const isAdmin = (0, auth_user_util_1.hasActiveRole)(creator, client_1.Role.ADMIN) || (0, auth_user_util_1.hasActiveRole)(creator, client_1.Role.SUPER_ADMIN);
        let sellerStore = null;
        if (isAdmin && dto.sellerStoreId) {
            sellerStore = await this.prisma.sellerStore.findUnique({ where: { id: dto.sellerStoreId } });
        }
        else {
            sellerStore = await this.prisma.sellerStore.findUnique({ where: { sellerId: creator.id } });
            if (!isAdmin && dto.sellerStoreId && (!sellerStore || sellerStore.id !== dto.sellerStoreId)) {
                throw new common_1.ForbiddenException('You can only list products under your own verified seller store.');
            }
        }
        if (!sellerStore) {
            if (!isAdmin) {
                throw new common_1.BadRequestException('Please register and verify your Seller Store before listing products.');
            }
            const appSettings = await this.prisma.appSetting.findUnique({ where: { id: 'default' } });
            if (!appSettings?.allowDirectPlatformSales) {
                throw new common_1.BadRequestException('Direct FarmsKing self-selling is currently inactive. Please list products under a registered seller store.');
            }
        }
        if (sellerStore && !isAdmin && sellerStore.kycStatus !== client_1.SellerKycStatus.VERIFIED) {
            throw new common_1.BadRequestException(`Your Seller Store KYC is ${sellerStore.kycStatus}. Store verification is required before listing products.`);
        }
        const categorySlug = (dto.categorySlug || dto.category || '').toLowerCase().replace(/\s+/g, '-');
        if (sellerStore && !isAdmin) {
            const now = new Date();
            if (categorySlug.includes('seed') || categorySlug === 'seeds') {
                const seedLic = (sellerStore.seedLicenseNo || sellerStore.agriLicenseNo || '').trim();
                const seedExp = sellerStore.seedLicenseExpiry || sellerStore.agriLicenseExpiryDate;
                if (!seedLic) {
                    throw new common_1.BadRequestException('A valid Seed Sale License No. is required to list seed products.');
                }
                if (seedExp && new Date(seedExp) < now) {
                    throw new common_1.BadRequestException('Your Seed / Agri Inputs License has expired. Please upload a renewed license in Store KYC Settings.');
                }
            }
            if (categorySlug.includes('pesticide') || categorySlug === 'pesticides' || categorySlug.includes('crop-protection')) {
                const pestLic = (sellerStore.pesticideLicenseNo || sellerStore.agriLicenseNo || '').trim();
                const pestExp = sellerStore.pesticideLicenseExpiry || sellerStore.agriLicenseExpiryDate;
                if (!pestLic) {
                    throw new common_1.BadRequestException('An Insecticides Act Pesticide License No. is required to list agrochemicals and crop protection products.');
                }
                if (pestExp && new Date(pestExp) < now) {
                    throw new common_1.BadRequestException('Your Pesticide / Insecticide License has expired. Please renew it in Store KYC Settings.');
                }
            }
            if (categorySlug.includes('fertilizer') || categorySlug.includes('khad') || categorySlug.includes('nutrient')) {
                const fertLic = (sellerStore.fertilizerLicenseNo || sellerStore.agriLicenseNo || '').trim();
                const fertExp = sellerStore.fertilizerLicenseExpiry || sellerStore.agriLicenseExpiryDate;
                if (!fertLic) {
                    throw new common_1.BadRequestException('A valid Fertilizer Control Order (FCO) / Agri Inputs License No. is required to list fertilizer products.');
                }
                if (fertExp && new Date(fertExp) < now) {
                    throw new common_1.BadRequestException('Your Fertilizer / Agri Inputs License has expired. Please renew it in Store KYC Settings.');
                }
            }
            if (categorySlug.includes('food') || categorySlug === 'food-products' || categorySlug.includes('organic-food')) {
                if (!sellerStore.fssaiNo || !sellerStore.fssaiNo.trim()) {
                    throw new common_1.BadRequestException('FSSAI License No. is required to list Food Products. Please update your FSSAI License Number in Store Settings.');
                }
                if (sellerStore.fssaiExpiryDate && new Date(sellerStore.fssaiExpiryDate) < now) {
                    throw new common_1.BadRequestException('Your FSSAI Food Safety License has expired. Please renew it in Store KYC Settings.');
                }
            }
        }
        const deadWeightKg = dto.deadWeightKg ?? dto.weightKg ?? 0.5;
        const lengthCm = dto.lengthCm ?? 10;
        const widthCm = dto.widthCm ?? 10;
        const heightCm = dto.heightCm ?? 10;
        const volumetricWeight = (lengthCm * widthCm * heightCm) / 5000;
        const billableWeight = Math.max(deadWeightKg, volumetricWeight);
        let isCodAllowed = dto.isCodAllowed !== undefined ? dto.isCodAllowed : true;
        if (categorySlug === 'khad-spray' || categorySlug.includes('khad') || billableWeight >= 25) {
            isCodAllowed = false;
        }
        let moderationStatus = client_1.ProductModerationStatus.PENDING_REVIEW;
        if (isAdmin || sellerStore?.catalogApprovalMode === client_1.CatalogApprovalMode.AUTO) {
            moderationStatus = client_1.ProductModerationStatus.ACTIVE;
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
    async listAll(user, includeInactiveRequested = false, sellerStoreId, slug, categorySlug) {
        const isAdmin = Boolean(user && ((0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADMIN) || (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SUPER_ADMIN)));
        const isSeller = Boolean(user && (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SELLER));
        let where = { isActive: true, moderationStatus: client_1.ProductModerationStatus.ACTIVE };
        if (includeInactiveRequested && isAdmin) {
            where = {};
        }
        else if (includeInactiveRequested && isSeller && user) {
            const ownStore = await this.prisma.sellerStore.findUnique({ where: { sellerId: user.id }, select: { id: true } });
            if (!ownStore)
                return [];
            where = { sellerStoreId: ownStore.id };
        }
        if (sellerStoreId && !(includeInactiveRequested && isSeller && !isAdmin)) {
            where.sellerStoreId = sellerStoreId;
        }
        if (slug)
            where.sellerStore = { slug };
        if (categorySlug)
            where.categorySlug = categorySlug;
        const list = await this.prisma.product.findMany({
            where,
            take: 150,
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
    async findOne(id) {
        return this.findOneOrThrow(id);
    }
    async findOneOrThrow(id) {
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
            throw new common_1.NotFoundException('Product not found.');
        }
        return product;
    }
    async update(user, id, dto) {
        const product = await this.findOneOrThrow(id);
        const isAdmin = (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADMIN) || (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SUPER_ADMIN);
        if (!isAdmin && product.sellerStore?.sellerId !== user.id) {
            throw new common_1.ForbiddenException('You can only edit products belonging to your own seller store.');
        }
        const updateData = { ...dto };
        delete updateData.moderationStatus;
        delete updateData.sellerStoreId;
        delete updateData.createdById;
        if (!isAdmin) {
            delete updateData.commissionOverridePercentage;
        }
        return this.prisma.product.update({ where: { id }, data: updateData });
    }
    async remove(user, id) {
        const product = await this.findOneOrThrow(id);
        const isAdmin = (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADMIN) || (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SUPER_ADMIN);
        if (!isAdmin && product.sellerStore?.sellerId !== user.id) {
            throw new common_1.ForbiddenException('You can only deactivate products belonging to your own seller store.');
        }
        return this.prisma.product.update({ where: { id }, data: { isActive: false } });
    }
    async addReview(user, productId, rating, title, comment, photoUrls) {
        if (rating < 1 || rating > 5) {
            throw new common_1.BadRequestException('Rating must be between 1 and 5 stars.');
        }
        const product = await this.findOneOrThrow(productId);
        const cleanTitle = (title || '').trim().slice(0, 120);
        const cleanComment = (comment || '').trim().slice(0, 1200);
        const existingReview = await this.prisma.productReview.findFirst({
            where: { productId, userId: user.id },
            orderBy: { createdAt: 'desc' },
        });
        const review = existingReview
            ? await this.prisma.productReview.update({
                where: { id: existingReview.id },
                data: {
                    rating,
                    title: cleanTitle,
                    comment: cleanComment,
                    photoUrls: photoUrls || existingReview.photoUrls || [],
                },
            })
            : await this.prisma.productReview.create({
                data: {
                    productId,
                    userId: user.id,
                    rating,
                    title: cleanTitle,
                    comment: cleanComment,
                    photoUrls: photoUrls || [],
                },
            });
        const stats = await this.prisma.productReview.aggregate({
            where: { productId },
            _avg: { rating: true },
        });
        if (stats?._avg?.rating != null) {
            await this.prisma.product.update({
                where: { id: productId },
                data: { rating: parseFloat(stats._avg.rating.toFixed(1)) },
            });
        }
        const recentReviews = await this.prisma.productReview.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' },
            take: 3,
        });
        if (recentReviews.length >= 3 && recentReviews.every((r) => r.rating <= 2)) {
            await this.prisma.product.update({
                where: { id: productId },
                data: {
                    isActive: false,
                    moderationStatus: client_1.ProductModerationStatus.REJECTED,
                    rejectionReason: 'AUTO_SUSPENDED: Received 3 consecutive <= 2-star reviews. Pending Admin safety review.',
                },
            });
            if (product.sellerStoreId) {
                const totalBlocked = await this.prisma.product.count({
                    where: {
                        sellerStoreId: product.sellerStoreId,
                        moderationStatus: client_1.ProductModerationStatus.REJECTED,
                    },
                });
                if (totalBlocked >= 2) {
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
    async getReviews(productId) {
        const reviews = await this.prisma.productReview.findMany({
            where: { productId },
            take: 200,
            include: {
                user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const reviewerIds = Array.from(new Set(reviews.map((r) => r.userId).filter(Boolean)));
        const verifiedBuyerSet = new Set();
        if (reviewerIds.length > 0 && this.prisma.customerOrderItem?.findMany) {
            const boughtItems = await this.prisma.customerOrderItem.findMany({
                where: {
                    productId,
                    order: {
                        customerId: { in: reviewerIds },
                        status: { not: 'CANCELLED' },
                    },
                },
                select: {
                    order: { select: { customerId: true } },
                },
            });
            for (const item of boughtItems) {
                if (item.order?.customerId) {
                    verifiedBuyerSet.add(item.order.customerId);
                }
            }
        }
        const enrichedReviews = reviews.map((r) => ({
            ...r,
            isVerifiedBuyer: verifiedBuyerSet.has(r.userId),
        }));
        const total = enrichedReviews.length;
        const avgRating = total > 0 ? parseFloat((enrichedReviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1)) : null;
        return {
            reviews: enrichedReviews,
            total,
            verifiedBuyerCount: enrichedReviews.filter((r) => r.isVerifiedBuyer).length,
            avgRating,
        };
    }
    async listPendingForAdmin() {
        return this.prisma.product.findMany({
            where: {
                OR: [
                    { moderationStatus: client_1.ProductModerationStatus.PENDING_REVIEW },
                    { moderationStatus: client_1.ProductModerationStatus.REJECTED },
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
    async approveProductByAdmin(id) {
        await this.findOneOrThrow(id);
        return this.prisma.product.update({
            where: { id },
            data: { isActive: true, moderationStatus: client_1.ProductModerationStatus.ACTIVE, rejectionReason: null },
        });
    }
    async rejectProductByAdmin(id, reason) {
        if (!reason?.trim()) {
            throw new common_1.BadRequestException('A reason is required when rejecting a product.');
        }
        await this.findOneOrThrow(id);
        return this.prisma.product.update({
            where: { id },
            data: { isActive: false, moderationStatus: client_1.ProductModerationStatus.REJECTED, rejectionReason: reason.trim() },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map