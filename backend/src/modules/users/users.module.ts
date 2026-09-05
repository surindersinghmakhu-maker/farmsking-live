import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import { WhatsappBotModule } from '../whatsapp/whatsapp.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [WalletModule, WhatsappBotModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
