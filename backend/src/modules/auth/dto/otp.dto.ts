import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendLoginOtpDto {
  @ApiProperty({ description: '10-digit mobile number' })
  @IsNotEmpty()
  @IsString()
  mobile: string;
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
