import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

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
  const port = configService.get<number>('PORT', 3000);
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '');

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  app.setGlobalPrefix(apiPrefix);
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    maxAge: '7d',
    etag: true,
  });
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const host = configService.get<string>('HOST', '0.0.0.0');
  await app.listen(port, host);
}
bootstrap();
