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
export declare class DiagnoseLeafDto {
    imageBase64: string;
}
export interface LeafDiagnosisResult {
    cropRecognized: boolean;
    cropName: string;
    diseaseName: string;
    latinName: string;
    category: 'FUNGAL' | 'BACTERIAL' | 'VIRAL' | 'PEST_ATTACK' | 'DEFICIENCY' | 'HEALTHY';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidenceScore: number;
    symptoms: string;
    firstAidSpray: string;
    dosageInstructions: string;
    organicRemedy: string;
    precautions: string[];
    recommendedProductName: string;
    recommendedPrice: number;
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
    diagnoseLeaf(imageBase64: string): Promise<LeafDiagnosisResult>;
    private getFallbackDiagnosis;
}
