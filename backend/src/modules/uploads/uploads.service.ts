import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';

@Injectable()
export class UploadsService {
  constructor(private readonly prisma: PrismaService) {}

  create(user: AuthUser, file: Express.Multer.File) {
    return this.prisma.upload.create({
      data: {
        uploadedById: user.id,
        fileUrl: `/uploads/${file.filename}`,
        mimeType: file.mimetype,
        originalName: file.originalname,
        sizeBytes: file.size,
      },
    });
  }
}
