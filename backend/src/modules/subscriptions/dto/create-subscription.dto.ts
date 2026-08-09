import { IsUUID } from 'class-validator';

export class CreateSubscriptionDto {
  @IsUUID()
  planId: string;
}
