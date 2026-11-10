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
exports.UploadsController = void 0;
const crypto_1 = require("crypto");
const path_1 = require("path");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const uploads_service_1 = require("./uploads.service");
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'image/svg+xml',
    'image/x-png',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-matroska',
    'application/octet-stream',
];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.ico', '.svg', '.mp4', '.webm', '.mov'];
let UploadsController = class UploadsController {
    constructor(uploadsService) {
        this.uploadsService = uploadsService;
    }
    upload(user, file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded.');
        }
        return this.uploadsService.create(user, file);
    }
    uploadBase64(user, body) {
        if (!body?.dataUri) {
            throw new common_1.BadRequestException('No base64 data provided.');
        }
        return this.uploadsService.createFromBase64(user, body.dataUri, body.filename, body.folder);
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (_req, file, callback) => {
                const rawExt = (0, path_1.extname)(file.originalname).toLowerCase();
                let ext = VALID_EXTENSIONS.includes(rawExt) ? rawExt : '';
                if (!ext) {
                    if (file.mimetype === 'image/png')
                        ext = '.png';
                    else if (file.mimetype === 'image/webp')
                        ext = '.webp';
                    else if (file.mimetype === 'video/mp4')
                        ext = '.mp4';
                    else if (file.mimetype === 'video/webm')
                        ext = '.webm';
                    else if (file.mimetype === 'video/quicktime')
                        ext = '.mov';
                    else
                        ext = '.jpg';
                }
                callback(null, `${(0, crypto_1.randomUUID)()}${ext}`);
            },
        }),
        limits: { fileSize: MAX_FILE_SIZE_BYTES },
        fileFilter: (_req, file, callback) => {
            if (!ALLOWED_MIME_TYPES.includes(file.mimetype) &&
                !file.mimetype?.startsWith('image/') &&
                !file.mimetype?.startsWith('video/')) {
                callback(new common_1.BadRequestException('Only image and video files are allowed.'), false);
                return;
            }
            callback(null, true);
        },
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "upload", null);
__decorate([
    (0, common_1.Post)('base64'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "uploadBase64", null);
exports.UploadsController = UploadsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('uploads'),
    __metadata("design:paramtypes", [uploads_service_1.UploadsService])
], UploadsController);
//# sourceMappingURL=uploads.controller.js.map