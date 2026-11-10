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
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.mp4', '.webm', '.mov'];
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
        if (!body?.dataUri) {
            throw new common_1.BadRequestException('No dataUri provided for Media Store upload.');
        }
        return this.mediaStoreService.uploadBase64(user, body.dataUri, body.cropId, body.mediaType, body.filename);
    }
    async getCropMedia(cropId) {
        return this.mediaStoreService.getMediaForCrop(cropId);
    }
    async listAll(cropId, mediaType, provider, limit) {
        const limitNum = limit ? parseInt(limit, 10) : 50;
        return this.mediaStoreService.listAll(cropId, mediaType, provider, limitNum);
    }
    async archiveCropMedia(cropId, retentionDays) {
        return this.mediaStoreService.archiveCropMedia(cropId, retentionDays || 30);
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
                const rawExt = (0, path_1.extname)(file.originalname).toLowerCase();
                const ext = VALID_EXTENSIONS.includes(rawExt) ? rawExt : '.jpg';
                callback(null, `${(0, crypto_1.randomUUID)()}${ext}`);
            },
        }),
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: (_req, file, callback) => {
            if (!ALLOWED_MIME_TYPES.includes(file.mimetype) &&
                !file.mimetype?.startsWith('image/') &&
                !file.mimetype?.startsWith('video/')) {
                callback(new common_1.BadRequestException('Only image and video files are supported.'), false);
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
    __param(0, (0, common_1.Param)('cropId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MediaStoreController.prototype, "getCropMedia", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('cropId')),
    __param(1, (0, common_1.Query)('mediaType')),
    __param(2, (0, common_1.Query)('provider')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], MediaStoreController.prototype, "listAll", null);
__decorate([
    (0, common_1.Post)('archive/:cropId'),
    __param(0, (0, common_1.Param)('cropId')),
    __param(1, (0, common_1.Body)('retentionDays')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
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