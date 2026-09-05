import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

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

  @IsOptional()
  @IsString()
  partyType?: string;

  @IsOptional()
  @IsString()
  kingId?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
