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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const app_module_1 = require("./app.module");
const prisma_service_1 = require("./modules/prisma/prisma.service");
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
process.on('uncaughtException', (err) => {
    if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
        console.warn(`[uncaughtException] Ignored transient connection error: ${err.code}`);
        return;
    }
    console.error('[uncaughtException] Unexpected error:', err);
    process.exit(1);
});
const express_1 = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const apiPrefix = configService.get('API_PREFIX', '/api/v1');
    const port = configService.get('PORT', 3000);
    const corsOrigins = configService.get('CORS_ORIGINS', '');
    app.use((0, express_1.json)({ limit: '50mb' }));
    app.use((0, express_1.urlencoded)({ limit: '50mb', extended: true }));
    app.setGlobalPrefix(apiPrefix);
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/uploads/',
        maxAge: '7d',
        etag: true,
    });
    app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
    app.use((0, compression_1.default)());
    app.enableCors({
        origin: true,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    const host = configService.get('HOST', '0.0.0.0');
    try {
        const prisma = app.get(prisma_service_1.PrismaService);
        const superAdminMobile = '9872066901';
        const passwordHash = await argon2.hash('12345678');
        const existing = await prisma.user.findUnique({ where: { mobile: superAdminMobile } });
        if (existing) {
            const currentRoles = existing.roles ?? [];
            const hasSuper = currentRoles.includes(client_1.Role.SUPER_ADMIN);
            await prisma.user.update({
                where: { id: existing.id },
                data: {
                    passwordHash,
                    role: client_1.Role.SUPER_ADMIN,
                    roles: hasSuper ? currentRoles : [...currentRoles, client_1.Role.SUPER_ADMIN],
                    deletedAt: null,
                },
            });
            console.log('[Bootstrap] Super Admin 9872066901 initialized/updated.');
        }
        else {
            await prisma.user.create({
                data: {
                    kingId: '02101982',
                    mobile: superAdminMobile,
                    passwordHash,
                    role: client_1.Role.SUPER_ADMIN,
                    roles: [client_1.Role.SUPER_ADMIN, client_1.Role.CUSTOMER],
                    name: 'FarmsKing Super Admin',
                },
            });
            console.log('[Bootstrap] Super Admin 9872066901 created.');
        }
    }
    catch (err) {
        console.warn('[Bootstrap] Super Admin check warning:', err);
    }
    await app.listen(port, host);
}
bootstrap();
//# sourceMappingURL=main.js.map