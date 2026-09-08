import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './modules/prisma/prisma.service';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('setup-admin')
  async setupAdmin() {
    const mobile = '9872066901';
    const passwordHash = await argon2.hash('12345678');
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ mobile }, { role: Role.SUPER_ADMIN }] },
    });

    if (existing) {
      const currentRoles = existing.roles ?? [];
      const hasSuper = currentRoles.includes(Role.SUPER_ADMIN);
      const updated = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          mobile,
          passwordHash,
          role: Role.SUPER_ADMIN,
          roles: hasSuper ? currentRoles : [...currentRoles, Role.SUPER_ADMIN],
          deletedAt: null,
        },
      });
      return { success: true, action: 'updated', userId: updated.id, mobile: updated.mobile };
    }

    const created = await this.prisma.user.create({
      data: {
        kingId: '02101982',
        mobile,
        passwordHash,
        role: Role.SUPER_ADMIN,
        roles: [Role.SUPER_ADMIN, Role.CUSTOMER],
        name: 'FarmsKing Super Admin',
      },
    });
    return { success: true, action: 'created', userId: created.id, mobile: created.mobile };
  }
}
