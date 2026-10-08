import { ConfigService } from '@nestjs/config';
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
    private readonly logger;
    constructor(configService: ConfigService);
    generateAiResponse(dto: AiChatRequestDto): Promise<{
        answer: string;
        isFarming: boolean;
    }>;
}
