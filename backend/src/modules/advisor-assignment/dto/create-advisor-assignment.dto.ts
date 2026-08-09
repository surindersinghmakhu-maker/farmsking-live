import { IsOptional, IsUUID } from 'class-validator';

export class CreateAdvisorAssignmentDto {
  @IsUUID()
  advisorId: string;

  @IsUUID()
  farmerId: string;

  @IsOptional()
  @IsUUID()
  subscriptionId?: string;
}
