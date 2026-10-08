import { AiChatService, AiChatRequestDto } from './ai-chat.service';
export declare class AiChatController {
    private readonly aiChatService;
    constructor(aiChatService: AiChatService);
    askAi(dto: AiChatRequestDto): Promise<{
        answer: string;
        isFarming: boolean;
    }>;
}
