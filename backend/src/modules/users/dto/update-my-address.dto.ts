import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, Matches } from 'class-validator';

/** Shared self-service profile fields — same for every role, since each mobile number has exactly one profile. */
export class UpdateMyAddressDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

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
  @IsBoolean()
  notificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappGroupEnabled?: boolean;

  /** Null clears the threshold (alert off); a number sets and enables it. */
  @IsOptional()
  @IsNumber()
  weatherAlertMinTempC?: number | null;

  @IsOptional()
  @IsNumber()
  weatherAlertMaxTempC?: number | null;

  @IsOptional()
  @IsBoolean()
  weatherAlertRainEnabled?: boolean;

  @IsOptional()
  @IsString()
  billPrintingAddress?: string;
}
