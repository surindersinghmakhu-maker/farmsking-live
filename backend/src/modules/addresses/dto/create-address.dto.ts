import { IsIn, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateAddressDto {
  @IsIn(['HOME', 'FARM', 'WORK'])
  tag: 'HOME' | 'FARM' | 'WORK';

  @IsString()
  @MinLength(1)
  line: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsString()
  @MinLength(1)
  postOffice: string;

  @IsString()
  @MinLength(1)
  district: string;

  @IsString()
  @MinLength(1)
  state: string;

  @Matches(/^\d{6}$/, { message: 'PIN code must be exactly 6 digits.' })
  pincode: string;
}
