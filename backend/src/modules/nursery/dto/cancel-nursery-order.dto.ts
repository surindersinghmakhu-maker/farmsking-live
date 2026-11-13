import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CancelNurseryOrderDto {
  @ApiProperty({ description: 'Detailed reason for cancellation' })
  @IsNotEmpty()
  @IsString()
  @MinLength(5, { message: 'Please provide a valid cancellation reason.' })
  reason: string;
}

