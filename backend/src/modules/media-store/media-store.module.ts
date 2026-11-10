import { Module } from '@nestjs/common';
import { MediaStoreController } from './media-store.controller';
import { MediaStoreService } from './media-store.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [MediaStoreController],
  providers: [MediaStoreService],
  exports: [MediaStoreService],
})
export class MediaStoreModule {}

