import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { PrismaService } from './modules/prisma/prisma.service';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';

// A client disconnecting mid-request (common behind tunnels/proxies, or a mobile device losing
// signal) fires a raw socket 'error' event with no listener attached, which Node treats as an
// uncaught exception and crashes the whole process. Log and keep running instead of dying on it.
process.on('uncaughtException', (err: NodeJS.ErrnoException) => {
  if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
    // eslint-disable-next-line no-console
    console.warn(`[uncaughtException] Ignored transient connection error: ${err.code}`);
    return;
  }
  // eslint-disable-next-line no-console
  console.error('[uncaughtException] Unexpected error:', err);
  process.exit(1);
});

import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const apiPrefix = configService.get<string>('API_PREFIX', '/api/v1');
  const port = 3000; // Hardcode to 3000
  const host = '0.0.0.0'; // Revert back to 0.0.0.0 to fix NGINX connection refused
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '');

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  app.setGlobalPrefix(apiPrefix);
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    maxAge: '30d',
    immutable: true,
    etag: true,
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/api/uploads/',
    maxAge: '30d',
    immutable: true,
    etag: true,
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/api/v1/uploads/',
    maxAge: '30d',
    immutable: true,
    etag: true,
  });
  
  // Serve public HTML landing page at root route
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/',
  });

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression({ level: 6, threshold: 256 }));
  const allowedOrigins = corsOrigins === '*' ? true : (corsOrigins ? corsOrigins.split(',') : ['https://farmsking.in']);
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: false,
      skipMissingProperties: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );



  // Set up Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FarmsKing API')
    .setDescription('FarmsKing Backend API Documentation')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  Logger.log(`Attempting to start server on ${host}:${port}`, 'Bootstrap');
  
  // Start the server
  try {
    require('fs').writeFileSync('app-listen-before.txt', 'Before listen');
    await app.listen(port, host);
    require('fs').writeFileSync('app-listen-after.txt', 'After listen');
    Logger.log(`==========================================================`, 'Bootstrap');
    Logger.log(`🚀 FarmsKing API Server is running on: http://${host}:${port}`, 'Bootstrap');
  } catch (error) {
    require('fs').writeFileSync('app-listen-error.txt', error.toString());
    Logger.error(`Error starting server: ${error}`, 'Bootstrap');
  }
}
bootstrap();
