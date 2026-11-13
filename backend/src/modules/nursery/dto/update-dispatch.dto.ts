import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateDispatchDto {
  @ApiPropertyOptional({ description: 'Bus number e.g. PB-11-XX-1234 PRTC' })
  @IsOptional()
  @IsString()
  busNumber?: string;

  @ApiPropertyOptional({ description: 'Bus route e.g. Ludhiana to Rohtak' })
  @IsOptional()
  @IsString()
  busDepotRoute?: string;

  @ApiPropertyOptional({ description: 'Bus conductor mobile number' })
  @IsOptional()
  @IsString()
  busConductorMobile?: string;

  @ApiPropertyOptional({ description: 'Bus parcel bilty photo URL' })
  @IsOptional()
  @IsString()
  busBiltyPhotoUrl?: string;

  @ApiPropertyOptional({ description: 'Train number/name e.g. 12054 Jan Shatabdi' })
  @IsOptional()
  @IsString()
  trainNumber?: string;

  @ApiPropertyOptional({ description: 'Railway parcel receipt (RR) number' })
  @IsOptional()
  @IsString()
  railwayReceiptNumber?: string;

  @ApiPropertyOptional({ description: 'Destination railway station name' })
  @IsOptional()
  @IsString()
  destinationStation?: string;

  @ApiPropertyOptional({ description: 'Railway bilty photo URL' })
  @IsOptional()
  @IsString()
  rrBiltyPhotoUrl?: string;

  @ApiPropertyOptional({ description: 'Local driver name' })
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiPropertyOptional({ description: 'Local driver mobile' })
  @IsOptional()
  @IsString()
  driverMobile?: string;

  @ApiPropertyOptional({ description: 'Tractor / vehicle number' })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional({ description: 'Estimated arrival timestamp at destination' })
  @IsOptional()
  @IsDateString()
  expectedArrivalAt?: string;
}

