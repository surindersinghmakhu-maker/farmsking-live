import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class RespondDemandRequestDto {
  @IsEnum(['ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED'])
  response: 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED';

  // For partial accept
  @IsOptional()
  @IsNumber()
  acceptedQty?: number;

  @IsOptional()
  @IsString()
  counterNote?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
