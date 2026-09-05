import { Module } from '@nestjs/common';
import { KingConnectController } from './king-connect.controller';
import { KingConnectService } from './king-connect.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KingConnectController],
  providers: [KingConnectService],
  exports: [KingConnectService],
})
export class KingConnectModule {}
