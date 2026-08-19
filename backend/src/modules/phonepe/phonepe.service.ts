import { createHash } from 'crypto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PhonePeToken {
  accessToken: string;
  expiresAtMs: number;
}

interface CreatePaymentResult {
  orderId: string;
  state: string;
  redirectUrl: string;
}

interface OrderStatusResult {
  orderId: string;
  state: string;
  amount: number;
}

/**
 * PhonePe Standard Checkout v2 (server-to-server): OAuth client-credentials token (cached until
 * expiry), Create Payment, Order Status, and webhook auth verification.
 * Docs: https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration
 */
@Injectable()
export class PhonePeService {
  private readonly logger = new Logger(PhonePeService.name);
  private cachedToken: PhonePeToken | null = null;

  constructor(private readonly configService: ConfigService) {}

  private get isSandbox(): boolean {
    return this.configService.get<string>('PHONEPE_ENV', 'SANDBOX').toUpperCase() !== 'PRODUCTION';
  }

  private get authBaseUrl(): string {
    return this.isSandbox
      ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
      : 'https://api.phonepe.com/apis/identity-manager';
  }

  private get apiBaseUrl(): string {
    return this.isSandbox ? 'https://api-preprod.phonepe.com/apis/pg-sandbox' : 'https://api.phonepe.com/apis/pg';
  }

  isConfigured(): boolean {
    return !!(
      this.configService.get<string>('PHONEPE_CLIENT_ID') &&
      this.configService.get<string>('PHONEPE_CLIENT_SECRET') &&
      this.configService.get<string>('PHONEPE_CLIENT_VERSION')
    );
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAtMs > Date.now() + 30_000) {
      return this.cachedToken.accessToken;
    }

    const clientId = this.configService.get<string>('PHONEPE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PHONEPE_CLIENT_SECRET');
    const clientVersion = this.configService.get<string>('PHONEPE_CLIENT_VERSION');
    if (!clientId || !clientSecret || !clientVersion) {
      throw new BadRequestException('PhonePe payment gateway is not configured yet. Please contact support.');
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
      throw new BadRequestException('Could not connect to the payment gateway. Please try again.');
    }

    const data = (await res.json()) as { access_token: string; expires_at: number };
    this.cachedToken = { accessToken: data.access_token, expiresAtMs: data.expires_at * 1000 };
    return this.cachedToken.accessToken;
  }

  /** Creates a Standard Checkout payment session. `amountRupees` is converted to paisa for PhonePe. */
  async createPayment(merchantOrderId: string, amountRupees: number, redirectUrl: string): Promise<CreatePaymentResult> {
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
      throw new BadRequestException('Could not start the online payment. Please try again.');
    }

    const data = (await res.json()) as { orderId: string; state: string; redirectUrl: string };
    return { orderId: data.orderId, state: data.state, redirectUrl: data.redirectUrl };
  }

  async checkStatus(merchantOrderId: string): Promise<OrderStatusResult> {
    const accessToken = await this.getAccessToken();

    const res = await fetch(`${this.apiBaseUrl}/checkout/v2/order/${merchantOrderId}/status?details=false`, {
      method: 'GET',
      headers: { Authorization: `O-Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(`PhonePe status check failed: ${res.status} ${text}`);
      throw new BadRequestException('Could not check payment status. Please try again.');
    }

    const data = (await res.json()) as { orderId: string; state: string; amount: number };
    return { orderId: data.orderId, state: data.state, amount: data.amount };
  }

  /** Verifies the webhook's Authorization header against SHA256(username:password), per PhonePe's basic-auth webhook scheme. */
  verifyWebhookAuth(authorizationHeader: string | undefined): boolean {
    const username = this.configService.get<string>('PHONEPE_WEBHOOK_USERNAME');
    const password = this.configService.get<string>('PHONEPE_WEBHOOK_PASSWORD');
    if (!username || !password || !authorizationHeader) return false;

    const expected = createHash('sha256').update(`${username}:${password}`).digest('hex');
    return authorizationHeader === expected;
  }
}
