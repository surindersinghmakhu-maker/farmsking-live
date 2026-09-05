import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendChatMessageDto {
  @IsOptional()
  @IsString()
  farmerId?: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
