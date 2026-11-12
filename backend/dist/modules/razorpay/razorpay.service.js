"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RazorpayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const app_settings_service_1 = require("../app-settings/app-settings.service");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
let RazorpayService = RazorpayService_1 = class RazorpayService {
    constructor(configService, prisma, appSettingsService) {
        this.configService = configService;
        this.prisma = prisma;
        this.appSettingsService = appSettingsService;
        this.logger = new common_1.Logger(RazorpayService_1.name);
        this.keyId = this.configService.get('RAZORPAY_KEY_ID') || '';
        this.keySecret = this.configService.get('RAZORPAY_KEY_SECRET') || '';
        this.webhookSecret = this.configService.get('RAZORPAY_WEBHOOK_SECRET') || '';
    }
    async getCredentials() {
        try {
            const integrations = await this.appSettingsService.getIntegrations();
            const rzpConfig = integrations?.gateway?.providers?.razorpay;
            if (rzpConfig?.keyId && rzpConfig?.keySecret) {
                return {
                    keyId: rzpConfig.keyId,
                    keySecret: rzpConfig.keySecret,
                    webhookSecret: rzpConfig.webhookSecret || this.webhookSecret,
                };
            }
        }
        catch {
        }
        return {
            keyId: this.keyId,
            keySecret: this.keySecret,
            webhookSecret: this.webhookSecret,
        };
    }
    async getBasicAuthHeader() {
        const creds = await this.getCredentials();
        if (!creds.keyId || !creds.keySecret) {
            throw new common_1.BadRequestException('Razorpay credentials are not configured. Please contact support.');
        }
        return 'Basic ' + Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64');
    }
    async createStandardOrder(dto) {
        const creds = await this.getCredentials();
        const authHeader = await this.getBasicAuthHeader();
        const payload = {
            amount: Math.round(dto.amount * 100),
            currency: 'INR',
            receipt: dto.orderId,
            notes: {
                orderId: dto.orderId,
                customerId: dto.customerId || '',
                customerPhone: dto.customerPhone || '',
                ...(dto.notes || {}),
            },
        };
        try {
            const res = await fetch('https://api.razorpay.com/v1/orders', {
                method: 'POST',
                headers: {
                    Authorization: authHeader,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                this.logger.error(`Razorpay order creation failed: ${JSON.stringify(data)}`);
                throw new common_1.BadRequestException(data.error?.description || 'Failed to initialize Razorpay payment');
            }
            return {
                orderId: dto.orderId,
                razorpayOrderId: data.id,
                amount: dto.amount,
                currency: 'INR',
                keyId: creds.keyId,
            };
        }
        catch (err) {
            this.logger.error('Error creating Razorpay order', err);
            throw new common_1.BadRequestException(err.message || 'Razorpay initialization failed');
        }
    }
    async createSubscription(dto) {
        const creds = await this.getCredentials();
        const authHeader = await this.getBasicAuthHeader();
        try {
            const planPayload = {
                period: dto.intervalType || 'monthly',
                interval: 1,
                item: {
                    name: dto.planName,
                    amount: Math.round(dto.amount * 100),
                    currency: 'INR',
                    description: `FarmsKing ${dto.planName} Recurring UPI AutoPay`,
                },
                notes: {
                    customerId: dto.customerId || '',
                    customerPhone: dto.customerPhone || '',
                },
            };
            const planRes = await fetch('https://api.razorpay.com/v1/plans', {
                method: 'POST',
                headers: {
                    Authorization: authHeader,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(planPayload),
            });
            const planData = await planRes.json();
            if (!planRes.ok) {
                this.logger.error(`Razorpay plan creation failed: ${JSON.stringify(planData)}`);
                throw new common_1.BadRequestException(planData.error?.description || 'Failed to create subscription plan on Razorpay');
            }
            const subPayload = {
                plan_id: planData.id,
                total_count: dto.totalCount || 12,
                quantity: 1,
                customer_notify: 1,
                notes: {
                    customerId: dto.customerId || '',
                    customerPhone: dto.customerPhone || '',
                    customerName: dto.customerName || '',
                    ...(dto.notes || {}),
                },
            };
            const subRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
                method: 'POST',
                headers: {
                    Authorization: authHeader,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subPayload),
            });
            const subData = await subRes.json();
            if (!subRes.ok) {
                this.logger.error(`Razorpay subscription creation failed: ${JSON.stringify(subData)}`);
                throw new common_1.BadRequestException(subData.error?.description || 'Failed to initialize Razorpay subscription');
            }
            return {
                subscriptionId: subData.id,
                planId: planData.id,
                shortUrl: subData.short_url,
                status: subData.status,
                amount: dto.amount,
                keyId: creds.keyId,
            };
        }
        catch (err) {
            this.logger.error('Error creating Razorpay subscription', err);
            throw new common_1.BadRequestException(err.message || 'Razorpay subscription creation failed');
        }
    }
    async verifyPayment(dto) {
        const creds = await this.getCredentials();
        if (!creds.keySecret) {
            throw new common_1.UnauthorizedException('Razorpay verification secret is not configured.');
        }
        const body = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', creds.keySecret)
            .update(body)
            .digest('hex');
        const expectedBuf = Buffer.from(expectedSignature, 'utf8');
        const actualBuf = Buffer.from(dto.razorpaySignature || '', 'utf8');
        if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
            throw new common_1.BadRequestException('Invalid Razorpay payment signature');
        }
        return {
            success: true,
            message: 'Payment signature verified successfully',
        };
    }
    verifyWebhookSignature(rawBody, signature, secret) {
        if (!signature || !secret)
            return false;
        try {
            const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
            return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
        }
        catch {
            return false;
        }
    }
    async handleWebhook(rawBody, signatureHeader) {
        const creds = await this.getCredentials();
        const webhookSecret = creds.webhookSecret?.trim();
        if (!webhookSecret || webhookSecret === 'rzp_webhook_secret' || !signatureHeader) {
            throw new common_1.UnauthorizedException('Razorpay webhook signature or secret verification failed.');
        }
        const isValid = this.verifyWebhookSignature(rawBody, signatureHeader, webhookSecret);
        if (!isValid) {
            this.logger.warn('Razorpay webhook signature verification failed');
            throw new common_1.UnauthorizedException('Invalid Razorpay webhook signature.');
        }
        let payload;
        try {
            payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
        }
        catch {
            payload = rawBody;
        }
        const event = payload?.event;
        this.logger.log(`Received Razorpay webhook event: ${event}`);
        if (event === 'payment.captured' || event === 'order.paid') {
            const paymentEntity = payload?.payload?.payment?.entity || payload?.payload?.order?.entity;
            const receipt = paymentEntity?.receipt || paymentEntity?.notes?.orderId;
            if (receipt) {
                await this.handleFulfillment(receipt, paymentEntity);
            }
        }
        if (event === 'subscription.charged') {
            const subEntity = payload?.payload?.subscription?.entity;
            const paymentEntity = payload?.payload?.payment?.entity;
            const receipt = subEntity?.notes?.orderId || paymentEntity?.notes?.orderId;
            if (receipt) {
                await this.handleFulfillment(receipt, paymentEntity, true);
            }
        }
        return { status: 'OK', event };
    }
    async handleFulfillment(orderId, paymentData, isRecurringCharge = false) {
        if (orderId.startsWith('PLAN-')) {
            await this.handlePlanPaymentSuccess(orderId, paymentData, isRecurringCharge);
        }
        else if (orderId.startsWith('GCARD-')) {
            await this.handleGardenerPlanPaymentSuccess(orderId);
        }
    }
    async handlePlanPaymentSuccess(orderId, paymentData, isRecurring) {
        const requestId = orderId.replace('PLAN-', '');
        const request = await this.prisma.farmerPlanPaymentRequest.findUnique({
            where: { id: requestId },
            include: {
                farmer: true,
            },
        });
        if (!request) {
            this.logger.warn(`FarmerPlanPaymentRequest ${requestId} not found for Razorpay fulfillment`);
            return;
        }
        if (request.status === client_1.PlanPaymentStatus.CONFIRMED) {
            return;
        }
        const claimed = await this.prisma.farmerPlanPaymentRequest.updateMany({
            where: { id: requestId, status: { not: client_1.PlanPaymentStatus.CONFIRMED } },
            data: {
                status: client_1.PlanPaymentStatus.CONFIRMED,
                utr: paymentData?.id ? `RZP-${paymentData.id}` : (isRecurring ? 'RZP-AUTOPAY' : 'RZP-PAID'),
                submittedAt: new Date(),
                confirmedAt: new Date(),
            },
        });
        if (claimed.count === 0) {
            return;
        }
        const prefix = request.targetPlan === client_1.FarmerSubscriptionPlan.PRO ? 'FB' : request.targetPlan === client_1.FarmerSubscriptionPlan.SMART ? 'FP' : 'FS';
        const code = `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
        const isAdvisorPlan = request.targetPlan === client_1.FarmerSubscriptionPlan.SMART ||
            request.targetPlan === client_1.FarmerSubscriptionPlan.SUPER ||
            request.targetPlan === client_1.FarmerSubscriptionPlan.GOLD ||
            request.targetPlan === client_1.FarmerSubscriptionPlan.ROYAL;
        await this.prisma.farmerPlanCoupon.create({
            data: {
                code,
                category: isAdvisorPlan ? client_1.PlanCouponCategory.DOCTOR_CONSULTATION : client_1.PlanCouponCategory.FARMER_PLAN,
                plan: request.targetPlan,
                daysGranted: request.daysGranted,
                assignedFarmerId: request.farmerId,
                assignedAdvisorId: request.selectedAdvisorId ?? undefined,
                doctorKingId: request.doctorKingId ?? null,
                advisorKingId: request.advisorKingId ?? null,
                createdById: request.selectedDoctorId ?? request.farmerId,
                createdByRole: 'SYSTEM',
                isUsed: true,
                usedAt: new Date(),
                usedByFarmerId: request.farmerId,
                generationCostAmount: request.amount,
            },
        });
        await this.prisma.notification.create({
            data: {
                userId: request.farmerId,
                type: client_1.NotificationType.SYSTEM,
                title: isRecurring ? '🔄 Auto-Debit Successful' : '✅ VIP Plan Activated',
                body: isRecurring
                    ? `Your recurring subscription of ₹${request.amount} was debited successfully via UPI AutoPay. Plan renewed for ${request.daysGranted} days.`
                    : `Payment of ₹${request.amount} verified via Razorpay. Your ${request.targetPlan} plan is active!`,
                data: { farmerPlanPaymentRequestId: requestId, couponCode: code },
            },
        });
        this.logger.log(`Successfully confirmed Razorpay plan payment ${requestId} for farmer ${request.farmer.name}`);
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
        });
    }
};
exports.RazorpayService = RazorpayService;
exports.RazorpayService = RazorpayService = RazorpayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        app_settings_service_1.AppSettingsService])
], RazorpayService);
//# sourceMappingURL=razorpay.service.js.map