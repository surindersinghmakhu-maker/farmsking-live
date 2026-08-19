import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePartyDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  address: string;

  @IsOptional()
  @IsString()
  mobile?: string;
}
