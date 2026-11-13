import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LogEnquiryDto {
  @ApiPropertyOptional({ description: 'Optional order ID linked to this enquiry' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ description: 'Customer (Farmer) user ID' })
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Enquiry subject' })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  subject: string;

  @ApiProperty({ description: 'Detailed notes on enquiry or issue reported via call/field' })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  description: string;
}

