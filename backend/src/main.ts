import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
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

  // Ensure Super Admin account 9872066901 is initialized on backend startup
  try {
    const prisma = app.get(PrismaService);
    const superAdminMobile = '9872066901';
    const passwordHash = await argon2.hash('12345678');
    const existing = await prisma.user.findUnique({ where: { mobile: superAdminMobile } });
    if (existing) {
      const currentRoles = existing.roles ?? [];
      const hasSuper = currentRoles.includes(Role.SUPER_ADMIN);
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          role: Role.SUPER_ADMIN,
          roles: hasSuper ? currentRoles : [...currentRoles, Role.SUPER_ADMIN],
          deletedAt: null,
        },
      });
      console.log('[Bootstrap] Super Admin 9872066901 initialized/updated.');
    } else {
      await prisma.user.create({
        data: {
          kingId: '02101982',
          mobile: superAdminMobile,
          passwordHash,
          role: Role.SUPER_ADMIN,
          roles: [Role.SUPER_ADMIN, Role.CUSTOMER],
          name: 'FarmsKing Super Admin',
        },
      });
      console.log('[Bootstrap] Super Admin 9872066901 created.');
    }
  } catch (err) {
    console.warn('[Bootstrap] Super Admin check warning:', err);
  }

  await app.listen(port, host);
}
bootstrap();
