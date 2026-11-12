import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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
import { SaveCropRemarkDto } from './dto/save-crop-remark.dto';

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
  'video/x-matroska',
  'video/x-m4v',
  'video/3gpp',
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/aac',
  'audio/m4a',
  'audio/x-m4a',
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for 1-minute field videos & audio
const VALID_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
  '.mp4', '.webm', '.mov', '.mkv', '.m4v', '.3gp',
  '.mp3', '.m4a', '.wav', '.ogg', '.aac', '.opus',
];

function inferExtFromMime(mimetype?: string): string {
  const mime = (mimetype || '').toLowerCase();
  if (mime.includes('png')) return '.png';
  if (mime.includes('webp')) return '.webp';
  if (mime.includes('heic')) return '.heic';
  if (mime.includes('heif')) return '.heif';
  if (mime.includes('webm')) return '.webm';
  if (mime.includes('mpeg') || mime.includes('mp3')) return '.mp3';
  if (mime.includes('m4a') || mime.includes('audio/mp4')) return '.m4a';
  if (mime.includes('ogg') || mime.includes('opus')) return '.ogg';
  if (mime.includes('wav')) return '.wav';
  if (mime.includes('aac')) return '.aac';
  if (mime.includes('quicktime')) return '.mov';
  if (mime.includes('matroska')) return '.mkv';
  if (mime.includes('m4v')) return '.m4v';
  if (mime.includes('3gpp')) return '.3gp';
  if (mime.startsWith('audio/')) return '.webm';
  if (mime.startsWith('video/')) return '.mp4';
  return '.jpg';
}

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
          const rawExt = extname(file.originalname || '').toLowerCase();
          const ext = VALID_EXTENSIONS.includes(rawExt) ? rawExt : inferExtFromMime(file.mimetype);
          callback(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, callback) => {
        const baseMime = (file.mimetype || '').split(';')[0].trim().toLowerCase();
        const rawExt = extname(file.originalname || '').toLowerCase();
        if (
          baseMime.includes('svg') ||
          baseMime.includes('html') ||
          baseMime.includes('javascript') ||
          rawExt === '.svg' ||
          rawExt === '.html' ||
          rawExt === '.htm' ||
          rawExt === '.js'
        ) {
          callback(new BadRequestException('SVG, HTML, and script files are disabled for security.'), false);
          return;
        }
        const isSafeOctet = baseMime === 'application/octet-stream' && VALID_EXTENSIONS.includes(rawExt);
        if (!isSafeOctet && !ALLOWED_MIME_TYPES.includes(baseMime)) {
          callback(new BadRequestException('Only image, video, and audio files are supported.'), false);
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
    if (!body?.dataUri || typeof body.dataUri !== 'string') {
      throw new BadRequestException('No dataUri provided for Media Store upload.');
    }
    const trimmed = body.dataUri.trim();
    if (/^(blob:|https?:|file:|content:|ph:|\/uploads\/)/i.test(trimmed)) {
      throw new BadRequestException('Invalid base64 payload: URL/blob URIs must be uploaded as multipart files to /media-store/upload.');
    }
    return this.mediaStoreService.uploadBase64(
      user,
      trimmed,
      body.cropId,
      body.mediaType,
      body.filename,
    );
  }

  /**
   * Retrieve all photos, videos, and audio notes for a specific crop (`scope=active|all`)
   */
  @Get('crop/:cropId')
  async getCropMedia(
    @CurrentUser() user: AuthUser,
    @Param('cropId') cropId: string,
    @Query('scope') scope?: 'active' | 'all',
  ) {
    return this.mediaStoreService.getMediaForCrop(user, cropId, scope === 'active' ? 'active' : 'all');
  }

  /**
   * Retrieve saved written remarks for a crop
   */
  @Get('crop/:cropId/remark')
  async getCropRemark(@CurrentUser() user: AuthUser, @Param('cropId') cropId: string) {
    return this.mediaStoreService.getCropRemark(user, cropId);
  }

  /**
   * Save or update farmer's written crop remarks (max 150 characters)
   */
  @Put('crop/:cropId/remark')
  async saveCropRemark(
    @CurrentUser() user: AuthUser,
    @Param('cropId') cropId: string,
    @Body() body: SaveCropRemarkDto,
  ) {
    return this.mediaStoreService.saveCropRemark(user, cropId, body.remarksText || '');
  }

  /**
   * List items from Media Store with optional filtering
   */
  @Get()
  async listAll(
    @CurrentUser() user: AuthUser,
    @Query('cropId') cropId?: string,
    @Query('mediaType') mediaType?: string,
    @Query('provider') provider?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.mediaStoreService.listAll(user, cropId, mediaType, provider, limitNum);
  }

  /**
   * Archive media with 30-day retention upon crop completion
   */
  @Post('archive/:cropId')
  async archiveCropMedia(
    @CurrentUser() user: AuthUser,
    @Param('cropId') cropId: string,
    @Body('retentionDays') retentionDays?: number,
  ) {
    return this.mediaStoreService.archiveCropMedia(user, cropId, retentionDays || 30);
  }

  /**
   * Delete media record
   */
  @Delete(':id')
  async deleteMedia(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.mediaStoreService.deleteMedia(id, user);
  }
}

