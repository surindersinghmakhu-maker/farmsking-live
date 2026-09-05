import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class RespondSyncRequestDto {
  @IsEnum(['ACCEPTED', 'REJECTED', 'COUNTER_PROPOSED'])
  response: 'ACCEPTED' | 'REJECTED' | 'COUNTER_PROPOSED';

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  // For counter proposal
  @IsOptional()
  @IsNumber()
  counterAmount?: number;

  @IsOptional()
  @IsString()
  counterNote?: string;
}
