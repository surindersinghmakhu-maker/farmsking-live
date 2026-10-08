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
var CashfreeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashfreeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let CashfreeService = CashfreeService_1 = class CashfreeService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(CashfreeService_1.name);
        this.appId = this.configService.get('CASHFREE_APP_ID') || 'TEST_APP_ID';
        this.secretKey = this.configService.get('CASHFREE_SECRET_KEY') || 'TEST_SECRET_KEY';
        const env = this.configService.get('CASHFREE_ENV') || 'SANDBOX';
        this.baseUrl = env.toUpperCase() === 'PRODUCTION'
            ? 'https://api.cashfree.com/pg'
            : 'https://sandbox.cashfree.com/pg';
    }
    getHeaders() {
        return {
            'x-client-id': this.appId,
            'x-client-secret': this.secretKey,
            'x-api-version': '2023-08-01',
            'Content-Type': 'application/json',
        };
    }
    async createVendorOnCashfree(dto) {
        const endpoint = `${this.baseUrl}/easy-split/vendors`;
        const payload = {
            vendor_id: dto.vendorId,
            status: 'ACTIVE',
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            verify_account: true,
            bank_details: dto.bankAccountNo && dto.bankIfsc ? {
                account_number: dto.bankAccountNo,
                account_holder: dto.bankAccountHolderName || dto.name,
                ifsc: dto.bankIfsc,
            } : undefined,
            upi_details: dto.upiId ? {
                vpa: dto.upiId,
                account_holder: dto.name,
            } : undefined,
            kyc_details: dto.gstin ? {
                gstin: dto.gstin,
            } : undefined,
        };
        try {
            this.logger.log(`Creating Cashfree Vendor: ${dto.vendorId}`);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload),
            });
            const resData = await response.json();
            if (!response.ok) {
                this.logger.error(`Cashfree Vendor Creation Failed: ${JSON.stringify(resData)}`);
                if (resData?.code === 'vendor_already_exists') {
                    return { vendor_id: dto.vendorId, status: 'EXISTS' };
                }
                throw new common_1.BadRequestException(resData?.message || 'Cashfree Vendor registration failed.');
            }
            await this.prisma.sellerStore.updateMany({
                where: { id: dto.vendorId },
                data: { cashfreeVendorId: resData.vendor_id || dto.vendorId },
            });
            return resData;
        }
        catch (error) {
            this.logger.error('Error calling Cashfree Vendor API:', error);
            throw new common_1.InternalServerErrorException(error.message || 'Cashfree API error');
        }
    }
    async createSplitOrder(dto) {
        const endpoint = `${this.baseUrl}/orders`;
        const orderSplits = dto.splits.map((split) => {
            const commissionPercent = split.commissionRate || 5.0;
            const tcsPercent = 1.0;
            const totalDeductionPercent = commissionPercent + tcsPercent;
            const vendorAmount = Number((split.itemSubtotal * (1 - totalDeductionPercent / 100)).toFixed(2));
            return {
                vendor_id: split.cashfreeVendorId,
                amount: vendorAmount,
                percentage: undefined,
            };
        });
        const payload = {
            order_id: dto.orderId,
            order_amount: dto.amount,
            order_currency: 'INR',
            customer_details: {
                customer_id: dto.customerId,
                customer_name: dto.customerName || 'FarmsKing Customer',
                customer_phone: dto.customerPhone,
            },
            order_splits: orderSplits.length > 0 ? orderSplits : undefined,
            order_meta: {
                return_url: `https://farmsking.in/order-status?order_id={order_id}`,
                notify_url: `https://api.farmsking.in/cashfree/webhook`,
            },
        };
        try {
            this.logger.log(`Creating Cashfree Order: ${dto.orderId}`);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload),
            });
            const resData = await response.json();
            if (!response.ok) {
                this.logger.error(`Cashfree Order Creation Failed: ${JSON.stringify(resData)}`);
                throw new common_1.BadRequestException(resData?.message || 'Cashfree Order creation failed.');
            }
            return {
                orderId: resData.order_id,
                paymentSessionId: resData.payment_session_id,
                orderStatus: resData.order_status,
            };
        }
        catch (error) {
            this.logger.error('Error creating Cashfree split order:', error);
            throw new common_1.InternalServerErrorException(error.message || 'Cashfree Split Order creation failed.');
        }
    }
    async createStandardOrder(dto) {
        const endpoint = `${this.baseUrl}/orders`;
        const payload = {
            order_id: dto.orderId,
            order_amount: dto.amount,
            order_currency: 'INR',
            customer_details: {
                customer_id: dto.customerId,
                customer_name: dto.customerName || 'FarmsKing User',
                customer_phone: dto.customerPhone || '9999999999',
            },
            order_meta: {
                return_url: `https://farmsking.in/payment-status?order_id={order_id}`,
                notify_url: `https://api.farmsking.in/cashfree/webhook`,
            },
        };
        try {
            this.logger.log(`Creating Cashfree Standard Order: ${dto.orderId}`);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload),
            });
            const resData = await response.json();
            if (!response.ok) {
                this.logger.error(`Cashfree Order Creation Failed: ${JSON.stringify(resData)}`);
                throw new common_1.BadRequestException(resData?.message || 'Cashfree Order creation failed.');
            }
            return {
                orderId: resData.order_id,
                paymentSessionId: resData.payment_session_id,
                orderStatus: resData.order_status,
            };
        }
        catch (error) {
            this.logger.error('Error creating Cashfree standard order:', error);
            throw new common_1.InternalServerErrorException(error.message || 'Cashfree Order creation failed.');
        }
    }
    async verifyPayment(orderId) {
        const endpoint = `${this.baseUrl}/orders/${orderId}`;
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: this.getHeaders(),
            });
            const resData = await response.json();
            if (!response.ok) {
                throw new common_1.BadRequestException(resData?.message || 'Failed to verify Cashfree order');
            }
            if (resData.order_status === 'PAID') {
                await this.handlePaymentSuccess(orderId, resData);
            }
            return resData;
        }
        catch (error) {
            this.logger.error(`Error verifying Cashfree order ${orderId}:`, error);
            throw new common_1.InternalServerErrorException('Error verifying payment status');
        }
    }
    async handlePaymentSuccess(orderId, cashfreeData) {
        const order = await this.prisma.customerOrder.findUnique({
            where: { orderNumber: orderId },
            include: {
                items: {
                    include: {
                        sellerStore: true,
                    },
                },
            },
        });
        if (!order) {
            this.logger.warn(`Order ${orderId} not found in database for payment confirmation.`);
            return;
        }
        await this.prisma.customerOrder.update({
            where: { id: order.id },
            data: {
                paymentStatus: client_1.OrderPaymentStatus.PAID,
                phonepeMerchantOrderId: cashfreeData?.order_id || orderId,
                phonepePaymentState: cashfreeData?.order_status || 'PAID',
            },
        });
        const sellerMap = new Map();
        for (const item of order.items) {
            if (!item.sellerStoreId)
                continue;
            const subtotal = Number(item.subtotal || Number(item.price) * item.quantity);
            const existing = sellerMap.get(item.sellerStoreId) || { storeId: item.sellerStoreId, subtotal: 0, items: [] };
            existing.subtotal += subtotal;
            existing.items.push(item);
            sellerMap.set(item.sellerStoreId, existing);
        }
        for (const [sellerStoreId, data] of sellerMap.entries()) {
            const store = await this.prisma.sellerStore.findUnique({ where: { id: sellerStoreId } });
            const commissionRate = Number(store?.commissionRate || 5.0);
            const commissionAmount = (data.subtotal * commissionRate) / 100;
            const tcsAmount = (data.subtotal * 1.0) / 100;
            const netPayoutAmount = data.subtotal - commissionAmount - tcsAmount;
            const payoutRefNo = `PAY-${order.orderNumber}-${sellerStoreId.substring(0, 6)}`;
            await this.prisma.sellerPayout.upsert({
                where: { payoutRefNo },
                create: {
                    sellerStoreId,
                    payoutRefNo,
                    totalGrossAmount: data.subtotal,
                    totalCommissionAmount: commissionAmount,
                    totalTcsAmount: tcsAmount,
                    netPayoutAmount: netPayoutAmount,
                    status: client_1.SellerPayoutStatus.SETTLED,
                    paidAt: new Date(),
                },
                update: {
                    status: client_1.SellerPayoutStatus.SETTLED,
                    paidAt: new Date(),
                },
            });
            for (const item of data.items) {
                const itemSubtotal = Number(item.subtotal || Number(item.price) * item.quantity);
                const itemCommission = (itemSubtotal * commissionRate) / 100;
                const itemTcs = (itemSubtotal * 1.0) / 100;
                const itemNetPayout = itemSubtotal - itemCommission - itemTcs;
                await this.prisma.customerOrderItem.update({
                    where: { id: item.id },
                    data: {
                        subtotal: itemSubtotal,
                        commissionAmount: itemCommission,
                        tcsAmount: itemTcs,
                        sellerPayoutAmount: itemNetPayout,
                    },
                });
            }
        }
    }
    async handleWebhook(body) {
        this.logger.log(`Cashfree Webhook received: ${JSON.stringify(body)}`);
        const orderId = body?.data?.order?.order_id;
        const orderStatus = body?.data?.order?.order_status;
        if (orderId && orderStatus === 'PAID') {
            if (orderId.startsWith('PLAN-')) {
                await this.handlePlanPaymentSuccess(orderId);
            }
            else if (orderId.startsWith('GCARD-')) {
                await this.handleGardenerPlanPaymentSuccess(orderId);
            }
            else if (orderId.startsWith('WALLET-')) {
                await this.handleWalletTopupSuccess(orderId, body.data?.order);
            }
            else if (orderId.startsWith('DOC-')) {
                await this.handleDoctorConsultationSuccess(orderId);
            }
            else {
                await this.handlePaymentSuccess(orderId, body.data?.order);
            }
        }
        return { status: 'SUCCESS' };
    }
    async handleWalletTopupSuccess(orderId, cashfreeData) {
        const parts = orderId.split('-');
        if (parts.length >= 3) {
            const userId = parts[1];
            const amount = Number(cashfreeData?.order_amount || parts[2]);
            if (userId && amount > 0) {
                const user = await this.prisma.user.findUnique({ where: { id: userId } });
                if (user) {
                    await this.prisma.walletTransaction.create({
                        data: {
                            userId,
                            amount,
                            type: 'CREDIT',
                            reason: `Cashfree Online Wallet Recharge ₹${amount} (Order: ${orderId})`,
                        },
                    });
                }
            }
        }
    }
    async handleDoctorConsultationSuccess(orderId) {
        this.logger.log(`Doctor consultation payment confirmed for order: ${orderId}`);
    }
    async handlePlanPaymentSuccess(orderId) {
        const requestId = orderId.replace('PLAN-', '');
        await this.prisma.farmerPlanPaymentRequest.updateMany({
            where: { id: requestId, status: 'PENDING' },
            data: { status: 'SUBMITTED', utr: 'CASHFREE-AUTO', submittedAt: new Date() },
        });
    }
    async handleGardenerPlanPaymentSuccess(orderId) {
        const requestId = orderId.replace('GCARD-', '');
        const request = await this.prisma.gardenerPlanPaymentRequest.findUnique({
            where: { id: requestId },
        });
        if (!request || request.status !== 'PENDING')
            return;
        await this.prisma.$transaction(async (tx) => {
            await tx.gardenerPlanPaymentRequest.update({
                where: { id: requestId },
                data: { status: client_1.PlanPaymentStatus.CONFIRMED, paidAt: new Date() },
            });
            const now = new Date();
            await tx.gardenerPlan.upsert({
                where: { gardenerId: request.gardenerId },
                create: {
                    gardenerId: request.gardenerId,
                    plan: request.plan,
                    startDate: now,
                    endDate: null,
                    expiredAt: null,
                },
                update: {
                    plan: request.plan,
                    startDate: now,
                    endDate: null,
                    expiredAt: null,
                },
            });
            const gardener = await tx.user.findUnique({ where: { id: request.gardenerId } });
            const address = gardener ? [gardener.village, gardener.district, gardener.state, gardener.pincode].filter(Boolean).join(', ') : 'Registered Address';
            if (gardener?.role === 'GARDENER') {
                const giftOrderNumber = `GIFT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
                await tx.customerOrder.create({
                    data: {
                        customerId: request.gardenerId,
                        orderNumber: giftOrderNumber,
                        totalAmount: 0,
                        discountAmount: request.amount,
                        deliveryAddress: address,
                        paymentMode: client_1.OrderPaymentMode.ONLINE,
                        paymentStatus: 'PAID',
                        items: {
                            create: [
                                {
                                    productName: `Flower Seeds Gift Pack (${request.plan} Plan Offer)`,
                                    quantity: 1,
                                    price: request.amount,
                                    sellerStoreId: null,
                                    subtotal: request.amount,
                                }
                            ]
                        }
                    }
                });
            }
        });
    }
};
exports.CashfreeService = CashfreeService;
exports.CashfreeService = CashfreeService = CashfreeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], CashfreeService);
//# sourceMappingURL=cashfree.service.js.map