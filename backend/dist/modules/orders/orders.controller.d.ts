import { OrderStatus } from '@prisma/client';
import type { AuthUser } from '../../common/types/auth-user.type';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { DispatchOrderDto } from './dto/dispatch-order.dto';
import { InitiatePhonePePaymentDto } from './dto/initiate-phonepe-payment.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(user: AuthUser, dto: CreateOrderDto): Promise<{
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
    findOne(user: AuthUser, id: string): Promise<{
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
    initiatePhonePePayment(user: AuthUser, id: string, dto: InitiatePhonePePaymentDto): Promise<{
        redirectUrl: string;
        merchantOrderId: string;
    }>;
    getPhonePePaymentStatus(user: AuthUser, id: string): Promise<{
        paymentStatus: string;
    }>;
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
    startPacking(user: AuthUser, id: string): Promise<{
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
    markPacked(user: AuthUser, id: string): Promise<{
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
    dispatch(user: AuthUser, id: string, dto: DispatchOrderDto): Promise<{
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
