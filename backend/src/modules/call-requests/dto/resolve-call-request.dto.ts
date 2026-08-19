import { IsNotEmpty, IsString } from 'class-validator';

export class ResolveCallRequestDto {
  @IsString()
  @IsNotEmpty()
  comment: string;
}
