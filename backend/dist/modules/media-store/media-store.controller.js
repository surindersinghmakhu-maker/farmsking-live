"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaStoreController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const crypto_1 = require("crypto");
const path_1 = require("path");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const media_store_service_1 = require("./media-store.service");
const save_crop_remark_dto_1 = require("./dto/save-crop-remark.dto");
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
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const VALID_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
    '.mp4', '.webm', '.mov', '.mkv', '.m4v', '.3gp',
    '.mp3', '.m4a', '.wav', '.ogg', '.aac', '.opus',
];
function inferExtFromMime(mimetype) {
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
let MediaStoreController = class MediaStoreController {
    constructor(mediaStoreService) {
        this.mediaStoreService = mediaStoreService;
    }
    async uploadFile(user, file, cropId, mediaType) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided for Media Store upload.');
        }
        return this.mediaStoreService.uploadFile(user, file, cropId, mediaType);
    }
    async uploadBase64(user, body) {
        if (!body?.dataUri || typeof body.dataUri !== 'string') {
            throw new common_1.BadRequestException('No dataUri provided for Media Store upload.');
        }
        const trimmed = body.dataUri.trim();
        if (/^(blob:|https?:|file:|content:|ph:|\/uploads\/)/i.test(trimmed)) {
            throw new common_1.BadRequestException('Invalid base64 payload: URL/blob URIs must be uploaded as multipart files to /media-store/upload.');
        }
        return this.mediaStoreService.uploadBase64(user, trimmed, body.cropId, body.mediaType, body.filename);
    }
    async getCropMedia(user, cropId, scope) {
        return this.mediaStoreService.getMediaForCrop(user, cropId, scope === 'active' ? 'active' : 'all');
    }
    async getCropRemark(user, cropId) {
        return this.mediaStoreService.getCropRemark(user, cropId);
    }
    async saveCropRemark(user, cropId, body) {
        return this.mediaStoreService.saveCropRemark(user, cropId, body.remarksText || '');
    }
    async listAll(user, cropId, mediaType, provider, limit) {
        const limitNum = limit ? parseInt(limit, 10) : 50;
        return this.mediaStoreService.listAll(user, cropId, mediaType, provider, limitNum);
    }
    async archiveCropMedia(user, cropId, retentionDays) {
        return this.mediaStoreService.archiveCropMedia(user, cropId, retentionDays || 30);
    }
    async deleteMedia(user, id) {
        return this.mediaStoreService.deleteMedia(id, user);
    }
};
exports.MediaStoreController = MediaStoreController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (_req, file, callback) => {
                const rawExt = (0, path_1.extname)(file.originalname || '').toLowerCase();
                const ext = VALID_EXTENSIONS.includes(rawExt) ? rawExt : inferExtFromMime(file.mimetype);
                callback(null, `${(0, crypto_1.randomUUID)()}${ext}`);
            },
        }),
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: (_req, file, callback) => {
            const baseMime = (file.mimetype || '').split(';')[0].trim().toLowerCase();
            const rawExt = (0, path_1.extname)(file.originalname || '').toLowerCase();
            if (baseMime.includes('svg') ||
                baseMime.includes('html') ||
                baseMime.includes('javascript') ||
                rawExt === '.svg' ||
                rawExt === '.html' ||
                rawExt === '.htm' ||
                rawExt === '.js') {
                callback(new common_1.BadRequestException('SVG, HTML, and script files are disabled for security.'), false);
                return;
            }
            const isSafeOctet = baseMime === 'application/octet-stream' && VALID_EXTENSIONS.includes(rawExt);
            if (!isSafeOctet && !ALLOWED_MIME_TYPES.includes(baseMime)) {
                callback(new common_1.BadRequestException('Only image, video, and audio files are supported.'), false);
                return;
            }
            callback(null, true);
        },
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('cropId')),
    __param(3, (0, common_1.Body)('mediaType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], MediaStoreController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Post)('upload-base64'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MediaStoreController.prototype, "uploadBase64", null);
__decorate([
    (0, common_1.Get)('crop/:cropId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('cropId')),
    __param(2, (0, common_1.Query)('scope')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MediaStoreController.prototype, "getCropMedia", null);
__decorate([
    (0, common_1.Get)('crop/:cropId/remark'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('cropId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MediaStoreController.prototype, "getCropRemark", null);
__decorate([
    (0, common_1.Put)('crop/:cropId/remark'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('cropId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, save_crop_remark_dto_1.SaveCropRemarkDto]),
    __metadata("design:returntype", Promise)
], MediaStoreController.prototype, "saveCropRemark", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('cropId')),
    __param(2, (0, common_1.Query)('mediaType')),
    __param(3, (0, common_1.Query)('provider')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], MediaStoreController.prototype, "listAll", null);
__decorate([
    (0, common_1.Post)('archive/:cropId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('cropId')),
    __param(2, (0, common_1.Body)('retentionDays')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", Promise)
], MediaStoreController.prototype, "archiveCropMedia", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MediaStoreController.prototype, "deleteMedia", null);
exports.MediaStoreController = MediaStoreController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('media-store'),
    __metadata("design:paramtypes", [media_store_service_1.MediaStoreService])
], MediaStoreController);
//# sourceMappingURL=media-store.controller.js.map