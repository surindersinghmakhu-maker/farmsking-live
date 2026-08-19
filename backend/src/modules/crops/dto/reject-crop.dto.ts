import { IsOptional, IsString } from 'class-validator';

export class RejectCropDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
