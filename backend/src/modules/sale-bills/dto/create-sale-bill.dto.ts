import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class SaleBillItemDto {
  @IsOptional()
  @IsString()
  id?: string = undefined;

  @IsOptional()
  @IsString()
  cropId?: string = undefined;

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

  @IsOptional()
  @IsString()
  createdAt?: string = undefined;

  @IsOptional()
  @IsString()
  timestamp?: string = undefined;
}

export class CreateSaleBillDto {
  @IsOptional()
  @IsString()
  billNo?: string = undefined;

  @IsString()
  farmerName: string = '';

  @IsOptional()
  @IsString()
  partyId?: string = undefined;

  @IsString()
  partyName: string = '';

  @IsOptional()
  @IsString()
  partyMobile?: string = undefined;

  @IsOptional()
  @IsString()
  partyAddress?: string = undefined;

  @IsOptional()
  @IsBoolean()
  isCash?: boolean = true;

  @IsOptional()
  @IsString()
  amountReceivedMode?: string = 'CASH';

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

  @IsOptional()
  @IsNumber()
  discountAmount?: number = 0;

  @IsOptional()
  @IsNumber()
  deliveryCharge?: number = 0;

  @IsOptional()
  @IsString()
  notes?: string = undefined;

  @IsOptional()
  @IsString()
  createdAt?: string = undefined;
}
