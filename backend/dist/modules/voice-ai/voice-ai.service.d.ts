import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
export declare class ProcessVoiceDto {
    transcript?: string;
    language?: string;
}
export declare class VoiceAIService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
