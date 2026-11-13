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
exports.NurseryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let NurseryService = class NurseryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listBatches(params) {
        const page = Math.max(1, Number(params?.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(params?.limit) || 20));
        const skip = (page - 1) * limit;
        const where = {
            stage: { in: ['READY_FOR_SALE', 'SOWN'] },
            isDelistedDueToFine: false,
        };
        if (params?.category) {
            where.category = params.category;
        }
        if (params?.isFlashSaleOnly) {
            where.isFlashSaleActive = true;
        }
        if (params?.search) {
            where.OR = [
                { varietyName: { contains: params.search, mode: 'insensitive' } },
                { owner: { name: { contains: params.search, mode: 'insensitive' } } },
                { owner: { district: { contains: params.search, mode: 'insensitive' } } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.plotNurseryBatch.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ isFlashSaleActive: 'desc' }, { compositeCoreScore: 'desc' }, { createdAt: 'desc' }],
                include: {
                    owner: {
                        select: {
                            id: true,
                            name: true,
                            village: true,
                            district: true,
                            state: true,
                            photoUrl: true,
                            kycVerified: true,
                        },
                    },
                },
            }),
            this.prisma.plotNurseryBatch.count({ where }),
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getBatchById(id) {
        const batch = await this.prisma.plotNurseryBatch.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        village: true,
                        district: true,
                        state: true,
                        photoUrl: true,
                        kycVerified: true,
                    },
                },
                reviews: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!batch) {
            throw new common_1.NotFoundException('Nursery batch not found.');
        }
        return batch;
    }
    async createBatch(ownerId, dto) {
        const now = new Date();
        const readyDate = dto.readyDate ? new Date(dto.readyDate) : now;
        const sowingDate = dto.sowingDate ? new Date(dto.sowingDate) : new Date(readyDate.getTime() - 25 * 86400000);
        const uprootingDeadline = dto.uprootingDeadline
            ? new Date(dto.uprootingDeadline)
            : new Date(readyDate.getTime() + 45 * 86400000);
        if (readyDate < sowingDate) {
            throw new common_1.BadRequestException('Ready date cannot be before sowing date.');
        }
        if (uprootingDeadline < readyDate) {
            throw new common_1.BadRequestException('Uprooting deadline cannot be before ready date.');
        }
        return this.prisma.plotNurseryBatch.create({
            data: {
                ownerId,
                plotId: dto.plotId || null,
                category: dto.category,
                varietyName: dto.varietyName.trim(),
                sowingDate,
                readyDate,
                uprootingDeadline,
                seedTagPhotoUrl: dto.seedTagPhotoUrl || null,
                isSeedCertified: dto.isSeedCertified ?? Boolean(dto.seedTagPhotoUrl),
                sowingPhotoUrl: dto.sowingPhotoUrl || null,
                uprootingPhotoUrl: dto.uprootingPhotoUrl || null,
                trayCavityCount: dto.trayCavityCount || 104,
                guaranteedBundlesPerAcre: dto.guaranteedBundlesPerAcre || 300,
                pricePerUnit: dto.pricePerUnit,
                estimatedCapacity: dto.estimatedCapacity,
                minOrderAmount: dto.minOrderAmount || 2000,
                deliveryPricingType: dto.deliveryPricingType || 'INCLUDED',
                stage: 'READY_FOR_SALE',
            },
        });
    }
    async getMyGrowerBatches(ownerId) {
        return this.prisma.plotNurseryBatch.findMany({
            where: { ownerId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { orders: true, reviews: true },
                },
            },
        });
    }
    async getMyGrowerOrders(ownerId) {
        return this.prisma.plotNurseryOrder.findMany({
            where: {
                batch: { ownerId },
            },
            orderBy: { createdAt: 'desc' },
            include: {
                buyer: {
                    select: {
                        id: true,
                        name: true,
                        mobile: true,
                        village: true,
                        district: true,
                        state: true,
                    },
                },
                batch: {
                    select: {
                        varietyName: true,
                        category: true,
                        pricePerUnit: true,
                    },
                },
            },
        });
    }
    async updateDispatchDetails(ownerId, orderId, dto) {
        const order = await this.prisma.plotNurseryOrder.findUnique({
            where: { id: orderId },
            include: { batch: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found.');
        }
        if (order.batch.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('You are not authorized to update this order.');
        }
        return this.prisma.plotNurseryOrder.update({
            where: { id: orderId },
            data: {
                busNumber: dto.busNumber || order.busNumber,
                busDepotRoute: dto.busDepotRoute || order.busDepotRoute,
                busConductorMobile: dto.busConductorMobile || order.busConductorMobile,
                busBiltyPhotoUrl: dto.busBiltyPhotoUrl || order.busBiltyPhotoUrl,
                trainNumber: dto.trainNumber || order.trainNumber,
                railwayReceiptNumber: dto.railwayReceiptNumber || order.railwayReceiptNumber,
                destinationStation: dto.destinationStation || order.destinationStation,
                rrBiltyPhotoUrl: dto.rrBiltyPhotoUrl || order.rrBiltyPhotoUrl,
                driverName: dto.driverName || order.driverName,
                driverMobile: dto.driverMobile || order.driverMobile,
                vehicleNumber: dto.vehicleNumber || order.vehicleNumber,
                expectedArrivalAt: dto.expectedArrivalAt ? new Date(dto.expectedArrivalAt) : order.expectedArrivalAt,
                status: 'DISPATCHED_IN_TRANSIT',
            },
        });
    }
    async createOrder(buyerId, dto) {
        const batch = await this.prisma.plotNurseryBatch.findUnique({
            where: { id: dto.batchId },
        });
        if (!batch) {
            throw new common_1.NotFoundException('Nursery batch not found.');
        }
        if (batch.isDelistedDueToFine) {
            throw new common_1.BadRequestException('This batch is temporarily unavailable.');
        }
        const availableCapacity = Number(batch.estimatedCapacity) - Number(batch.bookedQuantity);
        if (dto.quantityUnits > availableCapacity) {
            throw new common_1.BadRequestException(`Only ${availableCapacity} units available in this batch.`);
        }
        const unitPrice = Number(batch.pricePerUnit);
        const orderSubtotal = unitPrice * dto.quantityUnits;
        if (orderSubtotal < Number(batch.minOrderAmount || 2000)) {
            throw new common_1.BadRequestException(`Minimum order amount for this nursery is ₹${batch.minOrderAmount || 2000}. Current order value is ₹${orderSubtotal.toFixed(2)}.`);
        }
        const farmerPlatformFee = 100;
        const farmskingCommission = Number((orderSubtotal * 0.05).toFixed(2));
        let agentFarmerShare = 0;
        let agentOwnerShare = 0;
        let totalAgentCommission = 0;
        if (dto.agentId) {
            agentFarmerShare = Number((orderSubtotal * 0.01).toFixed(2));
            agentOwnerShare = Number((orderSubtotal * 0.01).toFixed(2));
            totalAgentCommission = agentFarmerShare + agentOwnerShare;
        }
        const ownerNetPayout = Number((orderSubtotal - farmskingCommission - agentOwnerShare).toFixed(2));
        const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
        const randPart = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `FK-NB-${new Date().getFullYear()}-${randPart}`;
        const requestedDeliveryDate = new Date(dto.requestedDeliveryDate);
        const [order] = await this.prisma.$transaction([
            this.prisma.plotNurseryOrder.create({
                data: {
                    orderNumber,
                    batchId: dto.batchId,
                    buyerId,
                    agentId: dto.agentId || null,
                    quantityUnits: dto.quantityUnits,
                    unitPrice,
                    orderSubtotal,
                    transportMode: dto.transportMode,
                    deliveryMode: dto.deliveryMode,
                    deliveryPricingType: batch.deliveryPricingType,
                    farmerPlatformFee,
                    farmskingCommission,
                    agentFarmerShare,
                    agentOwnerShare,
                    totalAgentCommission,
                    ownerNetPayout,
                    deliveryOtp,
                    requestedDeliveryDate,
                    originalDeliveryDate: requestedDeliveryDate,
                    status: 'BOOKED_ESCROW_PAID',
                },
            }),
            this.prisma.plotNurseryBatch.update({
                where: { id: dto.batchId },
                data: {
                    bookedQuantity: {
                        increment: dto.quantityUnits,
                    },
                },
            }),
        ]);
        return order;
    }
    async getMyOrders(buyerId) {
        return this.prisma.plotNurseryOrder.findMany({
            where: { buyerId },
            orderBy: { createdAt: 'desc' },
            include: {
                batch: {
                    include: {
                        owner: {
                            select: {
                                id: true,
                                name: true,
                                mobile: true,
                                village: true,
                                district: true,
                                state: true,
                            },
                        },
                    },
                },
                agent: {
                    select: {
                        id: true,
                        name: true,
                        mobile: true,
                    },
                },
            },
        });
    }
    async getOrderById(userId, orderId) {
        const order = await this.prisma.plotNurseryOrder.findUnique({
            where: { id: orderId },
            include: {
                batch: {
                    include: {
                        owner: {
                            select: {
                                id: true,
                                name: true,
                                mobile: true,
                                village: true,
                                district: true,
                                state: true,
                            },
                        },
                    },
                },
                buyer: {
                    select: {
                        id: true,
                        name: true,
                        mobile: true,
                        village: true,
                        district: true,
                        state: true,
                    },
                },
                agent: {
                    select: {
                        id: true,
                        name: true,
                        mobile: true,
                    },
                },
                review: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found.');
        }
        const isBuyer = order.buyerId === userId;
        const isGrower = order.batch.ownerId === userId;
        const isAgent = order.agentId === userId;
        if (!isBuyer && !isGrower && !isAgent) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (user?.role !== client_1.Role.ADMIN && user?.role !== client_1.Role.SUPER_ADMIN) {
                throw new common_1.ForbiddenException('Not authorized to access this order.');
            }
        }
        return order;
    }
    async confirmDeliveryReceived(buyerId, orderId, dto) {
        const order = await this.prisma.plotNurseryOrder.findUnique({
            where: { id: orderId },
            include: { batch: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found.');
        }
        if (order.buyerId !== buyerId) {
            throw new common_1.ForbiddenException('Only the purchasing buyer can confirm delivery.');
        }
        if (order.isConfirmedReceived) {
            throw new common_1.BadRequestException('This order has already been marked as received and settled.');
        }
        if (order.deliveryOtp !== dto.deliveryOtp.trim()) {
            throw new common_1.BadRequestException('Invalid delivery OTP. Please verify with driver/agent.');
        }
        const deliveryRating = dto.deliveryRating || 5;
        const plantQualityRating = dto.plantQualityRating || 5;
        const compositeScore = ((deliveryRating + plantQualityRating) / 2).toFixed(2);
        const [updatedOrder] = await this.prisma.$transaction([
            this.prisma.plotNurseryOrder.update({
                where: { id: orderId },
                data: {
                    isConfirmedReceived: true,
                    receivedConfirmedAt: new Date(),
                    status: 'DELIVERED_COMPLETED',
                },
            }),
            this.prisma.nurseryReview.create({
                data: {
                    orderId,
                    batchId: order.batchId,
                    buyerId,
                    deliveryRating,
                    plantQualityRating,
                    compositeRating: compositeScore,
                    reviewText: dto.reviewText || null,
                },
            }),
        ]);
        return updatedOrder;
    }
    async extendOrderDate(buyerId, orderId, dto) {
        const order = await this.prisma.plotNurseryOrder.findUnique({
            where: { id: orderId },
            include: { batch: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found.');
        }
        if (order.buyerId !== buyerId) {
            throw new common_1.ForbiddenException('Only the buyer can request a date extension.');
        }
        if (order.status !== 'BOOKED_ESCROW_PAID') {
            throw new common_1.BadRequestException('Date extension is only available prior to dispatch.');
        }
        const now = new Date();
        const currentDelivery = new Date(order.requestedDeliveryDate);
        const hoursRemaining = (currentDelivery.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursRemaining < 48) {
            throw new common_1.BadRequestException('Date extension must be requested at least 48 hours prior to the scheduled delivery date.');
        }
        const newDelivery = new Date(dto.newDeliveryDate);
        if (newDelivery <= currentDelivery) {
            throw new common_1.BadRequestException('New date must be after current delivery date.');
        }
        if (newDelivery > order.batch.uprootingDeadline) {
            throw new common_1.BadRequestException(`Proposed date exceeds the nursery uprooting deadline (${order.batch.uprootingDeadline.toISOString().split('T')[0]}). Seedlings will over-mature.`);
        }
        return this.prisma.plotNurseryOrder.update({
            where: { id: orderId },
            data: {
                requestedDeliveryDate: newDelivery,
                isDateExtended: true,
                extendedAt: now,
            },
        });
    }
    async cancelOrder(buyerId, orderId, dto) {
        const order = await this.prisma.plotNurseryOrder.findUnique({
            where: { id: orderId },
            include: { batch: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found.');
        }
        if (order.buyerId !== buyerId) {
            throw new common_1.ForbiddenException('Only the buyer can cancel this order.');
        }
        if (order.isCancelled || order.isConfirmedReceived) {
            throw new common_1.BadRequestException('Order cannot be cancelled in its current state.');
        }
        const now = new Date();
        const deliveryDate = new Date(order.requestedDeliveryDate);
        const hoursRemaining = (deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        const subtotal = Number(order.orderSubtotal);
        let stage;
        let cancellationFee;
        let cancellationOwnerClaim;
        let cancellationFkShare;
        let refundAmountToFarmer;
        if (order.status === 'UPROOTING_IN_PROGRESS' || hoursRemaining <= 48) {
            stage = client_1.CancellationStage.LAST_48_HOURS_LOCKED;
            cancellationFee = subtotal;
            cancellationOwnerClaim = Number((subtotal * 0.95).toFixed(2));
            cancellationFkShare = Number((subtotal * 0.05).toFixed(2));
            refundAmountToFarmer = 0;
        }
        else if (hoursRemaining <= 120) {
            stage = client_1.CancellationStage.CRITICAL_2_TO_5_DAYS;
            cancellationFee = Number((subtotal * 0.5).toFixed(2));
            cancellationOwnerClaim = Number((subtotal * 0.4).toFixed(2));
            cancellationFkShare = Number((subtotal * 0.1).toFixed(2));
            refundAmountToFarmer = Number((subtotal * 0.5).toFixed(2));
        }
        else {
            stage = client_1.CancellationStage.ADVANCE_5_DAYS_PLUS;
            cancellationFee = Math.max(500, Number((subtotal * 0.2).toFixed(2)));
            cancellationOwnerClaim = Number((cancellationFee * 0.75).toFixed(2));
            cancellationFkShare = Number((cancellationFee * 0.25).toFixed(2));
            refundAmountToFarmer = Math.max(0, subtotal - cancellationFee);
        }
        const [cancelledOrder] = await this.prisma.$transaction([
            this.prisma.plotNurseryOrder.update({
                where: { id: orderId },
                data: {
                    isCancelled: true,
                    cancellationStage: stage,
                    cancellationFee,
                    cancellationOwnerClaim,
                    cancellationFkShare,
                    refundAmountToFarmer,
                    status: 'CANCELLED',
                },
            }),
            this.prisma.plotNurseryBatch.update({
                where: { id: order.batchId },
                data: {
                    bookedQuantity: {
                        decrement: order.quantityUnits,
                    },
                },
            }),
        ]);
        return cancelledOrder;
    }
    async logEnquiryTicket(agentId, dto) {
        return this.prisma.nurseryEnquiryTicket.create({
            data: {
                assignedPartnerId: agentId,
                customerId: dto.customerId,
                orderId: dto.orderId || null,
                subject: dto.subject.trim(),
                description: dto.description.trim(),
                isLoggedByPartner: true,
                status: 'OPEN_ASSIGNED_TO_PARTNER',
            },
        });
    }
    async getAgentOrders(agentId) {
        return this.prisma.plotNurseryOrder.findMany({
            where: { agentId },
            orderBy: { createdAt: 'desc' },
            include: {
                batch: {
                    include: {
                        owner: {
                            select: {
                                id: true,
                                name: true,
                                mobile: true,
                                village: true,
                                district: true,
                            },
                        },
                    },
                },
                buyer: {
                    select: {
                        id: true,
                        name: true,
                        mobile: true,
                        village: true,
                        district: true,
                    },
                },
            },
        });
    }
};
exports.NurseryService = NurseryService;
exports.NurseryService = NurseryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NurseryService);
//# sourceMappingURL=nursery.service.js.map