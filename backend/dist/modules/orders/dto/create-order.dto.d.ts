import { OrderPaymentMode } from '@prisma/client';
export declare class OrderItemInputDto {
    productId: string;
    quantity: number;
}
export declare class CreateOrderDto {
    items: OrderItemInputDto[];
    deliveryAddress?: string;
    couponCode?: string;
    paymentMode?: OrderPaymentMode;
}
