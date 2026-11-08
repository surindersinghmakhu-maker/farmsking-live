import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { UserSessionService } from './user-session.service';
interface JwtPayload {
    sub: string;
    role: string;
    sid?: string;
}
declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    private readonly userSessionService;
    constructor(configService: ConfigService, prisma: PrismaService, userSessionService: UserSessionService);
    validate(payload: JwtPayload): Promise<AuthUser>;
}
export {};
