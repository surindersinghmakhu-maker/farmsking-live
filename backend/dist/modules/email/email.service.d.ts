export declare class EmailService {
    private readonly logger;
    private transporter;
    constructor();
    private initTransporter;
    sendEmailOtp(toEmail: string, otpCode: string): Promise<boolean>;
}
