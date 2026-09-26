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
      select: { id: true, mobile: true, role: true, roles: true, deactivatedRoles: true, name: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    if (payload.sid) {
      const isValid = this.userSessionService.isValidSession(user.id, payload.sid);
      if (!isValid) {
        throw new UnauthorizedException(
          '⚠️ Session Terminated: Your account was logged in on another device. Oldest session logged out automatically.',
        );
      }
      this.userSessionService.touchSession(user.id, payload.sid);
      (user as any).sessionId = payload.sid;
    }

    return user;
  }
}
