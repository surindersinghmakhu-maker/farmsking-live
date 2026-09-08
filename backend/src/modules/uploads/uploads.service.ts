import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';

export interface UploadedFileObject {
  filename: string;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class UploadsService {
  constructor(private readonly prisma: PrismaService) {}

  create(user: AuthUser, file: UploadedFileObject) {
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
