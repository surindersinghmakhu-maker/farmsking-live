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
const client_1 = require("@prisma/client");
let ProductsService = class ProductsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(creator, dto) {
        let sellerStore = null;
        if (dto.sellerStoreId) {
            sellerStore = await this.prisma.sellerStore.findUnique({ where: { id: dto.sellerStoreId } });
        }
        else {
            sellerStore = await this.prisma.sellerStore.findUnique({ where: { sellerId: creator.id } });
        }
        if (!sellerStore) {
            const appSettings = await this.prisma.appSetting.findUnique({ where: { id: 'default' } });
            if (!appSettings?.allowDirectPlatformSales) {
                throw new common_1.BadRequestException('Direct FarmsKing self-selling is currently inactive. Please list products under a registered seller store (e.g. Surinder Agro Store).');
            }
        }
        const categorySlug = (dto.categorySlug || dto.category || '').toLowerCase().replace(/\s+/g, '-');
        if (sellerStore) {
            if (categorySlug.includes('pesticide') || categorySlug === 'pesticides' || categorySlug.includes('seed') || categorySlug === 'seeds' || categorySlug.includes('crop-protection')) {
                if (!sellerStore.agriLicenseNo || !sellerStore.agriLicenseNo.trim()) {
                    throw new common_1.BadRequestException('Agri Inputs License No. (Seeds / Pesticide License) is required to list Seeds & Agrochemical Pesticides. Please update your Agri License in Store Settings.');
                }
            }
            if (categorySlug.includes('food') || categorySlug === 'food-products' || categorySlug.includes('organic-food')) {
                if (!sellerStore.fssaiNo || !sellerStore.fssaiNo.trim()) {
                    throw new common_1.BadRequestException('FSSAI License No. is required to list Food Products. Please update your FSSAI License Number in Store Settings.');
                }
            }
        }
        const deadWeightKg = dto.deadWeightKg ?? dto.weightKg ?? 0.5;
        const lengthCm = dto.lengthCm ?? 10;
        const widthCm = dto.widthCm ?? 10;
        const heightCm = dto.heightCm ?? 10;
        const volumetricWeight = (lengthCm * widthCm * heightCm) / 5000;
        const billableWeight = Math.max(deadWeightKg, volumetricWeight);
        let isCodAllowed = true;
        if (categorySlug === 'khad-spray' || categorySlug.includes('khad') || billableWeight >= 25) {
            isCodAllowed = false;
        }
        let moderationStatus = client_1.ProductModerationStatus.PENDING_REVIEW;
        if (sellerStore?.catalogApprovalMode === client_1.CatalogApprovalMode.AUTO) {
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
    listAll(includeInactive, sellerStoreId, slug, categorySlug) {
        const where = includeInactive
            ? {}
            : { isActive: true, moderationStatus: client_1.ProductModerationStatus.ACTIVE };
        if (sellerStoreId)
            where.sellerStoreId = sellerStoreId;
        if (slug)
            where.sellerStore = { slug };
        if (categorySlug)
            where.categorySlug = categorySlug;
        return this.prisma.product.findMany({
            where,
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
    async findOneOrThrow(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { sellerStore: true },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found.');
        }
        return product;
    }
    async update(id, dto) {
        await this.findOneOrThrow(id);
        return this.prisma.product.update({ where: { id }, data: dto });
    }
    async remove(id) {
        await this.findOneOrThrow(id);
        return this.prisma.product.update({ where: { id }, data: { isActive: false } });
    }
    async addReview(user, productId, rating, title, comment, photoUrls) {
        if (rating < 1 || rating > 5) {
            throw new common_1.BadRequestException('Rating must be between 1 and 5 stars.');
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
    async listPendingForAdmin() {
        return this.prisma.product.findMany({
            where: {
                OR: [
                    { moderationStatus: client_1.ProductModerationStatus.PENDING_REVIEW },
                    { moderationStatus: client_1.ProductModerationStatus.REJECTED },
                ],
            },
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