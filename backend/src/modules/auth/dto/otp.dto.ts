import { IsIn, IsNotEmpty, IsString, IsOptional, IsEmail, Matches, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendLoginOtpDto {
  @ApiProperty({ description: '10-digit mobile number' })
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @ApiPropertyOptional({ description: 'Login portal side: CLIENT, PARTNER, or ADMIN', enum: ['CLIENT', 'PARTNER', 'ADMIN'] })
  @IsOptional()
  @IsIn(['CLIENT', 'PARTNER', 'ADMIN'])
  portal?: 'CLIENT' | 'PARTNER' | 'ADMIN';

  @ApiPropertyOptional({ description: 'Terms of service accepted' })
  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;
}

export class VerifyLoginOtpDto {
  @ApiProperty({ description: '10-digit mobile number' })
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @ApiProperty({ description: '6-digit OTP code' })
  @IsNotEmpty()
  @IsString()
  otp: string;

  @ApiPropertyOptional({ description: 'Login portal side: CLIENT, PARTNER, or ADMIN', enum: ['CLIENT', 'PARTNER', 'ADMIN'] })
  @IsOptional()
  @IsIn(['CLIENT', 'PARTNER', 'ADMIN'])
  portal?: 'CLIENT' | 'PARTNER' | 'ADMIN';

  @ApiPropertyOptional({ description: 'Terms of service accepted' })
  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;
}

export class SendWhatsAppOtpDto {
  @ApiProperty({ description: '10-digit mobile number' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?\d{10,15}$/, { message: 'Valid mobile number is required.' })
  mobile: string;

  @ApiProperty({ description: 'OTP code' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'OTP must be 4 to 6 digits.' })
  otp: string;
}

export class SendEmailOtpDto {
  @ApiProperty({ description: 'Email address' })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Valid email address is required.' })
  email: string;

  @ApiProperty({ description: 'OTP code' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'OTP must be 4 to 6 digits.' })
  otp: string;
}

export class SendMobileLinkOtpDto {
  @ApiProperty({ description: '10-digit mobile number' })
  @IsNotEmpty()
  @IsString()
  mobile: string;
}

export class VerifyMobileLinkOtpDto {
  @ApiProperty({ description: '10-digit mobile number' })
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @ApiProperty({ description: '6-digit OTP code' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits.' })
  otp: string;

  @ApiPropertyOptional({ description: 'Optional account password' })
  @IsOptional()
  @IsString()
  password?: string;
}

export class FirebaseMobileLinkDto {
  @ApiProperty({ description: 'Firebase Phone Auth ID token' })
  @IsNotEmpty()
  @IsString()
  idToken: string;

  @ApiPropertyOptional({ description: 'Optional account password' })
  @IsOptional()
  @IsString()
  password?: string;
}

export class CompleteOtpRegistrationDto {
  @ApiProperty({ description: '10-digit mobile number' })
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @ApiPropertyOptional({ description: 'User full name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Selected role: CUSTOMER, FARMER, or GARDENER', enum: ['CUSTOMER', 'FARMER', 'GARDENER'] })
  @IsNotEmpty()
  @IsString()
  role: 'CUSTOMER' | 'FARMER' | 'GARDENER';

  @ApiPropertyOptional({ description: 'Login portal side: CLIENT, PARTNER, or ADMIN', enum: ['CLIENT', 'PARTNER', 'ADMIN'] })
  @IsOptional()
  @IsIn(['CLIENT', 'PARTNER', 'ADMIN'])
  portal?: 'CLIENT' | 'PARTNER' | 'ADMIN';

  @ApiPropertyOptional({ description: 'Terms of service accepted' })
  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;

  @ApiPropertyOptional({ description: '6-digit postal PIN code' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ description: 'State name' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'District name' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Village or city name' })
  @IsOptional()
  @IsString()
  village?: string;

  @ApiPropertyOptional({ description: 'Post Office name' })
  @IsOptional()
  @IsString()
  postOffice?: string;

  @ApiPropertyOptional({ description: 'GPS Latitude' })
  @IsOptional()
  @IsNumber()
  gpsLat?: number;

  @ApiPropertyOptional({ description: 'GPS Longitude' })
  @IsOptional()
  @IsNumber()
  gpsLng?: number;

  @ApiPropertyOptional({ description: 'GPS Location Name' })
  @IsOptional()
  @IsString()
  gpsLocationName?: string;
}

export class SendMobileOtpDto {
  @ApiProperty({ description: '10-digit Indian mobile number' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?\d{10,15}$/, { message: 'Valid 10-digit mobile number is required.' })
  mobile: string;
}

export class VerifyMobileOtpDto {
  @ApiProperty({ description: '10-digit Indian mobile number' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?\d{10,15}$/, { message: 'Valid 10-digit mobile number is required.' })
  mobile: string;

  @ApiProperty({ description: '4 or 6 digit OTP code' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'OTP must be 4 to 6 digits.' })
  otp: string;
}
