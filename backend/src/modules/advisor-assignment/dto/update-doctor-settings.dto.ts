import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateDoctorSettingsDto {
  // 1. Contact Privacy & Communication Channels
  @IsOptional()
  @IsBoolean()
  showMobileNumber?: boolean;

  @IsOptional()
  @IsBoolean()
  enableWhatsApp?: boolean;

  @IsOptional()
  @IsBoolean()
  enableGsmCalling?: boolean;

  @IsOptional()
  @IsBoolean()
  enableInAppAudioCall?: boolean;

  @IsOptional()
  @IsBoolean()
  enableVideoCall?: boolean;

  // 2. Consultation Plans & Pricing
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyCallLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyInAppCallLimit?: number;

  @IsOptional()
  @IsBoolean()
  monthlyVideoAllowed?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyVideoCallLimit?: number;

  @IsOptional()
  @IsBoolean()
  monthlyChatEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cropSeasonFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cropSeasonCallLimit?: number;

  @IsOptional()
  @IsBoolean()
  cropSeasonVideoAllowed?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  singleConsultationFee?: number;

  @IsOptional()
  @IsBoolean()
  allCropsSelected?: boolean;

  @IsOptional()
  specializedCrops?: string[];

  @IsOptional()
  @IsBoolean()
  freeConsultationEnabled?: boolean;

  // 3. Availability & Practice Timings
  @IsOptional()
  @IsString()
  availabilityStatus?: 'AVAILABLE' | 'BUSY' | 'OFFLINE';

  @IsOptional()
  @IsString()
  workingHoursStart?: string;

  @IsOptional()
  @IsString()
  workingHoursEnd?: string;

  @IsOptional()
  @IsBoolean()
  emergencyConsultation?: boolean;

  @IsOptional()
  @IsString()
  welcomeGreeting?: string;

  // 4. Agronomy Credential & Prescriptions Signature
  @IsOptional()
  @IsString()
  icarRegistrationNumber?: string;

  @IsOptional()
  @IsString()
  qualificationTitle?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxFarmerCapacity?: number;
}
