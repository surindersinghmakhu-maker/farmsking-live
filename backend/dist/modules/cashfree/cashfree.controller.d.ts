import type { AuthUser } from '../../common/types/auth-user.type';
import { CashfreeService } from './cashfree.service';
import { CreateCashfreeVendorDto, CreateSplitOrderDto } from './dto/cashfree.dto';
export declare class CashfreeController {
    private readonly cashfreeService;
    constructor(cashfreeService: CashfreeService);
    createVendor(dto: CreateCashfreeVendorDto): Promise<any>;
    createSplitOrder(dto: CreateSplitOrderDto): Promise<{
        orderId: any;
        paymentSessionId: any;
        orderStatus: any;
    }>;
    createOrder(user: AuthUser, dto: {
        orderId: string;
        amount: number;
        purpose?: string;
        customerName?: string;
        customerPhone?: string;
    }): Promise<{
        orderId: any;
        paymentSessionId: any;
        orderStatus: any;
    }>;
    verifyPayment(orderId: string): Promise<any>;
    handleWebhook(body: any): Promise<{
        status: string;
    }>;
}
