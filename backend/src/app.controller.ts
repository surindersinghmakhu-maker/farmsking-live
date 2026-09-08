import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
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

  @Post('sync-users')
  async syncUsers(@Body() body: { users: any[] }) {
    if (!Array.isArray(body.users)) {
      throw new BadRequestException('users must be an array');
    }
    const results: any[] = [];
    for (const u of body.users) {
      if (!u.mobile || !u.passwordHash) continue;
      const cleanMobile = u.mobile.trim();
      const existing = await this.prisma.user.findFirst({ where: { mobile: cleanMobile } });

      const userData = {
        kingId: u.kingId ?? '00000000',
        mobile: cleanMobile,
        passwordHash: u.passwordHash,
        role: u.role ?? Role.CUSTOMER,
        roles: Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role ?? Role.CUSTOMER],
        deactivatedRoles: Array.isArray(u.deactivatedRoles) ? u.deactivatedRoles : [],
        name: u.name ?? 'User',
        email: u.email ?? null,
        village: u.village ?? null,
        district: u.district ?? null,
        state: u.state ?? null,
        pincode: u.pincode ?? null,
        postOffice: u.postOffice ?? null,
        sprayTankSizeL: u.sprayTankSizeL ?? null,
        soilType: u.soilType ?? null,
        waterType: u.waterType ?? null,
        preferredLanguage: u.preferredLanguage ?? 'en',
        advisorType: u.advisorType ?? null,
        operatorPermissions: Array.isArray(u.operatorPermissions) ? u.operatorPermissions : [],
        upiId: u.upiId ?? null,
        deletedAt: u.deletedAt ? new Date(u.deletedAt) : null,
      };

      if (existing) {
        const updated = await this.prisma.user.update({
          where: { id: existing.id },
          data: userData,
        });
        results.push({ mobile: cleanMobile, action: 'updated', id: updated.id });
      } else {
        const created = await this.prisma.user.create({
          data: userData,
        });
        results.push({ mobile: cleanMobile, action: 'created', id: created.id });
      }
    }
    return { success: true, count: results.length, details: results };
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
