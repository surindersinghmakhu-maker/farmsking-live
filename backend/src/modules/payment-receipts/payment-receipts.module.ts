import { Module } from '@nestjs/common';
import { PaymentReceiptsController } from './payment-receipts.controller';
import { PaymentReceiptsService } from './payment-receipts.service';

@Module({
  controllers: [PaymentReceiptsController],
  providers: [PaymentReceiptsService],
})
export class PaymentReceiptsModule {}
