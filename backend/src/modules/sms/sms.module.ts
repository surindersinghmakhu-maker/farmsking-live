import { Module, Global } from '@nestjs/common';
import { SmsService } from './sms.service';
import { AppSettingsModule } from '../app-settings/app-settings.module';

@Global()
@Module({
  imports: [AppSettingsModule],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
