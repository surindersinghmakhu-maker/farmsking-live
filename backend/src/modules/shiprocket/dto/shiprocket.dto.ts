import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class CreateShiprocketOrderDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsString()
  orderDate: string;

  @IsNotEmpty()
  @IsString()
  pickupLocation: string; // Seller pickup address nickname on Shiprocket

  @IsNotEmpty()
  @IsString()
  billingCustomerName: string;

  @IsNotEmpty()
  @IsString()
  billingAddress: string;

  @IsNotEmpty()
  @IsString()
  billingCity: string;

  @IsNotEmpty()
  @IsString()
  billingPincode: string;

  @IsNotEmpty()
  @IsString()
  billingState: string;

  @IsNotEmpty()
  @IsString()
  billingCountry: string;

  @IsNotEmpty()
  @IsString()
  billingPhone: string;

  @IsNotEmpty()
  @IsArray()
  orderItems: {
    name: string;
    sku: string;
    units: number;
    sellingPrice: number;
    hsn?: string;
  }[];

  @IsNotEmpty()
  @IsNumber()
  weight: number; // in KG

  @IsOptional()
  @IsNumber()
  length?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;
}

export class GenerateAwbDto {
  @IsNotEmpty()
  @IsString()
  shipmentId: string;

  @IsOptional()
  @IsNumber()
  courierId?: number;
}
