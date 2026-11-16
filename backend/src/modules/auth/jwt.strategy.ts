import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';

import { UserSessionService } from './user-session.service';

interface JwtPayload {
  sub: string;
  role: string;
  sid?: string;
  iat?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly userSessionService: UserSessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: {
        id: true,
        mobile: true,
        role: true,
        roles: true,
        deactivatedRoles: true,
        name: true,
        kingId: true,
        isSeniorDoctor: true,
        employerFarmerId: true,
        supervisorPermissions: true,
        operatorPermissions: true,
        adminStaffPermissions: true,
        isPermanentlyBlocked: true,
        lockoutUntil: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.isPermanentlyBlocked || (user.lockoutUntil && new Date(user.lockoutUntil) > new Date())) {
      throw new UnauthorizedException('Your account is currently suspended or locked. Please contact Admin Support.');
    }

    const advisorRoles = [
      'ADVISOR',
      'FARM_ADVISOR',
      'GARDEN_ADVISOR',
      'AGRONOMIST',
      'DOCTOR',
      'GARDEN_EXPERT',
    ];
    const isAdvisor =
      advisorRoles.includes(user.role) ||
      (user.roles || []).some((r: any) => advisorRoles.includes(r)) ||
      Boolean((user as any).advisorType);

    const staffOrPartnerRoles = [
      'SELLER',
      'ADMIN',
      'SUPER_ADMIN',
      'SUPERVISOR',
      'LABOUR',
      'TRAINER',
      'TECHNICAL_TRAINER',
      'FIELD_OFFICER',
      'DELIVERY_PARTNER',
      'NURSERY_PARTNER',
      'OPERATOR',
      'MANAGER',
      'ACCOUNTANT',
    ];
    const isStaffOrPartner =
      !isAdvisor &&
      (staffOrPartnerRoles.includes(user.role) || (user.roles || []).some((r: any) => staffOrPartnerRoles.includes(r)));

    const isValid = this.userSessionService.isValidSession(user.id, payload.sid, payload.iat, isStaffOrPartner, isAdvisor);
    if (!isValid) {
      throw new UnauthorizedException(
        isStaffOrPartner
          ? 'Session Terminated: Staff/Partner session expired due to 120 minutes of inactivity. Please log in again.'
          : 'Session Terminated: Please log in again to continue.',
      );
    }

    if (payload.sid) {
      this.userSessionService.touchSession(user.id, payload.sid);
      (user as any).sessionId = payload.sid;
    } else {
      this.userSessionService.touchActivity(user.id);
    }

    return user as AuthUser;
  }
}
