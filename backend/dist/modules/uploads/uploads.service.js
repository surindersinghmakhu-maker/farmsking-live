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
        const localTargetDir = path.resolve(process.cwd(), 'uploads', folder);
        if (!fs.existsSync(localTargetDir))
            fs.mkdirSync(localTargetDir, { recursive: true });
        const localFilePath = path.join(localTargetDir, filename);
        fs.writeFileSync(localFilePath, buffer);
        const hostBaseUrl = (process.env.APP_URL || process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
        const fileUrl = `${hostBaseUrl}/uploads/${folder}/${filename}`;
        this.logger.log(`[Storage] Saved locally: ${fileUrl}`);
        return { fileUrl, provider: 'LOCAL' };
    }
    async create(user, file) {
        let buffer;
        if (file.buffer) {
            buffer = file.buffer;
        }
        else if (file.path && fs.existsSync(file.path)) {
            buffer = fs.readFileSync(file.path);
        }
        else {
            const localPath = path.resolve(process.cwd(), 'uploads', file.filename || '');
            if (fs.existsSync(localPath)) {
                buffer = fs.readFileSync(localPath);
            }
            else {
                buffer = Buffer.from([]);
            }
        }
        const ext = path.extname(file.originalname || file.filename || '').toLowerCase() || '.jpg';
        const cleanFilename = `${(0, crypto_1.randomUUID)()}${ext}`;
        const { fileUrl, provider } = await this.uploadToActiveStorage(buffer, cleanFilename, file.mimetype || 'image/jpeg', 'crops');
        const record = await this.prisma.upload.create({
            data: {
                uploadedById: user.id,
                fileUrl,
                mimeType: file.mimetype || 'image/jpeg',
                originalName: file.originalname || cleanFilename,
                sizeBytes: file.size || buffer.length,
            },
        });
        return {
            ...record,
            provider,
        };
    }
    async createFromBase64(user, dataUri, customFilename, folder = 'crops') {
        const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
        let mimetype = 'image/jpeg';
        let base64Content = dataUri;
        if (match) {
            mimetype = match[1];
            base64Content = match[2];
        }
        else if (dataUri.startsWith('data:')) {
            const commaIdx = dataUri.indexOf(',');
            if (commaIdx !== -1) {
                base64Content = dataUri.slice(commaIdx + 1);
            }
        }
        const buffer = Buffer.from(base64Content, 'base64');
        let ext = '.jpg';
        if (mimetype.includes('png'))
            ext = '.png';
        else if (mimetype.includes('webp'))
            ext = '.webp';
        else if (mimetype.includes('mp4'))
            ext = '.mp4';
        else if (mimetype.includes('webm'))
            ext = '.webm';
        const filename = customFilename || `${(0, crypto_1.randomUUID)()}${ext}`;
        const { fileUrl, provider } = await this.uploadToActiveStorage(buffer, filename, mimetype, folder);
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