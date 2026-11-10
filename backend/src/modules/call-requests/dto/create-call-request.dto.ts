import { IsOptional, IsString } from 'class-validator';

export class CreateCallRequestDto {
  @IsOptional()
  @IsString()
  advisorId?: string;

  @IsOptional()
  @IsString()
  cropId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

