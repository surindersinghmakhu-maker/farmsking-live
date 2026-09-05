import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class RespondPaymentRequestDto {
  @IsEnum(['ACCEPTED', 'PARTIALLY_ACCEPTED', 'POSTPONED', 'REJECTED'])
  response: 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'POSTPONED' | 'REJECTED';

  // For partial accept
  @IsOptional()
  @IsNumber()
  acceptedAmount?: number;

  // For postpone
  @IsOptional()
  @IsDateString()
  postponedDate?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
