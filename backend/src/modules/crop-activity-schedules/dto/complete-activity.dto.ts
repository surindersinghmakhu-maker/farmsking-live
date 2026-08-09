import { IsOptional, IsString } from 'class-validator';

export class CompleteActivityDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
