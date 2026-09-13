import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CouponsService } from '../coupons/coupons.service';
import { WalletService } from '../wallet/wallet.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { PhonePeService } from '../phonepe/phonepe.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateOrderDto } from './dto/create-order.dto';
import { DispatchOrderDto } from './dto/dispatch-order.dto';
export declare class OrdersService {
    private readonly prisma;
    private readonly notificationsService;
    private readonly couponsService;
    private readonly walletService;
    private readonly appSettingsService;
    private readonly phonePeService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, couponsService: CouponsService, walletService: WalletService, appSettingsService: AppSettingsService, phonePeService: PhonePeService);
    create(customer: AuthUser, dto: CreateOrderDto): Promise<{
        customer: {
            id: string;
            mobile: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string | null;
            } | null;
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            productName: string;
            orderId: string;
            productId: string | null;
        })[];
        packedBy: {
            id: string;
            name: string;
        } | null;
        dispatchedBy: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        couponId: string | null;
        cancelledAt: Date | null;
        paymentMode: import(".prisma/client").$Enums.OrderPaymentMode;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        orderNumber: string;
        deliveryAddress: string | null;
        orderDate: Date;
        deliveryDate: Date | null;
        packedById: string | null;
        packedAt: Date | null;
        dispatchedById: string | null;
        dispatchedAt: Date | null;
        courierName: string | null;
        trackingId: string | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal | null;
        paymentStatus: import(".prisma/client").$Enums.OrderPaymentStatus;
        phonepeMerchantOrderId: string | null;
        phonepePaymentState: string | null;
    }>;
    findMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        customer: {
            id: string;
            mobile: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string | null;
            } | null;
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            productName: string;
            orderId: string;
            productId: string | null;
        })[];
        packedBy: {
            id: string;
            name: string;
        } | null;
        dispatchedBy: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        couponId: string | null;
        cancelledAt: Date | null;
        paymentMode: import(".prisma/client").$Enums.OrderPaymentMode;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        orderNumber: string;
        deliveryAddress: string | null;
        orderDate: Date;
        deliveryDate: Date | null;
        packedById: string | null;
        packedAt: Date | null;
        dispatchedById: string | null;
        dispatchedAt: Date | null;
        courierName: string | null;
        trackingId: string | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal | null;
        paymentStatus: import(".prisma/client").$Enums.OrderPaymentStatus;
        phonepeMerchantOrderId: string | null;
        phonepePaymentState: string | null;
    })[]>;
    findAll(status?: OrderStatus): import(".prisma/client").Prisma.PrismaPromise<({
        customer: {
            id: string;
            mobile: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string | null;
            } | null;
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            productName: string;
            orderId: string;
            productId: string | null;
        })[];
        packedBy: {
            id: string;
            name: string;
        } | null;
        dispatchedBy: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        couponId: string | null;
        cancelledAt: Date | null;
        paymentMode: import(".prisma/client").$Enums.OrderPaymentMode;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        orderNumber: string;
        deliveryAddress: string | null;
        orderDate: Date;
        deliveryDate: Date | null;
        packedById: string | null;
        packedAt: Date | null;
        dispatchedById: string | null;
        dispatchedAt: Date | null;
        courierName: string | null;
        trackingId: string | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal | null;
        paymentStatus: import(".prisma/client").$Enums.OrderPaymentStatus;
        phonepeMerchantOrderId: string | null;
        phonepePaymentState: string | null;
    })[]>;
    findFulfillmentQueue(): import(".prisma/client").Prisma.PrismaPromise<({
        customer: {
            id: string;
            mobile: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string | null;
            } | null;
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            productName: string;
            orderId: string;
            productId: string | null;
        })[];
        packedBy: {
            id: string;
            name: string;
        } | null;
        dispatchedBy: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        couponId: string | null;
        cancelledAt: Date | null;
        paymentMode: import(".prisma/client").$Enums.OrderPaymentMode;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        orderNumber: string;
        deliveryAddress: string | null;
        orderDate: Date;
        deliveryDate: Date | null;
        packedById: string | null;
        packedAt: Date | null;
        dispatchedById: string | null;
        dispatchedAt: Date | null;
        courierName: string | null;
        trackingId: string | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal | null;
        paymentStatus: import(".prisma/client").$Enums.OrderPaymentStatus;
        phonepeMerchantOrderId: string | null;
        phonepePaymentState: string | null;
    })[]>;
    findOneOrThrow(user: AuthUser, id: string): Promise<{
        customer: {
            id: string;
            mobile: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string | null;
            } | null;
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            productName: string;
            orderId: string;
            productId: string | null;
        })[];
        packedBy: {
            id: string;
            name: string;
        } | null;
        dispatchedBy: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        couponId: string | null;
        cancelledAt: Date | null;
        paymentMode: import(".prisma/client").$Enums.OrderPaymentMode;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        orderNumber: string;
        deliveryAddress: string | null;
        orderDate: Date;
        deliveryDate: Date | null;
        packedById: string | null;
        packedAt: Date | null;
        dispatchedById: string | null;
        dispatchedAt: Date | null;
        courierName: string | null;
        trackingId: string | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal | null;
        paymentStatus: import(".prisma/client").$Enums.OrderPaymentStatus;
        phonepeMerchantOrderId: string | null;
        phonepePaymentState: string | null;
    }>;
    getUpiLink(user: AuthUser, id: string): Promise<{
        upiLink: string;
        amount: number;
        orderNumber: string;
    }>;
    initiatePhonePePayment(user: AuthUser, id: string, redirectUrl: string): Promise<{
        redirectUrl: string;
        merchantOrderId: string;
    }>;
    getPhonePePaymentStatus(user: AuthUser, id: string): Promise<{
        paymentStatus: string;
    }>;
    private notifyCustomer;
    confirm(user: AuthUser, id: string): Promise<{
        customer: {
            id: string;
            mobile: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string | null;
            } | null;
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            productName: string;
            orderId: string;
            productId: string | null;
        })[];
        packedBy: {
            id: string;
            name: string;
        } | null;
        dispatchedBy: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        couponId: string | null;
        cancelledAt: Date | null;
        paymentMode: import(".prisma/client").$Enums.OrderPaymentMode;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        orderNumber: string;
        deliveryAddress: string | null;
        orderDate: Date;
        deliveryDate: Date | null;
        packedById: string | null;
        packedAt: Date | null;
        dispatchedById: string | null;
        dispatchedAt: Date | null;
        courierName: string | null;
        trackingId: string | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal | null;
        paymentStatus: import(".prisma/client").$Enums.OrderPaymentStatus;
        phonepeMerchantOrderId: string | null;
        phonepePaymentState: string | null;
    }>;
    private creditCouponCommission;
    cancel(user: AuthUser, id: string): Promise<{
        customer: {
            id: string;
            mobile: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string | null;
            } | null;
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            productName: string;
            orderId: string;
            productId: string | null;
        })[];
        packedBy: {
            id: string;
            name: string;
        } | null;
        dispatchedBy: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        couponId: string | null;
        cancelledAt: Date | null;
        paymentMode: import(".prisma/client").$Enums.OrderPaymentMode;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        orderNumber: string;
        deliveryAddress: string | null;
        orderDate: Date;
        deliveryDate: Date | null;
        packedById: string | null;
        packedAt: Date | null;
        dispatchedById: string | null;
        dispatchedAt: Date | null;
        courierName: string | null;
        trackingId: string | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal | null;
        paymentStatus: import(".prisma/client").$Enums.OrderPaymentStatus;
        phonepeMerchantOrderId: string | null;
        phonepePaymentState: string | null;
    }>;
    startPacking(operator: AuthUser, id: string): Promise<{
        customer: {
            id: string;
            mobile: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string | null;
            } | null;
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            productName: string;
            orderId: string;
            productId: string | null;
        })[];
        packedBy: {
            id: string;
            name: string;
        } | null;
        dispatchedBy: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        couponId: string | null;
        cancelledAt: Date | null;
        paymentMode: import(".prisma/client").$Enums.OrderPaymentMode;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        orderNumber: string;
        deliveryAddress: string | null;
        orderDate: Date;
        deliveryDate: Date | null;
        packedById: string | null;
        packedAt: Date | null;
        dispatchedById: string | null;
        dispatchedAt: Date | null;
        courierName: string | null;
        trackingId: string | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal | null;
        paymentStatus: import(".prisma/client").$Enums.OrderPaymentStatus;
        phonepeMerchantOrderId: string | null;
        phonepePaymentState: string | null;
    }>;
    markPacked(operator: AuthUser, id: string): Promise<{
        customer: {
            id: string;
            mobile: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string | null;
            } | null;
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            productName: string;
            orderId: string;
            productId: string | null;
        })[];
        packedBy: {
            id: string;
            name: string;
        } | null;
        dispatchedBy: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        couponId: string | null;
        cancelledAt: Date | null;
        paymentMode: import(".prisma/client").$Enums.OrderPaymentMode;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        orderNumber: string;
        deliveryAddress: string | null;
        orderDate: Date;
        deliveryDate: Date | null;
        packedById: string | null;
        packedAt: Date | null;
        dispatchedById: string | null;
        dispatchedAt: Date | null;
        courierName: string | null;
        trackingId: string | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal | null;
        paymentStatus: import(".prisma/client").$Enums.OrderPaymentStatus;
        phonepeMerchantOrderId: string | null;
        phonepePaymentState: string | null;
    }>;
    dispatch(operator: AuthUser, id: string, dto: DispatchOrderDto): Promise<{
        customer: {
            id: string;
            mobile: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string | null;
            } | null;
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            productName: string;
            orderId: string;
            productId: string | null;
        })[];
        packedBy: {
            id: string;
            name: string;
        } | null;
        dispatchedBy: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        couponId: string | null;
        cancelledAt: Date | null;
        paymentMode: import(".prisma/client").$Enums.OrderPaymentMode;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        orderNumber: string;
        deliveryAddress: string | null;
        orderDate: Date;
        deliveryDate: Date | null;
        packedById: string | null;
        packedAt: Date | null;
        dispatchedById: string | null;
        dispatchedAt: Date | null;
        courierName: string | null;
        trackingId: string | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal | null;
        paymentStatus: import(".prisma/client").$Enums.OrderPaymentStatus;
        phonepeMerchantOrderId: string | null;
        phonepePaymentState: string | null;
    }>;
    markDelivered(user: AuthUser, id: string): Promise<{
        customer: {
            id: string;
            mobile: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string | null;
            } | null;
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            productName: string;
            orderId: string;
            productId: string | null;
        })[];
        packedBy: {
            id: string;
            name: string;
        } | null;
        dispatchedBy: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        couponId: string | null;
        cancelledAt: Date | null;
        paymentMode: import(".prisma/client").$Enums.OrderPaymentMode;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        orderNumber: string;
        deliveryAddress: string | null;
        orderDate: Date;
        deliveryDate: Date | null;
        packedById: string | null;
        packedAt: Date | null;
        dispatchedById: string | null;
        dispatchedAt: Date | null;
        courierName: string | null;
        trackingId: string | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal | null;
        paymentStatus: import(".prisma/client").$Enums.OrderPaymentStatus;
        phonepeMerchantOrderId: string | null;
        phonepePaymentState: string | null;
    }>;
}
