import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

export class CreateCashfreeVendorDto {
  @IsNotEmpty()
  @IsString()
  vendorId: string; // e.g. seller_store_id

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  bankAccountNo?: string;

  @IsOptional()
  @IsString()
  bankIfsc?: string;

  @IsOptional()
  @IsString()
  bankAccountHolderName?: string;

  @IsOptional()
  @IsString()
  upiId?: string;

  @IsOptional()
  @IsString()
  gstin?: string;
}

export class CreateSplitOrderDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  amount: number;

  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsNotEmpty()
  @IsString()
  customerPhone: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsNotEmpty()
  splits: {
    sellerStoreId: string;
    cashfreeVendorId: string;
    itemSubtotal: number;
    commissionRate: number; // e.g. 5.0 for 5%
  }[];
}
