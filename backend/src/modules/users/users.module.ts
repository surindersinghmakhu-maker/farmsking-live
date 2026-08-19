import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [WalletModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
