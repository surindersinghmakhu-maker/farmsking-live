import { IsEnum } from 'class-validator';

export class RespondConnectDto {
  @IsEnum(['ACCEPTED', 'DECLINED'])
  response: 'ACCEPTED' | 'DECLINED';
}
