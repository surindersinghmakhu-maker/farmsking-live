"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UploadsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma_service_1 = require("../prisma/prisma.service");
const app_settings_service_1 = require("../app-settings/app-settings.service");
const client_s3_1 = require("@aws-sdk/client-s3");
const cloudinary_1 = require("cloudinary");
let UploadsService = UploadsService_1 = class UploadsService {
    constructor(prisma, appSettingsService) {
        this.prisma = prisma;
        this.appSettingsService = appSettingsService;
        this.logger = new common_1.Logger(UploadsService_1.name);
        const baseUploadDir = path.resolve(process.cwd(), 'uploads');
        const cropsUploadDir = path.resolve(baseUploadDir, 'crops');
        if (!fs.existsSync(baseUploadDir))
            fs.mkdirSync(baseUploadDir, { recursive: true });
        if (!fs.existsSync(cropsUploadDir))
            fs.mkdirSync(cropsUploadDir, { recursive: true });
    }
    async uploadToActiveStorage(buffer, filename, mimetype, folder = 'crops') {
        let integrations = null;
        try {
            integrations = await this.appSettingsService.getIntegrations();
        }
        catch (err) {
            this.logger.warn(`Could not load integrations from database, using defaults: ${err?.message}`);
        }
        const storageConfig = integrations?.storage || {};
        const activeProvider = (storageConfig.activeProvider || 'CLOUDFLARE_R2').toUpperCase();
        const providers = storageConfig.providers || {};
        const key = `${folder}/${filename}`;
        if (activeProvider === 'CLOUDFLARE_R2' || activeProvider === 'CLOUDFLARE') {
            const r2 = providers.cloudflareR2 || {};
            if (r2.accountId && r2.accessKeyId && r2.secretAccessKey) {
                try {
                    const s3 = new client_s3_1.S3Client({
                        region: 'auto',
                        endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
                        credentials: {
                            accessKeyId: r2.accessKeyId,
                            secretAccessKey: r2.secretAccessKey,
                        },
                    });
                    await s3.send(new client_s3_1.PutObjectCommand({
                        Bucket: r2.bucketName || 'farmsking-media',
                        Key: key,
                        Body: buffer,
                        ContentType: mimetype,
                    }));
                    const publicBase = (r2.publicUrl || '').trim().replace(/\/$/, '') ||
                        `https://${r2.bucketName || 'farmsking-media'}.${r2.accountId}.r2.cloudflarestorage.com`;
                    const fileUrl = `${publicBase}/${key}`;
                    this.logger.log(`[Storage] Uploaded to Cloudflare R2: ${fileUrl}`);
                    return { fileUrl, provider: 'CLOUDFLARE_R2' };
                }
                catch (r2Err) {
                    this.logger.error(`[Storage] Cloudflare R2 upload error: ${r2Err?.message}. Falling back to local.`);
                }
            }
        }
        if (activeProvider === 'AWS_S3' || activeProvider === 'S3') {
            const aws = providers.awsS3 || providers.s3 || {};
            if (aws.accessKeyId && aws.secretAccessKey && aws.bucketName) {
                try {
                    const region = aws.region || 'ap-south-1';
                    const s3 = new client_s3_1.S3Client({
                        region,
                        credentials: {
                            accessKeyId: aws.accessKeyId,
                            secretAccessKey: aws.secretAccessKey,
                        },
                    });
                    await s3.send(new client_s3_1.PutObjectCommand({
                        Bucket: aws.bucketName,
                        Key: key,
                        Body: buffer,
                        ContentType: mimetype,
                    }));
                    const publicBase = (aws.publicUrl || '').trim().replace(/\/$/, '') ||
                        `https://${aws.bucketName}.s3.${region}.amazonaws.com`;
                    const fileUrl = `${publicBase}/${key}`;
                    this.logger.log(`[Storage] Uploaded to AWS S3: ${fileUrl}`);
                    return { fileUrl, provider: 'AWS_S3' };
                }
                catch (awsErr) {
                    this.logger.error(`[Storage] AWS S3 upload error: ${awsErr?.message}. Falling back to local.`);
                }
            }
        }
        if (activeProvider === 'DIGITALOCEAN' || activeProvider === 'SPACES') {
            const doSpaces = providers.digitalOcean || providers.spaces || providers.cloudflareR2 || {};
            if (doSpaces.accessKeyId && doSpaces.secretAccessKey) {
                try {
                    const endpoint = doSpaces.endpoint || 'https://blr1.digitaloceanspaces.com';
                    const bucket = doSpaces.bucketName || 'farmsking-media';
                    const s3 = new client_s3_1.S3Client({
                        region: 'auto',
                        endpoint,
                        credentials: {
                            accessKeyId: doSpaces.accessKeyId,
                            secretAccessKey: doSpaces.secretAccessKey,
                        },
                    });
                    await s3.send(new client_s3_1.PutObjectCommand({
                        Bucket: bucket,
                        Key: key,
                        Body: buffer,
                        ContentType: mimetype,
                        ACL: 'public-read',
                    }));
                    const publicBase = (doSpaces.publicUrl || '').trim().replace(/\/$/, '') ||
                        `https://${bucket}.blr1.cdn.digitaloceanspaces.com`;
                    const fileUrl = `${publicBase}/${key}`;
                    this.logger.log(`[Storage] Uploaded to DigitalOcean Spaces: ${fileUrl}`);
                    return { fileUrl, provider: 'DIGITALOCEAN' };
                }
                catch (doErr) {
                    this.logger.error(`[Storage] DigitalOcean upload error: ${doErr?.message}. Falling back to local.`);
                }
            }
        }
        if (activeProvider === 'MINIO') {
            const minio = providers.minio || {};
            if (minio.accessKey && minio.secretKey && minio.endpoint) {
                try {
                    const endpoint = minio.endpoint.startsWith('http') ? minio.endpoint : `http://${minio.endpoint}`;
                    const bucket = minio.bucketName || 'farmsking-media';
                    const s3 = new client_s3_1.S3Client({
                        region: 'us-east-1',
                        endpoint,
                        forcePathStyle: true,
                        credentials: {
                            accessKeyId: minio.accessKey,
                            secretAccessKey: minio.secretKey,
                        },
                    });
                    await s3.send(new client_s3_1.PutObjectCommand({
                        Bucket: bucket,
                        Key: key,
                        Body: buffer,
                        ContentType: mimetype,
                    }));
                    const publicBase = (minio.publicUrl || endpoint).trim().replace(/\/$/, '');
                    const fileUrl = `${publicBase}/${bucket}/${key}`;
                    this.logger.log(`[Storage] Uploaded to MinIO S3: ${fileUrl}`);
                    return { fileUrl, provider: 'MINIO' };
                }
                catch (minErr) {
                    this.logger.error(`[Storage] MinIO upload error: ${minErr?.message}. Falling back to local.`);
                }
            }
        }
        if (activeProvider === 'FIREBASE' || activeProvider === 'GCP_STORAGE') {
            const fb = providers.firebase || {};
            const bucketName = fb.storageBucket || 'farmsking-510606.firebasestorage.app';
            try {
                const encodedKey = encodeURIComponent(key);
                let uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o?uploadType=media&name=${encodedKey}`;
                if (fb.apiKey)
                    uploadUrl += `&key=${fb.apiKey}`;
                const res = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': mimetype },
                    body: buffer,
                });
                if (res.ok) {
                    const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedKey}?alt=media`;
                    this.logger.log(`[Storage] Uploaded to Firebase Storage: ${fileUrl}`);
                    return { fileUrl, provider: 'FIREBASE' };
                }
                else {
                    const errText = await res.text();
                    this.logger.error(`[Storage] Firebase upload response status ${res.status}: ${errText}. Falling back to local.`);
                }
            }
            catch (fbErr) {
                this.logger.error(`[Storage] Firebase upload error: ${fbErr?.message}. Falling back to local.`);
            }
        }
        if (activeProvider === 'CLOUDINARY') {
            const cl = providers.cloudinary || {};
            if (cl.cloudName && cl.apiKey && cl.apiSecret) {
                try {
                    cloudinary_1.v2.config({
                        cloud_name: cl.cloudName,
                        api_key: cl.apiKey,
                        api_secret: cl.apiSecret,
                    });
                    const uploadResult = await new Promise((resolve, reject) => {
                        const stream = cloudinary_1.v2.uploader.upload_stream({
                            folder: folder,
                            resource_type: mimetype.startsWith('video/') ? 'video' : 'image',
                        }, (err, result) => {
                            if (err)
                                return reject(err);
                            resolve(result);
                        });
                        stream.end(buffer);
                    });
                    if (uploadResult?.secure_url) {
                        this.logger.log(`[Storage] Uploaded to Cloudinary: ${uploadResult.secure_url}`);
                        return { fileUrl: uploadResult.secure_url, provider: 'CLOUDINARY' };
                    }
                }
                catch (clErr) {
                    this.logger.error(`[Storage] Cloudinary upload error: ${clErr?.message}. Falling back to local.`);
                }
            }
        }
        const uploadsRoot = path.resolve(process.cwd(), 'uploads');
        const safeFolder = this.sanitizeUploadFolder(folder);
        const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
        const localTargetDir = path.resolve(uploadsRoot, safeFolder);
        if (!localTargetDir.startsWith(uploadsRoot + path.sep) && localTargetDir !== uploadsRoot) {
            throw new common_1.BadRequestException('Invalid upload target directory.');
        }
        if (!fs.existsSync(localTargetDir))
            fs.mkdirSync(localTargetDir, { recursive: true });
        const localFilePath = path.resolve(localTargetDir, safeFilename);
        if (!localFilePath.startsWith(localTargetDir + path.sep)) {
            throw new common_1.BadRequestException('Invalid upload file path.');
        }
        fs.writeFileSync(localFilePath, buffer);
        const hostBaseUrl = (process.env.APP_URL || process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
        const fileUrl = `${hostBaseUrl}/uploads/${safeFolder}/${safeFilename}`;
        this.logger.log(`[Storage] Saved locally: ${fileUrl}`);
        return { fileUrl, provider: 'LOCAL' };
    }
    sanitizeUploadFolder(rawFolder) {
        const ALLOWED_FOLDERS = new Set([
            'crops', 'products', 'profiles', 'avatars', 'chat', 'kyc', 'gardens', 'receipts', 'complaints', 'banners', 'brand', 'categories',
        ]);
        const cleaned = String(rawFolder || 'crops').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        return ALLOWED_FOLDERS.has(cleaned) ? cleaned : 'crops';
    }
    assertSafeMediaMime(mimetype, filename) {
        const baseMime = String(mimetype || '').split(';')[0].trim().toLowerCase();
        const ext = path.extname(filename || '').toLowerCase();
        if (baseMime.includes('svg') || baseMime.includes('html') || baseMime.includes('javascript') || ext === '.svg' || ext === '.html' || ext === '.htm' || ext === '.js') {
            throw new common_1.BadRequestException('Executable or SVG file uploads are disabled for security.');
        }
        const SAFE_MIME_RE = /^(image\/(jpeg|jpg|png|webp|heic|heif)|video\/(mp4|webm|quicktime|x-matroska|x-m4v|3gpp)|audio\/(webm|mp4|mpeg|mp3|ogg|opus|wav|wave|x-wav|aac|m4a|x-m4a))$/;
        const SAFE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.mp4', '.webm', '.mov', '.mkv', '.m4v', '.3gp', '.mp3', '.m4a', '.wav', '.ogg', '.aac', '.opus'];
        if (SAFE_MIME_RE.test(baseMime))
            return baseMime;
        if ((baseMime === 'application/octet-stream' || !baseMime) && SAFE_EXTS.includes(ext)) {
            return ext === '.mp3' ? 'audio/mpeg' : ext === '.m4a' ? 'audio/mp4' : ext === '.wav' ? 'audio/wav' : ext === '.mp4' ? 'video/mp4' : ext === '.png' ? 'image/png' : 'image/jpeg';
        }
        throw new common_1.BadRequestException('Unsupported media type for upload.');
    }
    inferExtension(filenameOrOriginal, mimetype) {
        const rawExt = path.extname(filenameOrOriginal || '').toLowerCase();
        const valid = [
            '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
            '.mp4', '.webm', '.mov', '.mkv', '.m4v', '.3gp',
            '.mp3', '.m4a', '.wav', '.ogg', '.aac', '.opus',
        ];
        if (rawExt && valid.includes(rawExt))
            return rawExt;
        const mime = (mimetype || '').toLowerCase();
        if (mime.includes('png'))
            return '.png';
        if (mime.includes('webp'))
            return '.webp';
        if (mime.includes('heic'))
            return '.heic';
        if (mime.includes('heif'))
            return '.heif';
        if (mime.includes('webm'))
            return '.webm';
        if (mime.includes('mpeg') || mime.includes('mp3'))
            return '.mp3';
        if (mime.includes('m4a') || mime.includes('audio/mp4'))
            return '.m4a';
        if (mime.includes('ogg') || mime.includes('opus'))
            return '.ogg';
        if (mime.includes('wav'))
            return '.wav';
        if (mime.includes('aac'))
            return '.aac';
        if (mime.includes('quicktime'))
            return '.mov';
        if (mime.includes('matroska'))
            return '.mkv';
        if (mime.includes('m4v'))
            return '.m4v';
        if (mime.includes('3gpp'))
            return '.3gp';
        if (mime.startsWith('audio/'))
            return '.webm';
        if (mime.startsWith('video/'))
            return '.mp4';
        return '.jpg';
    }
    async create(user, file) {
        let buffer;
        let tempFilePath;
        if (file.buffer) {
            buffer = file.buffer;
        }
        else if (file.path && fs.existsSync(file.path)) {
            tempFilePath = path.resolve(file.path);
            buffer = fs.readFileSync(tempFilePath);
        }
        else {
            const localPath = path.resolve(process.cwd(), 'uploads', file.filename || '');
            if (fs.existsSync(localPath)) {
                tempFilePath = localPath;
                buffer = fs.readFileSync(localPath);
            }
            else {
                buffer = Buffer.from([]);
            }
        }
        if (!buffer.length) {
            throw new common_1.BadRequestException('Uploaded file is empty.');
        }
        const safeMime = this.assertSafeMediaMime(file.mimetype, file.originalname || file.filename);
        const ext = this.inferExtension(file.originalname || file.filename, safeMime);
        const cleanFilename = `${(0, crypto_1.randomUUID)()}${ext}`;
        const targetLocalPath = path.resolve(process.cwd(), 'uploads', 'crops', cleanFilename);
        const resolvedMime = safeMime;
        const { fileUrl, provider } = await this.uploadToActiveStorage(buffer, cleanFilename, resolvedMime, 'crops');
        if (tempFilePath && tempFilePath !== targetLocalPath) {
            try {
                fs.unlinkSync(tempFilePath);
            }
            catch {
            }
        }
        const record = await this.prisma.upload.create({
            data: {
                uploadedById: user.id,
                fileUrl,
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
    async createFromBase64(user, dataUri, customFilename, folder = 'crops') {
        const trimmed = (dataUri || '').trim();
        if (!trimmed || /^(blob:|https?:|file:|content:|ph:|\/uploads\/)/i.test(trimmed)) {
            throw new common_1.BadRequestException('Invalid base64 data URI. Expected data:<mime>;base64,...');
        }
        const match = trimmed.match(/^data:([^;]+);base64,(.+)$/);
        let mimetype = 'image/jpeg';
        let base64Content = trimmed;
        if (match) {
            mimetype = match[1];
            base64Content = match[2];
        }
        else if (trimmed.startsWith('data:')) {
            const commaIdx = trimmed.indexOf(',');
            if (commaIdx !== -1) {
                base64Content = trimmed.slice(commaIdx + 1);
            }
        }
        const buffer = Buffer.from(base64Content, 'base64');
        if (!buffer.length) {
            throw new common_1.BadRequestException('Decoded base64 file content is empty.');
        }
        const safeFolder = this.sanitizeUploadFolder(folder);
        mimetype = this.assertSafeMediaMime(mimetype, customFilename);
        const ext = this.inferExtension(customFilename, mimetype);
        const filename = `${(0, crypto_1.randomUUID)()}${ext}`;
        const { fileUrl, provider } = await this.uploadToActiveStorage(buffer, filename, mimetype, safeFolder);
        const record = await this.prisma.upload.create({
            data: {
                uploadedById: user.id,
                fileUrl,
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
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = UploadsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_settings_service_1.AppSettingsService])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map