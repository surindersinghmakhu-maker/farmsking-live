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
var PhonePeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhonePeService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let PhonePeService = PhonePeService_1 = class PhonePeService {
    configService;
    logger = new common_1.Logger(PhonePeService_1.name);
    cachedToken = null;
    constructor(configService) {
        this.configService = configService;
    }
    get isSandbox() {
        return this.configService.get('PHONEPE_ENV', 'SANDBOX').toUpperCase() !== 'PRODUCTION';
    }
    get authBaseUrl() {
        return this.isSandbox
            ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
            : 'https://api.phonepe.com/apis/identity-manager';
    }
    get apiBaseUrl() {
        return this.isSandbox ? 'https://api-preprod.phonepe.com/apis/pg-sandbox' : 'https://api.phonepe.com/apis/pg';
    }
    isConfigured() {
        return !!(this.configService.get('PHONEPE_CLIENT_ID') &&
            this.configService.get('PHONEPE_CLIENT_SECRET') &&
            this.configService.get('PHONEPE_CLIENT_VERSION'));
    }
    async getAccessToken() {
        if (this.cachedToken && this.cachedToken.expiresAtMs > Date.now() + 30_000) {
            return this.cachedToken.accessToken;
        }
        const clientId = this.configService.get('PHONEPE_CLIENT_ID');
        const clientSecret = this.configService.get('PHONEPE_CLIENT_SECRET');
        const clientVersion = this.configService.get('PHONEPE_CLIENT_VERSION');
        if (!clientId || !clientSecret || !clientVersion) {
            throw new common_1.BadRequestException('PhonePe payment gateway is not configured yet. Please contact support.');
        }
        const body = new URLSearchParams({
            client_id: clientId,
            client_version: clientVersion,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
        });
        const res = await fetch(`${this.authBaseUrl}/v1/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            this.logger.error(`PhonePe token request failed: ${res.status} ${text}`);
            throw new common_1.BadRequestException('Could not connect to the payment gateway. Please try again.');
        }
        const data = (await res.json());
        this.cachedToken = { accessToken: data.access_token, expiresAtMs: data.expires_at * 1000 };
        return this.cachedToken.accessToken;
    }
    async createPayment(merchantOrderId, amountRupees, redirectUrl) {
        const accessToken = await this.getAccessToken();
        const res = await fetch(`${this.apiBaseUrl}/checkout/v2/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `O-Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                merchantOrderId,
                amount: Math.round(amountRupees * 100),
                expireAfter: 1200,
                paymentFlow: {
                    type: 'PG_CHECKOUT',
                    merchantUrls: { redirectUrl },
                },
            }),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            this.logger.error(`PhonePe create-payment failed: ${res.status} ${text}`);
            throw new common_1.BadRequestException('Could not start the online payment. Please try again.');
        }
        const data = (await res.json());
        return { orderId: data.orderId, state: data.state, redirectUrl: data.redirectUrl };
    }
    async checkStatus(merchantOrderId) {
        const accessToken = await this.getAccessToken();
        const res = await fetch(`${this.apiBaseUrl}/checkout/v2/order/${merchantOrderId}/status?details=false`, {
            method: 'GET',
            headers: { Authorization: `O-Bearer ${accessToken}` },
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            this.logger.error(`PhonePe status check failed: ${res.status} ${text}`);
            throw new common_1.BadRequestException('Could not check payment status. Please try again.');
        }
        const data = (await res.json());
        return { orderId: data.orderId, state: data.state, amount: data.amount };
    }
    verifyWebhookAuth(authorizationHeader) {
        const username = this.configService.get('PHONEPE_WEBHOOK_USERNAME');
        const password = this.configService.get('PHONEPE_WEBHOOK_PASSWORD');
        if (!username || !password || !authorizationHeader)
            return false;
        const expected = (0, crypto_1.createHash)('sha256').update(`${username}:${password}`).digest('hex');
        return authorizationHeader === expected;
    }
};
exports.PhonePeService = PhonePeService;
exports.PhonePeService = PhonePeService = PhonePeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PhonePeService);
//# sourceMappingURL=phonepe.service.js.map