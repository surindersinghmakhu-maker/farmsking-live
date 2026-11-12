import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

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
  @Min(0)
  sellingPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
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
  @IsString()
  skuCode?: string;

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
  @Min(0)
  @Max(100)
  commissionOverridePercentage?: number;

  @IsOptional()
  @IsBoolean()
  isCodAllowed?: boolean;

  // Return & Replacement Policy Fields
  @IsOptional()
  isReturnable?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  returnWindowDays?: number;

  @IsOptional()
  isReplaceable?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  replacementWindowDays?: number;

  @IsOptional()
  @IsString()
  returnPolicyNotes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  bulkDiscountMinQty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bulkDiscountPercentage?: number;
}

