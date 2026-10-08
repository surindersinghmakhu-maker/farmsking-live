import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PhonePeService } from './phonepe.service';
interface PhonePeWebhookPayload {
    event: string;
    payload: {
        orderId: string;
        merchantOrderId: string;
        state: 'COMPLETED' | 'FAILED' | 'PENDING';
        amount: number;
    };
}
export declare class PhonePeWebhookController {
    private readonly prisma;
    private readonly phonePeService;
    private readonly notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, phonePeService: PhonePeService, notificationsService: NotificationsService);
    handleWebhook(authorization: string | undefined, body: PhonePeWebhookPayload): Promise<{
        status: string;
    }>;
}
export {};
