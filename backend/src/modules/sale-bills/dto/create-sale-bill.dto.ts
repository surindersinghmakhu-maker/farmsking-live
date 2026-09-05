import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class SaleBillItemDto {
  @IsString()
  cropId: string;

  @IsString()
  cropName: string;

  @IsString()
  unit: string;

  @IsNumber()
  qty: number;

  @IsNumber()
  rate: number;

  @IsNumber()
  amount: number;
}

export class CreateSaleBillDto {
  @IsString()
  farmerName: string;

  @IsOptional()
  @IsString()
  partyId?: string;

  @IsString()
  partyName: string;

  @IsOptional()
  @IsString()
  partyMobile?: string;

  @IsOptional()
  @IsString()
  partyAddress?: string;

  @IsBoolean()
  isCash: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleBillItemDto)
  items: SaleBillItemDto[];

  @IsNumber()
  @Min(0)
  totalItems: number;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsNumber()
  @Min(0)
  amountReceived: number;

  @IsNumber()
  thisSaleBalance: number;

  @IsNumber()
  previousBalance: number;

  @IsNumber()
  netReceivable: number;
}
