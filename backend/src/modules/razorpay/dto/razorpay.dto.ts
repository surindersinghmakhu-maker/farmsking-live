import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRazorpayOrderDto {
  @IsString()
  orderId: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  notes?: Record<string, any>;
}

export class CreateRazorpaySubscriptionDto {
  @IsString()
  planName: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  intervalType?: 'monthly' | 'yearly';

  @IsOptional()
  @IsNumber()
  totalCount?: number;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  notes?: Record<string, any>;
}

export class VerifyRazorpayPaymentDto {
  @IsString()
  razorpayOrderId: string;

  @IsString()
  razorpayPaymentId: string;

  @IsString()
  razorpaySignature: string;
}

