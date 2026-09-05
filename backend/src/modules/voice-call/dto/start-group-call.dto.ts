import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StartGroupCallDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  groupId?: string;
}
