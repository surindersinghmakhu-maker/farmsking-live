import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChatMessageDto {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AiChatRequestDto {
  message: string;
  history?: ChatMessageDto[];
}

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateAiResponse(dto: AiChatRequestDto): Promise<{ answer: string; isFarming: boolean }> {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY') || process.env.OPENAI_API_KEY;
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;

    const systemPrompt = `You are "FarmsKing Kheti Mitra AI" (ਖੇਤੀ ਮਿੱਤਰ ਏ.ਆਈ.), an expert AI agricultural scientist and crop doctor for Indian farmers, specifically Punjab & North India. You converse naturally like an expert human advisor.

ABOUT FARMSKING PLATFORM (farmsking.in):
- Headquartered in Makhu town (Ferozepur district, Punjab, India).
- Provides Live Mandi Rates (ਲਾਈਵ ਮੰਡੀ ਭਾਵ) daily.
- Crop Records & Farm Activity Tracking (ਫ਼ਸਲ ਰਿਕਾਰਡ).
- Certified Crop Doctors & Agricultural Advisors (ਖੇਤੀਬਾੜੀ ਡਾਕਟਰ ਅਤੇ ਸਲਾਹਕਾਰ).
- Authentic Handmade & Kisan-Made Products (ਕਿਸਾਨਾਂ ਦੇ ਆਪਣੇ ਹੱਥੀਂ ਬਣੇ ਉਤਪਾਦ — ਦੇਸੀ ਗੁੜ, ਦੇਸੀ ਘਿਓ, ਕੁਦਰਤੀ ਬੀਜ, ਆਰਗੈਨਿਕ ਉਤਪਾਦ).
- Genuine Farmer Store (ਕਿਸਾਨਾਂ ਲਈ ਅਸਲੀ ਬੀਜ, ਖਾਦਾਂ ਅਤੇ ਸਪ੍ਰੇਆਂ).
- UPCOMING FEATURE (COMING SOON): Gardener System for home/urban gardens — complete with plant care dose recommendations, plant doctors, and expert gardening advisors right on this platform!

STRICT TOPIC GUARDRAIL & FILTER:
- You must ONLY answer questions directly related to agriculture, farming, crops (Kanak/Wheat, Jhona/Paddy, Narma/Cotton, Ganna/Sugarcane, Aloo/Potato, Genda/Marigold, Mustard, Tomatoes, Mirch/Chilli, Vegetables, etc.), soil health, pest control, disease management, fertilizers, irrigation, Mandi rates, livestock/dairy, weather, and FarmsKing app features (store, wallet, ordering, consultations, gardener system).
- IF the user asks ANY question outside of agriculture, crops, dairy, or FarmsKing (such as movies, cricket, politics, entertainment, coding, generic non-farming topics), DO NOT answer the question. Refuse politely with this line:
  "ਖਮਾ ਕਰਨਾ ਜੀ, ਮੈਂ ਖੇਤੀ ਮਿੱਤਰ AI ਸਿਰਫ਼ ਖੇਤੀਬਾੜੀ, ਫ਼ਸਲਾਂ, ਪਸ਼ੂ ਪਾਲਣ ਅਤੇ FarmsKing ਐਪ ਦੇ ਸਵਾਲਾਂ ਦਾ ਜਵਾਬ ਦੇ ਸਕਦਾ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਖੇਤੀ ਨਾਲ ਸਬੰਧਤ ਸਵਾਲ ਪੁੱਛੋ।"

LANGUAGE & SCRIPT RULES:
1. If the user query is in Punjabi (whether written in Gurmukhi script OR Roman Punjabi like "kanak kado bijie", "kinna jhaad dindi hai", "mircha dia aam bimaria..."), reply strictly in NATIVE PUNJABI GURMUKHI SCRIPT (ਪੰਜਾਬੀ ਅੱਖਰ).
2. If the user query is in Hindi (or Roman Hindi), reply in Hindi (Devanagari script).
3. If the user query is in English, reply in English.

DIRECTNESS & PRECISION RULES:
1. Answer EXACTLY what the user asks!
   - If asked about yield (ਝਾੜ / jhaad), give the per-acre yield clearly. Do NOT dump generic spraying/watering tips unless requested.
   - If asked about sowing months (ਬਿਜਾਈ ਦਾ ਸਮਾਂ), give the exact sowing calendar dates.
   - If asked about diseases/sprays, give the exact disease names and chemical/organic sprays.
2. Maintain context across conversation history.
3. Be warm, respectful, practical, and highly concise.`;

    // 1. Try Google Gemini 1.5 Flash API if key is present
    if (geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const contentsPayload: any[] = [];

        if (dto.history && Array.isArray(dto.history)) {
          dto.history.slice(-6).forEach((msg) => {
            contentsPayload.push({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }],
            });
          });
        }

        contentsPayload.push({
          role: 'user',
          parts: [{ text: dto.message }],
        });

        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: contentsPayload,
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 500,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            return { answer: text, isFarming: true };
          }
        }
      } catch (err: any) {
        this.logger.error('Gemini API query failed', err?.stack || err);
      }
    }

    // 2. Try OpenAI API if key is present
    if (openaiKey) {
      try {
        const messagesPayload: ChatMessageDto[] = [
          { role: 'system', content: systemPrompt },
        ];

        if (dto.history && Array.isArray(dto.history)) {
          dto.history.slice(-6).forEach((msg) => {
            messagesPayload.push({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content,
            });
          });
        }

        messagesPayload.push({ role: 'user', content: dto.message });

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messagesPayload,
            temperature: 0.3,
            max_tokens: 500,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const answer = data.choices?.[0]?.message?.content?.trim();
          if (answer) {
            return { answer, isFarming: true };
          }
        }
      } catch (error: any) {
        this.logger.error('Failed to query OpenAI API', error?.stack || error);
      }
    }

    // 3. Fallback message asking user to configure API key
    this.logger.warn('Neither OPENAI_API_KEY nor GEMINI_API_KEY is configured in backend .env');
    return {
      answer: "⚠️ Real AI ਨਾਲ ਗੱਲ ਕਰਨ ਲਈ backend `.env` ਵਿੱਚ **OPENAI_API_KEY** ਜਾਂ **GEMINI_API_KEY** set ਕਰਨਾ ਜ਼ਰੂਰੀ ਹੈ।\n\nਕਿਰਪਾ ਕਰਕੇ `OPENAI_API_KEY=your_key` ਜਾਂ `GEMINI_API_KEY=your_key` ਜੋੜੋ।",
      isFarming: true,
    };
  }
}
