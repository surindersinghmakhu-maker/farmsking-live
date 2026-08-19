import { IsString, MinLength } from 'class-validator';

export class SetReferrerDto {
  @IsString()
  @MinLength(1)
  referredByKingId: string;
}
