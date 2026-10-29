import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiPropertyOptional({ description: 'Google email address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'User full name from Google profile' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Google profile picture URL' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Google UID / subject identifier' })
  @IsOptional()
  @IsString()
  googleId?: string;

  @ApiPropertyOptional({ description: 'Google OAuth access token' })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional({ description: 'Firebase or Google ID Token' })
  @IsOptional()
  @IsString()
  idToken?: string;
}
