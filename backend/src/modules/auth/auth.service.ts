import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const SAFE_USER_SELECT = {
  id: true,
  mobile: true,
  role: true,
  name: true,
  email: true,
  village: true,
  district: true,
  state: true,
  preferredLanguage: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { mobile: dto.mobile } });
    if (existing) {
      throw new ConflictException('An account with this mobile number already exists.');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        mobile: dto.mobile,
        passwordHash,
        name: dto.name,
        village: dto.village,
        district: dto.district,
        state: dto.state,
        preferredLanguage: dto.preferredLanguage ?? 'en',
        role: Role.FARMER,
      },
      select: SAFE_USER_SELECT,
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { mobile: dto.mobile, deletedAt: null },
    });

    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid mobile number or password.');
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;
    return this.buildAuthResponse(safeUser);
  }

  private buildAuthResponse(user: { id: string; mobile: string; role: Role } & Record<string, unknown>) {
    const accessToken = this.jwtService.sign({ sub: user.id, role: user.role });
    return { accessToken, user };
  }
}
