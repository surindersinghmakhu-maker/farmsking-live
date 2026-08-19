import { IsOptional, IsString } from 'class-validator';

export class RejectAssignmentDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
