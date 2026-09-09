import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { WhatsappBotService } from '../src/modules/whatsapp/whatsapp.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  const waService = app.get(WhatsappBotService);

  const status = waService.getQrCodeStatus();
  console.log('WhatsApp Bot Connection Status:', status);

  const targetMobile = '919872066901';
  const success = await waService.sendOtpMessage(targetMobile, '12345');
  console.log(`Sending WhatsApp test message to ${targetMobile}:`, success);

  await app.close();
}

bootstrap().catch(console.error);
