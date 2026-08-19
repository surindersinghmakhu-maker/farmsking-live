import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateGardenDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  area?: number;
}
