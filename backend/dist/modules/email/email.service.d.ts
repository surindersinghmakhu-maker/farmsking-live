import { AppSettingsService } from '../app-settings/app-settings.service';
export declare class EmailService {
    private readonly appSettingsService;
    private readonly logger;
    private transporter;
    constructor(appSettingsService: AppSettingsService);
    private initTransporter;
    sendEmailOtp(toEmail: string, otpCode: string): Promise<boolean>;
}
