export declare class SendLoginOtpDto {
    mobile: string;
    portal?: 'CLIENT' | 'PARTNER';
}
export declare class VerifyLoginOtpDto {
    mobile: string;
    otp: string;
    portal?: 'CLIENT' | 'PARTNER';
}
export declare class SendWhatsAppOtpDto {
    mobile: string;
    otp: string;
}
export declare class SendEmailOtpDto {
    email: string;
    otp: string;
}
export declare class SendMobileLinkOtpDto {
    mobile: string;
}
export declare class CompleteOtpRegistrationDto {
    mobile: string;
    name?: string;
    role: 'CUSTOMER' | 'FARMER' | 'GARDENER';
    portal?: 'CLIENT' | 'PARTNER';
}
