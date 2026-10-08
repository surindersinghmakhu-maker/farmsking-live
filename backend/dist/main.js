"use strict";
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
    const host = configService.get('HOST', '0.0.0.0');
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