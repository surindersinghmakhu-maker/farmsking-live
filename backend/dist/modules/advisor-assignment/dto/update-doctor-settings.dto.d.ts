export declare class UpdateDoctorSettingsDto {
    showMobileNumber?: boolean;
    enableWhatsApp?: boolean;
    enableGsmCalling?: boolean;
    enableInAppAudioCall?: boolean;
    enableVideoCall?: boolean;
    monthlyFee?: number;
    monthlyCallLimit?: number;
    monthlyInAppCallLimit?: number;
    monthlyVideoAllowed?: boolean;
    monthlyVideoCallLimit?: number;
    monthlyChatEnabled?: boolean;
    cropSeasonFee?: number;
    cropSeasonCallLimit?: number;
    cropSeasonVideoAllowed?: boolean;
    singleConsultationFee?: number;
    allCropsSelected?: boolean;
    specializedCrops?: string[];
    freeConsultationEnabled?: boolean;
    availabilityStatus?: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
    workingHoursStart?: string;
    workingHoursEnd?: string;
    emergencyConsultation?: boolean;
    welcomeGreeting?: string;
    icarRegistrationNumber?: string;
    qualificationTitle?: string;
    maxFarmerCapacity?: number;
}
