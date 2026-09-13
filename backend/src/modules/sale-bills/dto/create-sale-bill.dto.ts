import { Type } from 'class-transformer';
import { Allow, ArrayMinSize, IsArray, IsBoolean, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class SaleBillItemDto {
  @Allow()
  @IsOptional()
  @IsString()
  id?: string;

  @Allow()
  @IsOptional()
  @IsString()
  cropId?: string;

  @IsString()
  cropName: string = '';

  @IsString()
  unit: string = '';

  @IsNumber()
  qty: number = 0;

  @IsNumber()
  rate: number = 0;

  @IsNumber()
  amount: number = 0;

  @Allow()
  @IsOptional()
  @IsString()
  createdAt?: string;

  @Allow()
  @IsOptional()
  @IsString()
  timestamp?: string;
}

export class CreateSaleBillDto {
  @Allow()
  @IsOptional()
  @IsString()
  billNo?: string;

  @IsString()
  farmerName: string = '';

  @Allow()
  @IsOptional()
  @IsString()
  partyId?: string;

  @IsString()
  partyName: string = '';

  @Allow()
  @IsOptional()
  @IsString()
  partyMobile?: string;

  @Allow()
  @IsOptional()
  @IsString()
  partyAddress?: string;

  @Allow()
  @IsOptional()
  @IsBoolean()
  isCash?: boolean;

  @Allow()
  @IsOptional()
  @IsString()
  amountReceivedMode?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleBillItemDto)
  items: SaleBillItemDto[] = [];

  @IsNumber()
  @Min(0)
  totalItems: number = 0;

  @IsNumber()
  @Min(0)
  totalAmount: number = 0;

  @IsNumber()
  @Min(0)
  amountReceived: number = 0;

  @IsNumber()
  thisSaleBalance: number = 0;

  @IsNumber()
  previousBalance: number = 0;

  @IsNumber()
  netReceivable: number = 0;

  @Allow()
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @Allow()
  @IsOptional()
  @IsNumber()
  deliveryCharge?: number;

  @Allow()
  @IsOptional()
  @IsString()
  notes?: string;

  @Allow()
  @IsOptional()
  @IsString()
  createdAt?: string;
}
