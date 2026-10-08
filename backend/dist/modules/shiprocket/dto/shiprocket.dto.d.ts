export declare class CreateShiprocketOrderDto {
    orderId: string;
    orderDate: string;
    pickupLocation: string;
    billingCustomerName: string;
    billingAddress: string;
    billingCity: string;
    billingPincode: string;
    billingState: string;
    billingCountry: string;
    billingPhone: string;
    orderItems: {
        name: string;
        sku: string;
        units: number;
        sellingPrice: number;
        hsn?: string;
    }[];
    weight: number;
    length?: number;
    width?: number;
    height?: number;
}
export declare class GenerateAwbDto {
    shipmentId: string;
    courierId?: number;
}
