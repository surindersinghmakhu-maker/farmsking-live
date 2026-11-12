import { AiChatService, AiChatRequestDto, DiagnoseLeafDto } from './ai-chat.service';
export declare class AiChatController {
    private readonly aiChatService;
    constructor(aiChatService: AiChatService);
    askAi(dto: AiChatRequestDto): Promise<{
        answer: string;
        isFarming: boolean;
    }>;
    diagnoseLeaf(body: DiagnoseLeafDto): Promise<import("./ai-chat.service").LeafDiagnosisResult>;
}
