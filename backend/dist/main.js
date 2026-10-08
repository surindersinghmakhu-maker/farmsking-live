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
const swagger_1 = require("@nestjs/swagger");
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
    const port = parseInt(configService.get('PORT', '3000'), 10);
    const host = '127.0.0.1';
    const corsOrigins = configService.get('CORS_ORIGINS', '');
    app.use((0, express_1.json)({ limit: '50mb' }));
    app.use((0, express_1.urlencoded)({ limit: '50mb', extended: true }));
    app.setGlobalPrefix(apiPrefix);
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/uploads/',
        maxAge: '30d',
        immutable: true,
        etag: true,
    });
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/api/uploads/',
        maxAge: '30d',
        immutable: true,
        etag: true,
    });
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/api/v1/uploads/',
        maxAge: '30d',
        immutable: true,
        etag: true,
    });
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'public'), {
        prefix: '/',
    });
    app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
    app.use((0, compression_1.default)({ level: 6, threshold: 256 }));
    const allowedOrigins = corsOrigins === '*' ? true : (corsOrigins ? corsOrigins.split(',') : ['https://farmsking.in']);
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: false,
        skipMissingProperties: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    try {
        const prisma = app.get(prisma_service_1.PrismaService);
        const superAdminMobile = '9872066901';
        const superAdminPassword = configService.get('SUPER_ADMIN_PASSWORD');
        if (!superAdminPassword) {
            common_1.Logger.warn('WARNING: SUPER_ADMIN_PASSWORD is not set in .env! Using insecure fallback.', 'Bootstrap');
        }
        const passwordHash = await argon2.hash(superAdminPassword || '12345678');
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
            common_1.Logger.log('Super Admin 9872066901 initialized/updated.', 'Bootstrap');
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
            common_1.Logger.log('Super Admin 9872066901 created.', 'Bootstrap');
        }
    }
    catch (err) {
        common_1.Logger.warn(`Super Admin check warning: ${err}`, 'Bootstrap');
    }
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('FarmsKing API')
        .setDescription('FarmsKing Backend API Documentation')
        .setVersion('2.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    common_1.Logger.log(`Attempting to start server on ${host}:${port}`, 'Bootstrap');
    try {
        await app.listen(port, host);
        common_1.Logger.log(`==========================================================`, 'Bootstrap');
        common_1.Logger.log(`🚀 FarmsKing API Server is running on: http://${host}:${port}`, 'Bootstrap');
    }
    catch (error) {
        common_1.Logger.error(`Error starting server: ${error}`, 'Bootstrap');
    }
}
bootstrap();
//# sourceMappingURL=main.js.map