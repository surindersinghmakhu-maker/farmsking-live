import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FirebaseLoginDto {
  @ApiProperty({ description: 'Firebase Auth ID Token' })
  @IsNotEmpty()
  @IsString()
  idToken: string;
}
