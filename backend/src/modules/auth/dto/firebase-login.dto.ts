import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FirebaseLoginDto {
  @ApiProperty({ description: 'Firebase Auth ID Token' })
  @IsNotEmpty()
  @IsString()
  idToken: string;

  @ApiPropertyOptional({ description: 'Login portal side: CLIENT or PARTNER', enum: ['CLIENT', 'PARTNER'] })
  @IsOptional()
  @IsIn(['CLIENT', 'PARTNER'])
  portal?: 'CLIENT' | 'PARTNER';
}
