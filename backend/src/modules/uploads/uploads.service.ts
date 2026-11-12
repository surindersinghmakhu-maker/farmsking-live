import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v2 as cloudinary } from 'cloudinary';

export interface UploadedFileObject {
  filename?: string;
  mimetype: string;
  originalname: string;
  size: number;
  buffer?: Buffer;
  path?: string;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly appSettingsService: AppSettingsService,
  ) {
    // Ensure local upload directories exist
    const baseUploadDir = path.resolve(process.cwd(), 'uploads');
    const cropsUploadDir = path.resolve(baseUploadDir, 'crops');
    if (!fs.existsSync(baseUploadDir)) fs.mkdirSync(baseUploadDir, { recursive: true });
    if (!fs.existsSync(cropsUploadDir)) fs.mkdirSync(cropsUploadDir, { recursive: true });
  }

  /**
   * Upload file buffer to active cloud/local storage provider and return permanent absolute URL.
   */
  async uploadToActiveStorage(
    buffer: Buffer,
    filename: string,
    mimetype: string,
    folder = 'crops',
  ): Promise<{ fileUrl: string; provider: string }> {
    let integrations: any = null;
    try {
      integrations = await this.appSettingsService.getIntegrations();
    } catch (err: any) {
      this.logger.warn(`Could not load integrations from database, using defaults: ${err?.message}`);
    }

    const storageConfig = integrations?.storage || {};
    const activeProvider = (storageConfig.activeProvider || 'CLOUDFLARE_R2').toUpperCase();
    const providers = storageConfig.providers || {};
    const key = `${folder}/${filename}`;

    // 1. Cloudflare R2 (S3 API - $0 Egress Bandwidth)
    if (activeProvider === 'CLOUDFLARE_R2' || activeProvider === 'CLOUDFLARE') {
      const r2 = providers.cloudflareR2 || {};
      if (r2.accountId && r2.accessKeyId && r2.secretAccessKey) {
        try {
          const s3 = new S3Client({
            region: 'auto',
            endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
            credentials: {
              accessKeyId: r2.accessKeyId,
              secretAccessKey: r2.secretAccessKey,
            },
          });

          await s3.send(
            new PutObjectCommand({
              Bucket: r2.bucketName || 'farmsking-media',
              Key: key,
              Body: buffer,
              ContentType: mimetype,
            }),
          );

          const publicBase = (r2.publicUrl || '').trim().replace(/\/$/, '') ||
            `https://${r2.bucketName || 'farmsking-media'}.${r2.accountId}.r2.cloudflarestorage.com`;
          const fileUrl = `${publicBase}/${key}`;
          this.logger.log(`[Storage] Uploaded to Cloudflare R2: ${fileUrl}`);
          return { fileUrl, provider: 'CLOUDFLARE_R2' };
        } catch (r2Err: any) {
          this.logger.error(`[Storage] Cloudflare R2 upload error: ${r2Err?.message}. Falling back to local.`);
        }
      }
    }

    // 2. AWS S3 Storage
    if (activeProvider === 'AWS_S3' || activeProvider === 'S3') {
      const aws = providers.awsS3 || providers.s3 || {};
      if (aws.accessKeyId && aws.secretAccessKey && aws.bucketName) {
        try {
          const region = aws.region || 'ap-south-1';
          const s3 = new S3Client({
            region,
            credentials: {
              accessKeyId: aws.accessKeyId,
              secretAccessKey: aws.secretAccessKey,
            },
          });

          await s3.send(
            new PutObjectCommand({
              Bucket: aws.bucketName,
              Key: key,
              Body: buffer,
              ContentType: mimetype,
            }),
          );

          const publicBase = (aws.publicUrl || '').trim().replace(/\/$/, '') ||
            `https://${aws.bucketName}.s3.${region}.amazonaws.com`;
          const fileUrl = `${publicBase}/${key}`;
          this.logger.log(`[Storage] Uploaded to AWS S3: ${fileUrl}`);
          return { fileUrl, provider: 'AWS_S3' };
        } catch (awsErr: any) {
          this.logger.error(`[Storage] AWS S3 upload error: ${awsErr?.message}. Falling back to local.`);
        }
      }
    }

    // 3. DigitalOcean Spaces & CDN
    if (activeProvider === 'DIGITALOCEAN' || activeProvider === 'SPACES') {
      const doSpaces = providers.digitalOcean || providers.spaces || providers.cloudflareR2 || {};
      if (doSpaces.accessKeyId && doSpaces.secretAccessKey) {
        try {
          const endpoint = doSpaces.endpoint || 'https://blr1.digitaloceanspaces.com';
          const bucket = doSpaces.bucketName || 'farmsking-media';
          const s3 = new S3Client({
            region: 'auto',
            endpoint,
            credentials: {
              accessKeyId: doSpaces.accessKeyId,
              secretAccessKey: doSpaces.secretAccessKey,
            },
          });

          await s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: buffer,
              ContentType: mimetype,
              ACL: 'public-read',
            }),
          );

          const publicBase = (doSpaces.publicUrl || '').trim().replace(/\/$/, '') ||
            `https://${bucket}.blr1.cdn.digitaloceanspaces.com`;
          const fileUrl = `${publicBase}/${key}`;
          this.logger.log(`[Storage] Uploaded to DigitalOcean Spaces: ${fileUrl}`);
          return { fileUrl, provider: 'DIGITALOCEAN' };
        } catch (doErr: any) {
          this.logger.error(`[Storage] DigitalOcean upload error: ${doErr?.message}. Falling back to local.`);
        }
      }
    }

    // 4. MinIO Self-Hosted NVMe S3
    if (activeProvider === 'MINIO') {
      const minio = providers.minio || {};
      if (minio.accessKey && minio.secretKey && minio.endpoint) {
        try {
          const endpoint = minio.endpoint.startsWith('http') ? minio.endpoint : `http://${minio.endpoint}`;
          const bucket = minio.bucketName || 'farmsking-media';
          const s3 = new S3Client({
            region: 'us-east-1',
            endpoint,
            forcePathStyle: true,
            credentials: {
              accessKeyId: minio.accessKey,
              secretAccessKey: minio.secretKey,
            },
          });

          await s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: buffer,
              ContentType: mimetype,
            }),
          );

          const publicBase = (minio.publicUrl || endpoint).trim().replace(/\/$/, '');
          const fileUrl = `${publicBase}/${bucket}/${key}`;
          this.logger.log(`[Storage] Uploaded to MinIO S3: ${fileUrl}`);
          return { fileUrl, provider: 'MINIO' };
        } catch (minErr: any) {
          this.logger.error(`[Storage] MinIO upload error: ${minErr?.message}. Falling back to local.`);
        }
      }
    }

    // 5. Firebase Cloud Storage (Google Cloud Storage)
    if (activeProvider === 'FIREBASE' || activeProvider === 'GCP_STORAGE') {
      const fb = providers.firebase || {};
      const bucketName = fb.storageBucket || 'farmsking-510606.firebasestorage.app';
      try {
        const encodedKey = encodeURIComponent(key);
        let uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o?uploadType=media&name=${encodedKey}`;
        if (fb.apiKey) uploadUrl += `&key=${fb.apiKey}`;

        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': mimetype },
          body: buffer as any,
        });

        if (res.ok) {
          const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedKey}?alt=media`;
          this.logger.log(`[Storage] Uploaded to Firebase Storage: ${fileUrl}`);
          return { fileUrl, provider: 'FIREBASE' };
        } else {
          const errText = await res.text();
          this.logger.error(`[Storage] Firebase upload response status ${res.status}: ${errText}. Falling back to local.`);
        }
      } catch (fbErr: any) {
        this.logger.error(`[Storage] Firebase upload error: ${fbErr?.message}. Falling back to local.`);
      }
    }

    // 3. Cloudinary (Auto-compression & Video CDN)
    if (activeProvider === 'CLOUDINARY') {
      const cl = providers.cloudinary || {};
      if (cl.cloudName && cl.apiKey && cl.apiSecret) {
        try {
          cloudinary.config({
            cloud_name: cl.cloudName,
            api_key: cl.apiKey,
            api_secret: cl.apiSecret,
          });

          const uploadResult = await new Promise<any>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: folder,
                resource_type: mimetype.startsWith('video/') ? 'video' : 'image',
              },
              (err, result) => {
                if (err) return reject(err);
                resolve(result);
              },
            );
            stream.end(buffer);
          });

          if (uploadResult?.secure_url) {
            this.logger.log(`[Storage] Uploaded to Cloudinary: ${uploadResult.secure_url}`);
            return { fileUrl: uploadResult.secure_url, provider: 'CLOUDINARY' };
          }
        } catch (clErr: any) {
          this.logger.error(`[Storage] Cloudinary upload error: ${clErr?.message}. Falling back to local.`);
        }
      }
    }

    // 4. Local Hostinger / Local Disk Storage (Default Fallback)
    const uploadsRoot = path.resolve(process.cwd(), 'uploads');
    const safeFolder = this.sanitizeUploadFolder(folder);
    const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const localTargetDir = path.resolve(uploadsRoot, safeFolder);
    if (!localTargetDir.startsWith(uploadsRoot + path.sep) && localTargetDir !== uploadsRoot) {
      throw new BadRequestException('Invalid upload target directory.');
    }
    if (!fs.existsSync(localTargetDir)) fs.mkdirSync(localTargetDir, { recursive: true });

    const localFilePath = path.resolve(localTargetDir, safeFilename);
    if (!localFilePath.startsWith(localTargetDir + path.sep)) {
      throw new BadRequestException('Invalid upload file path.');
    }
    fs.writeFileSync(localFilePath, buffer);

    const hostBaseUrl = (process.env.APP_URL || process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const fileUrl = `${hostBaseUrl}/uploads/${safeFolder}/${safeFilename}`;
    this.logger.log(`[Storage] Saved locally: ${fileUrl}`);
    return { fileUrl, provider: 'LOCAL' };
  }

  private sanitizeUploadFolder(rawFolder?: string): string {
    const ALLOWED_FOLDERS = new Set([
      'crops', 'products', 'profiles', 'avatars', 'chat', 'kyc', 'gardens', 'receipts', 'complaints', 'banners', 'brand', 'categories',
    ]);
    const cleaned = String(rawFolder || 'crops').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return ALLOWED_FOLDERS.has(cleaned) ? cleaned : 'crops';
  }

  private assertSafeMediaMime(mimetype?: string, filename?: string): string {
    const baseMime = String(mimetype || '').split(';')[0].trim().toLowerCase();
    const ext = path.extname(filename || '').toLowerCase();
    if (baseMime.includes('svg') || baseMime.includes('html') || baseMime.includes('javascript') || ext === '.svg' || ext === '.html' || ext === '.htm' || ext === '.js') {
      throw new BadRequestException('Executable or SVG file uploads are disabled for security.');
    }
    const SAFE_MIME_RE = /^(image\/(jpeg|jpg|png|webp|heic|heif)|video\/(mp4|webm|quicktime|x-matroska|x-m4v|3gpp)|audio\/(webm|mp4|mpeg|mp3|ogg|opus|wav|wave|x-wav|aac|m4a|x-m4a))$/;
    const SAFE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.mp4', '.webm', '.mov', '.mkv', '.m4v', '.3gp', '.mp3', '.m4a', '.wav', '.ogg', '.aac', '.opus'];
    if (SAFE_MIME_RE.test(baseMime)) return baseMime;
    if ((baseMime === 'application/octet-stream' || !baseMime) && SAFE_EXTS.includes(ext)) {
      return ext === '.mp3' ? 'audio/mpeg' : ext === '.m4a' ? 'audio/mp4' : ext === '.wav' ? 'audio/wav' : ext === '.mp4' ? 'video/mp4' : ext === '.png' ? 'image/png' : 'image/jpeg';
    }
    throw new BadRequestException('Unsupported media type for upload.');
  }

  private inferExtension(filenameOrOriginal: string | undefined, mimetype: string | undefined): string {
    const rawExt = path.extname(filenameOrOriginal || '').toLowerCase();
    const valid = [
      '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
      '.mp4', '.webm', '.mov', '.mkv', '.m4v', '.3gp',
      '.mp3', '.m4a', '.wav', '.ogg', '.aac', '.opus',
    ];
    if (rawExt && valid.includes(rawExt)) return rawExt;
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

  /**
   * Handle Multipart form-data uploaded file.
   */
  async create(user: AuthUser, file: UploadedFileObject) {
    let buffer: Buffer;
    let tempFilePath: string | undefined;
    if (file.buffer) {
      buffer = file.buffer;
    } else if (file.path && fs.existsSync(file.path)) {
      tempFilePath = path.resolve(file.path);
      buffer = fs.readFileSync(tempFilePath);
    } else {
      const localPath = path.resolve(process.cwd(), 'uploads', file.filename || '');
      if (fs.existsSync(localPath)) {
        tempFilePath = localPath;
        buffer = fs.readFileSync(localPath);
      } else {
        buffer = Buffer.from([]);
      }
    }

    if (!buffer.length) {
      throw new BadRequestException('Uploaded file is empty.');
    }

    const safeMime = this.assertSafeMediaMime(file.mimetype, file.originalname || file.filename);
    const ext = this.inferExtension(file.originalname || file.filename, safeMime);
    const cleanFilename = `${randomUUID()}${ext}`;
    const targetLocalPath = path.resolve(process.cwd(), 'uploads', 'crops', cleanFilename);
    const resolvedMime = safeMime;

    const { fileUrl, provider } = await this.uploadToActiveStorage(
      buffer,
      cleanFilename,
      resolvedMime,
      'crops',
    );

    if (tempFilePath && tempFilePath !== targetLocalPath) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {
        // non-fatal temp file cleanup
      }
    }

    const record = await this.prisma.upload.create({
      data: {
        uploadedById: user.id,
        fileUrl, // Stores permanent absolute CDN URL in database!
        mimeType: resolvedMime,
        originalName: file.originalname || cleanFilename,
        sizeBytes: file.size || buffer.length,
      },
    });

    return {
      ...record,
      provider,
      storageKey: `crops/${cleanFilename}`,
    };
  }

  /**
   * Handle Base64 Data URI uploaded from web canvas (Watermarked field photos / video frames).
   */
  async createFromBase64(
    user: AuthUser,
    dataUri: string,
    customFilename?: string,
    folder = 'crops',
  ) {
    const trimmed = (dataUri || '').trim();
    if (!trimmed || /^(blob:|https?:|file:|content:|ph:|\/uploads\/)/i.test(trimmed)) {
      throw new BadRequestException('Invalid base64 data URI. Expected data:<mime>;base64,...');
    }

    // Parse Data URI: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    const match = trimmed.match(/^data:([^;]+);base64,(.+)$/);
    let mimetype = 'image/jpeg';
    let base64Content = trimmed;

    if (match) {
      mimetype = match[1];
      base64Content = match[2];
    } else if (trimmed.startsWith('data:')) {
      const commaIdx = trimmed.indexOf(',');
      if (commaIdx !== -1) {
        base64Content = trimmed.slice(commaIdx + 1);
      }
    }

    const buffer = Buffer.from(base64Content, 'base64');
    if (!buffer.length) {
      throw new BadRequestException('Decoded base64 file content is empty.');
    }

    const safeFolder = this.sanitizeUploadFolder(folder);
    mimetype = this.assertSafeMediaMime(mimetype, customFilename);
    const ext = this.inferExtension(customFilename, mimetype);
    const filename = `${randomUUID()}${ext}`;
    const { fileUrl, provider } = await this.uploadToActiveStorage(buffer, filename, mimetype, safeFolder);

    const record = await this.prisma.upload.create({
      data: {
        uploadedById: user.id,
        fileUrl, // Permanent absolute CDN URL!
        mimeType: mimetype,
        originalName: filename,
        sizeBytes: buffer.length,
      },
    });

    return {
      ...record,
      provider,
      storageKey: `${folder}/${filename}`,
    };
  }
}
