import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { MediaStoreService } from './media-store.service';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/octet-stream',
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for 1-minute field videos
const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.mp4', '.webm', '.mov'];

@UseGuards(JwtAuthGuard)
@Controller('media-store')
export class MediaStoreController {
  constructor(private readonly mediaStoreService: MediaStoreService) {}

  /**
   * Upload raw multipart file into Media Store
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, callback) => {
          const rawExt = extname(file.originalname).toLowerCase();
          const ext = VALID_EXTENSIONS.includes(rawExt) ? rawExt : '.jpg';
          callback(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, callback) => {
        if (
          !ALLOWED_MIME_TYPES.includes(file.mimetype) &&
          !file.mimetype?.startsWith('image/') &&
          !file.mimetype?.startsWith('video/')
        ) {
          callback(new BadRequestException('Only image and video files are supported.'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadFile(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: any,
    @Body('cropId') cropId?: string,
    @Body('mediaType') mediaType?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided for Media Store upload.');
    }
    return this.mediaStoreService.uploadFile(user, file, cropId, mediaType);
  }

  /**
   * Upload base64 data URI (from watermarked canvas or webcam)
   */
  @Post('upload-base64')
  async uploadBase64(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      dataUri: string;
      cropId?: string;
      mediaType?: string;
      filename?: string;
    },
  ) {
    if (!body?.dataUri) {
      throw new BadRequestException('No dataUri provided for Media Store upload.');
    }
    return this.mediaStoreService.uploadBase64(
      user,
      body.dataUri,
      body.cropId,
      body.mediaType,
      body.filename,
    );
  }

  /**
   * Retrieve all photos and videos for a specific crop
   */
  @Get('crop/:cropId')
  async getCropMedia(@Param('cropId') cropId: string) {
    return this.mediaStoreService.getMediaForCrop(cropId);
  }

  /**
   * List items from Media Store with optional filtering
   */
  @Get()
  async listAll(
    @Query('cropId') cropId?: string,
    @Query('mediaType') mediaType?: string,
    @Query('provider') provider?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.mediaStoreService.listAll(cropId, mediaType, provider, limitNum);
  }

  /**
   * Archive media with 30-day retention upon crop completion
   */
  @Post('archive/:cropId')
  async archiveCropMedia(
    @Param('cropId') cropId: string,
    @Body('retentionDays') retentionDays?: number,
  ) {
    return this.mediaStoreService.archiveCropMedia(cropId, retentionDays || 30);
  }

  /**
   * Delete media record
   */
  @Delete(':id')
  async deleteMedia(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.mediaStoreService.deleteMedia(id, user);
  }
}

