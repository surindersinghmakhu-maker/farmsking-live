import { IsIn, IsOptional, IsEnum, IsString, Matches } from 'class-validator';
import { SoilType, WaterType } from '@prisma/client';

const ALLOWED_TANK_SIZES = [15, 20, 25];

export class UpdateFarmerProfileDto {
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'PIN code must be exactly 6 digits.' })
  pincode?: string;

  @IsOptional()
  @IsString()
  postOffice?: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsIn(ALLOWED_TANK_SIZES)
  sprayTankSizeL?: number;

  @IsOptional()
  @IsEnum(SoilType)
  soilType?: SoilType;

  @IsOptional()
  @IsEnum(WaterType)
  waterType?: WaterType;

  @IsOptional()
  @IsString()
  upiId?: string;

  @IsOptional()
  @IsString()
  billPrintingAddress?: string;
}
