import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LinkGoogleDto {
  @ApiProperty({ description: 'Google email address to link' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiPropertyOptional({ description: 'Full name from Google profile' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Profile picture URL from Google' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Google user ID (sub)' })
  @IsOptional()
  @IsString()
  googleId?: string;
}
