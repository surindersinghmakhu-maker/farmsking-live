"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceAIService = exports.ProcessVoiceDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
class ProcessVoiceDto {
    transcript;
    language;
}
exports.ProcessVoiceDto = ProcessVoiceDto;
let VoiceAIService = class VoiceAIService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async processVoiceCommand(user, dto) {
        const rawText = dto.transcript?.trim() || 'ਅੱਜ ਮੈਂ 2 ਬੋਰੀ ਡੀ.ਏ.ਪੀ 2700 ਦੀ ਖਰੀਦੀ ਹੈ';
        let parsedIntent = 'CROP_ADVISORY';
        let spokenResponse = 'ਤੁਹਾਡਾ ਸਵਾਲ ਪ੍ਰਾਪਤ ਹੋ ਗਿਆ ਹੈ। ਖੇਤੀ ਡਾਕਟਰ ਅਨੁਸਾਰ ਫਸਲ ਵਿੱਚ ਸਪਰੇਅ ਕਰਨ ਦੀ ਸਿਫ਼ਾਰਸ਼ ਕੀਤੀ ਜਾਂਦੀ ਹੈ।';
        if (rawText.includes('ਖਰੀਦੀ') || rawText.includes('ਖਰਚਾ') || rawText.includes('ਡੀ.ਏ.ਪੀ')) {
            parsedIntent = 'RECORD_EXPENSE';
            spokenResponse = 'ਤੁਹਾਡਾ ₹2,700 ਦਾ ਡੀ.ਏ.ਪੀ ਖਰਚਾ ਸਫਲਤਾਪੂਰਵਕ ਖਾਤੇ ਵਿੱਚ ਦਰਜ ਕਰ ਲਿਆ ਗਿਆ ਹੈ।';
        }
        else if (rawText.includes('ਵੇਚੀ') || rawText.includes('ਆਮਦਨ') || rawText.includes('ਕੁਇੰਟਲ')) {
            parsedIntent = 'RECORD_SALE';
            spokenResponse = 'ਤੁਹਾਡੀ ਫਸਲ ਵੇਚ ਦੀ ਐਂਟਰੀ ਸਫਲਤਾਪੂਰਵਕ ਦਰਜ ਹੋ ਗਈ ਹੈ।';
        }
        const log = await this.prisma.voiceAILog.create({
            data: {
                userId: user.id,
                transcribedText: rawText,
                parsedIntent,
                spokenResponse,
                audioUrl: null,
            },
        });
        return {
            id: log.id,
            transcribedText: rawText,
            parsedIntent,
            spokenResponse,
            status: 'SUCCESS',
        };
    }
    async getVoiceHistory(user) {
        return this.prisma.voiceAILog.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }
};
exports.VoiceAIService = VoiceAIService;
exports.VoiceAIService = VoiceAIService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VoiceAIService);
//# sourceMappingURL=voice-ai.service.js.map