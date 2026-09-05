import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PartyRole, PartyType } from '@prisma/client';

export class CreateUnifiedPartyDto {
  @IsString()
  name: string;

  @IsEnum(PartyType)
  @IsOptional()
  type?: PartyType;

  @IsArray()
  @IsEnum(PartyRole, { each: true })
  @IsOptional()
  roles?: PartyRole[];

  @IsString()
  @IsOptional()
  mandiName?: string;

  @IsString()
  @IsOptional()
  shopNumber?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  village?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  state?: string;
}
