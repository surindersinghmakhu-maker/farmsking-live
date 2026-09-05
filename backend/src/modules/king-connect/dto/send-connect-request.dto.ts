import { IsOptional, IsString } from 'class-validator';

export class SendConnectRequestDto {
  @IsOptional()
  @IsString()
  kingId?: string;

  @IsOptional()
  @IsString()
  mobile?: string;
}
