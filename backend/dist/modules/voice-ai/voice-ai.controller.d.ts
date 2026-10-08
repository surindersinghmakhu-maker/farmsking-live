import type { AuthUser } from '../../common/types/auth-user.type';
import { ProcessVoiceDto, VoiceAIService } from './voice-ai.service';
export declare class VoiceAIController {
    private readonly voiceAIService;
    constructor(voiceAIService: VoiceAIService);
    processVoiceCommand(user: AuthUser, dto: ProcessVoiceDto): Promise<{
        id: string;
        transcribedText: string;
        parsedIntent: string;
        spokenResponse: string;
        status: string;
    }>;
    getVoiceHistory(user: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        transcribedText: string;
        parsedIntent: string;
        spokenResponse: string | null;
        audioUrl: string | null;
    }[]>;
}
