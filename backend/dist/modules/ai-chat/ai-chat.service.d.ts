import { ConfigService } from '@nestjs/config';
import { AppSettingsService } from '../app-settings/app-settings.service';
export interface ChatMessageDto {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export type AiChatMode = 'agri' | 'garden';
export declare class AiChatRequestDto {
    message: string;
    history?: ChatMessageDto[];
    mode?: AiChatMode;
}
export declare class AiChatService {
    private readonly configService;
    private readonly appSettingsService;
    private readonly logger;
    constructor(configService: ConfigService, appSettingsService: AppSettingsService);
    generateAiResponse(dto: AiChatRequestDto): Promise<{
        answer: string;
        isFarming: boolean;
    }>;
}
