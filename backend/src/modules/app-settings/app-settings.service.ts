import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';

const SINGLETON_ID = 'default';

@Injectable()
export class AppSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const settings = await this.prisma.appSetting.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
    return settings;
  }

  /** Real contact details for the "Support"/"Contact Us" screens — pulled from the live Super Admin (or Admin) account. */
  async getSupportContact() {
    const admin = await this.prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN', deletedAt: null },
      select: { name: true, mobile: true, email: true },
      orderBy: { createdAt: 'asc' },
    });
    if (admin) return admin;

    return this.prisma.user.findFirst({
      where: { role: 'ADMIN', deletedAt: null },
      select: { name: true, mobile: true, email: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(admin: AuthUser, dto: UpdateAppSettingsDto) {
    const fields: Record<string, unknown> = {};
    const keys: (keyof UpdateAppSettingsDto)[] = ['appName', 'logoUrl', 'tagline', 'upiId', 'upiPayeeName'];
    for (const key of keys) {
      if (dto[key] !== undefined) fields[key] = dto[key];
    }

    return this.prisma.appSetting.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...fields, updatedById: admin.id },
      update: { ...fields, updatedById: admin.id },
    });
  }
}
