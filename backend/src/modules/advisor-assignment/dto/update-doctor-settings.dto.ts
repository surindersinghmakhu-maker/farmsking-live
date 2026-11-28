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
  @IsBoolean()
  monthlyPlanEnabled?: boolean;

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

  // ── 3 Distinct Monthly Tier Plans ──
  @IsOptional()
  @IsBoolean()
  monthlyPlan1Enabled?: boolean;

  @IsOptional()
  @IsString()
  monthlyPlan1Name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPlan1Fee?: number;

  @IsOptional()
  @IsString()
  monthlyPlan1Features?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  monthlyPlan1CropsLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPlan1CallLimit?: number;

  @IsOptional()
  @IsBoolean()
  monthlyPlan1VideoAllowed?: boolean;

  @IsOptional()
  @IsBoolean()
  monthlyPlan2Enabled?: boolean;

  @IsOptional()
  @IsString()
  monthlyPlan2Name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPlan2Fee?: number;

  @IsOptional()
  @IsString()
  monthlyPlan2Features?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  monthlyPlan2CropsLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPlan2CallLimit?: number;

  @IsOptional()
  @IsBoolean()
  monthlyPlan2VideoAllowed?: boolean;

  @IsOptional()
  @IsBoolean()
  monthlyPlan3Enabled?: boolean;

  @IsOptional()
  @IsString()
  monthlyPlan3Name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPlan3Fee?: number;

  @IsOptional()
  @IsString()
  monthlyPlan3Features?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  monthlyPlan3CropsLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPlan3CallLimit?: number;

  @IsOptional()
  @IsBoolean()
  monthlyPlan3VideoAllowed?: boolean;

  // ── Duration Discount Percentages (%) for 3, 6, 12 Months ──
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount3Months?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount6Months?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount12Months?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plan1Discount3Months?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plan1Discount6Months?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plan1Discount12Months?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plan2Discount3Months?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plan2Discount6Months?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plan2Discount12Months?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plan3Discount3Months?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plan3Discount6Months?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plan3Discount12Months?: number;

  // 3-Month Plan Pack
  @IsOptional()
  @IsBoolean()
  plan3MonthsEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fee3Months?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  callLimit3Months?: number;

  @IsOptional()
  @IsBoolean()
  videoAllowed3Months?: boolean;

  // 6-Month Plan Pack
  @IsOptional()
  @IsBoolean()
  plan6MonthsEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fee6Months?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  callLimit6Months?: number;

  @IsOptional()
  @IsBoolean()
  videoAllowed6Months?: boolean;

  // 12-Month (Annual) Plan Pack
  @IsOptional()
  @IsBoolean()
  plan12MonthsEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fee12Months?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  callLimit12Months?: number;

  @IsOptional()
  @IsBoolean()
  videoAllowed12Months?: boolean;

  // Full Season Crop Care
  @IsOptional()
  @IsBoolean()
  cropSeasonPlanEnabled?: boolean;

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

  // Single Consultation / SOS
  @IsOptional()
  @IsBoolean()
  singleConsultationPlanEnabled?: boolean;

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
  @IsString()
  certifiedAt?: string;

  @IsOptional()
  @IsString()
  testPassedDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxFarmerCapacity?: number;
}
