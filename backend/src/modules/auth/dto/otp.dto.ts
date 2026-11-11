import { IsIn, IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendLoginOtpDto {
  @ApiProperty({ description: '10-digit mobile number' })
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @ApiPropertyOptional({ description: 'Login portal side: CLIENT or PARTNER', enum: ['CLIENT', 'PARTNER'] })
  @IsOptional()
  @IsIn(['CLIENT', 'PARTNER'])
  portal?: 'CLIENT' | 'PARTNER';
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

  @ApiPropertyOptional({ description: 'Login portal side: CLIENT or PARTNER', enum: ['CLIENT', 'PARTNER'] })
  @IsOptional()
  @IsIn(['CLIENT', 'PARTNER'])
  portal?: 'CLIENT' | 'PARTNER';
}

export class SendWhatsAppOtpDto {
  @ApiProperty({ description: '10-digit mobile number' })
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @ApiProperty({ description: 'OTP code' })
  @IsNotEmpty()
  @IsString()
  otp: string;
}

export class SendEmailOtpDto {
  @ApiProperty({ description: 'Email address' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ description: 'OTP code' })
  @IsNotEmpty()
  @IsString()
  otp: string;
}

export class SendMobileLinkOtpDto {
  @ApiProperty({ description: '10-digit mobile number' })
  @IsNotEmpty()
  @IsString()
  mobile: string;
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

  @ApiPropertyOptional({ description: 'Login portal side: CLIENT or PARTNER', enum: ['CLIENT', 'PARTNER'] })
  @IsOptional()
  @IsIn(['CLIENT', 'PARTNER'])
  portal?: 'CLIENT' | 'PARTNER';
}
