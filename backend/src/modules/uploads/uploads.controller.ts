import { randomUUID } from 'crypto';
import { extname } from 'path';
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { UploadsService } from './uploads.service';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/x-png',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
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
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB for 1-minute field videos
const VALID_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
  '.mp4', '.webm', '.mov', '.mkv',
  '.mp3', '.m4a', '.wav', '.ogg', '.aac', '.opus',
];

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, callback) => {
          const rawExt = extname(file.originalname).toLowerCase();
          let ext = VALID_EXTENSIONS.includes(rawExt) ? rawExt : '';
          if (!ext) {
            if (file.mimetype === 'image/png') ext = '.png';
            else if (file.mimetype === 'image/webp') ext = '.webp';
            else if (file.mimetype === 'video/mp4') ext = '.mp4';
            else if (file.mimetype === 'video/webm') ext = '.webm';
            else if (file.mimetype === 'video/quicktime') ext = '.mov';
            else ext = '.jpg';
          }
          callback(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        const baseMime = String(file.mimetype || '').split(';')[0].trim().toLowerCase();
        const rawExt = extname(file.originalname || '').toLowerCase();
        if (
          baseMime.includes('svg') ||
          baseMime.includes('html') ||
          baseMime.includes('javascript') ||
          rawExt === '.svg' ||
          rawExt === '.html' ||
          rawExt === '.htm' ||
          rawExt === '.js' ||
          rawExt === '.ico'
        ) {
          callback(new BadRequestException('SVG, HTML, and executable files are not allowed.'), false);
          return;
        }
        const isSafeOctet = baseMime === 'application/octet-stream' && VALID_EXTENSIONS.includes(rawExt);
        if (
          !isSafeOctet &&
          !ALLOWED_MIME_TYPES.includes(baseMime)
        ) {
          callback(new BadRequestException('Only safe image, video, and audio files are allowed.'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  upload(@CurrentUser() user: AuthUser, @UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    return this.uploadsService.create(user, file);
  }

  @Post('base64')
  uploadBase64(
    @CurrentUser() user: AuthUser,
    @Body() body: { dataUri: string; filename?: string; folder?: string },
  ) {
    if (!body?.dataUri) {
      throw new BadRequestException('No base64 data provided.');
    }
    return this.uploadsService.createFromBase64(user, body.dataUri, body.filename, body.folder);
  }
}
