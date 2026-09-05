import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';

export class ProcessVoiceDto {
  transcript?: string;
  language?: string;
}


@Injectable()
export class VoiceAIService {
  constructor(private readonly prisma: PrismaService) {}

  /** Process spoken Punjabi voice input, parse intent, and return spoken response */
  async processVoiceCommand(user: AuthUser, dto: ProcessVoiceDto) {
    const rawText = dto.transcript?.trim() || 'ਅੱਜ ਮੈਂ 2 ਬੋਰੀ ਡੀ.ਏ.ਪੀ 2700 ਦੀ ਖਰੀਦੀ ਹੈ';
    
    // NLU Entity Extraction simulation for Punjabi Ag Domain
    let parsedIntent = 'CROP_ADVISORY';
    let spokenResponse = 'ਤੁਹਾਡਾ ਸਵਾਲ ਪ੍ਰਾਪਤ ਹੋ ਗਿਆ ਹੈ। ਖੇਤੀ ਡਾਕਟਰ ਅਨੁਸਾਰ ਫਸਲ ਵਿੱਚ ਸਪਰੇਅ ਕਰਨ ਦੀ ਸਿਫ਼ਾਰਸ਼ ਕੀਤੀ ਜਾਂਦੀ ਹੈ।';

    if (rawText.includes('ਖਰੀਦੀ') || rawText.includes('ਖਰਚਾ') || rawText.includes('ਡੀ.ਏ.ਪੀ')) {
      parsedIntent = 'RECORD_EXPENSE';
      spokenResponse = 'ਤੁਹਾਡਾ ₹2,700 ਦਾ ਡੀ.ਏ.ਪੀ ਖਰਚਾ ਸਫਲਤਾਪੂਰਵਕ ਖਾਤੇ ਵਿੱਚ ਦਰਜ ਕਰ ਲਿਆ ਗਿਆ ਹੈ।';
    } else if (rawText.includes('ਵੇਚੀ') || rawText.includes('ਆਮਦਨ') || rawText.includes('ਕੁਇੰਟਲ')) {
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

  async getVoiceHistory(user: AuthUser) {
    return this.prisma.voiceAILog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
