import { randomUUID } from 'crypto';
import { extname } from 'path';
import {
  BadRequestException,
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

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/octet-stream'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];

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
            else if (file.mimetype === 'image/heic') ext = '.heic';
            else ext = '.jpg';
          }
          callback(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype) && !file.mimetype?.startsWith('image/')) {
          callback(new BadRequestException('Only image files (JPEG, PNG, WEBP, HEIC) are allowed.'), false);
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
}

