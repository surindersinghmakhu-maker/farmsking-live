import { IsUUID } from 'class-validator';

export class ChooseAdvisorDto {
  @IsUUID()
  advisorId: string;
}
