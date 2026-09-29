import { IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  sellingPrice?: number;

  @IsOptional()
  @IsNumber()
  mrp?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQty?: number;

  @IsOptional()
  @IsString()
  sellerStoreId?: string;

  @IsOptional()
  @IsString()
  hsnCode?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  gstPercentage?: number;

  @IsOptional()
  @IsNumber()
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  deadWeightKg?: number;

  @IsOptional()
  @IsNumber()
  lengthCm?: number;

  @IsOptional()
  @IsNumber()
  widthCm?: number;

  @IsOptional()
  @IsNumber()
  heightCm?: number;

  // Technical & Agri Details
  @IsOptional()
  @IsString()
  technicalName?: string;

  @IsOptional()
  @IsString()
  dosageInstructions?: string;

  @IsOptional()
  @IsString()
  suitableCrops?: string;

  @IsOptional()
  @IsString()
  targetPests?: string;

  @IsOptional()
  @IsString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  // 4 Mandatory Photo Angles
  @IsOptional()
  @IsString()
  imageFrontUrl?: string;

  @IsOptional()
  @IsString()
  imageBackLabelUrl?: string;

  @IsOptional()
  @IsString()
  imageDosageUrl?: string;

  @IsOptional()
  @IsString()
  imageProductUrl?: string;

  @IsOptional()
  @IsNumber()
  commissionOverridePercentage?: number;

  @IsOptional()
  @IsInt()
  bulkDiscountMinQty?: number;

  @IsOptional()
  @IsNumber()
  bulkDiscountPercentage?: number;
}

