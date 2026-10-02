import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import { AppSettingsModule } from '../app-settings/app-settings.module';
import { WithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';

@Module({
  imports: [WalletModule, AppSettingsModule],
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService],
})
export class WithdrawalsModule {}
