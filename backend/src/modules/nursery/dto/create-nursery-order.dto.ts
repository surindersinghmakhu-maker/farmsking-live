import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { InterStateDeliveryMode, TransportMode } from '@prisma/client';

export class CreateNurseryOrderDto {
  @ApiProperty({ description: 'ID of the nursery batch to book' })
  @IsNotEmpty()
  @IsString()
  batchId: string;

  @ApiProperty({ description: 'Quantity of units (Trays or Acres)' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  quantityUnits: number;

  @ApiProperty({ description: 'Target delivery date requested by the buyer (ISO)' })
  @IsNotEmpty()
  @IsDateString()
  requestedDeliveryDate: string;

  @ApiProperty({ enum: TransportMode, default: TransportMode.ROADWAYS_BUS_PARCEL })
  @IsNotEmpty()
  @IsEnum(TransportMode)
  transportMode: TransportMode;

  @ApiProperty({ enum: InterStateDeliveryMode, default: InterStateDeliveryMode.BUS_STAND_SELF_PICKUP })
  @IsNotEmpty()
  @IsEnum(InterStateDeliveryMode)
  deliveryMode: InterStateDeliveryMode;

  @ApiPropertyOptional({ description: 'Optional Local Field Partner (Agent) ID assisting the booking' })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional({ description: 'Delivery location notes, farm coordinates, or bus stand name' })
  @IsOptional()
  @IsString()
  notes?: string;
}

