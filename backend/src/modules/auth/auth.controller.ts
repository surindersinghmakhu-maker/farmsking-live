import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterTraderDto } from './dto/register-trader.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { FirebaseLoginDto } from './dto/firebase-login.dto';
import { LinkGoogleDto } from './dto/link-google.dto';
import {
  SendLoginOtpDto,
  VerifyLoginOtpDto,
  SendWhatsAppOtpDto,
  SendEmailOtpDto,
  SendMobileLinkOtpDto,
} from './dto/otp.dto';
import { ForgotPasswordStartDto } from './dto/forgot-password-start.dto';
import { ForgotPasswordVerifyDto } from './dto/forgot-password-verify.dto';
import { ForgotPasswordResetDto } from './dto/forgot-password-reset.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('send-otp')
  sendWhatsAppOtp(@Body() body: SendWhatsAppOtpDto) {
    return this.authService.sendWhatsAppOtp(body.mobile, body.otp);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('send-login-otp')
  sendLoginOtp(@Body() body: SendLoginOtpDto) {
    return this.authService.sendLoginOtp(body.mobile);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify-login-otp')
  verifyLoginOtp(@Body() body: VerifyLoginOtpDto) {
    return this.authService.verifyLoginOtp(body.mobile, body.otp);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('send-email-otp')
  sendEmailOtp(@Body() body: SendEmailOtpDto) {
    return this.authService.sendEmailOtp(body.email, body.otp);
  }

  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('google-login')
  googleLogin(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('firebase-login')
  firebaseLogin(@Body() body: FirebaseLoginDto) {
    return this.authService.firebaseLogin(body.idToken);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('link-google')
  linkGoogleAccount(
    @CurrentUser() user: AuthUser,
    @Body() dto: LinkGoogleDto,
  ) {
    return this.authService.linkGoogleAccount(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('unlink-google')
  unlinkGoogleAccount(@CurrentUser() user: AuthUser) {
    return this.authService.unlinkGoogleAccount(user);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('send-mobile-link-otp')
  sendMobileLinkOtp(@CurrentUser() user: AuthUser, @Body() body: SendMobileLinkOtpDto) {
    return this.authService.sendMobileLinkOtp(user, body.mobile);
  }

  // @UseGuards(JwtAuthGuard)
  // @HttpCode(HttpStatus.OK)
  // @Post('verify-mobile-link-otp')
  // verifyMobileLinkOtp(
  //   @CurrentUser() user: AuthUser,
  //   @Body() dto: { mobile: string; otp: string; password?: string },
  // ) {
  //   // return this.authService.verifyMobileLinkOtp(user, dto);
  // }

  // @UseGuards(JwtAuthGuard)
  // @HttpCode(HttpStatus.OK)
  // @Post('firebase-mobile-link')
  // firebaseMobileLink(
  //   @CurrentUser() user: AuthUser,
  //   @Body() body: { idToken: string; password?: string }
  // ) {
  //   // return this.authService.firebaseMobileLink(user, body);
  // }

  @Throttle({ default: { limit: 1000, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Stage 2: Trader / Shopkeeper Self-Registration & Upgrade.
   * Enables a guest statement viewer to convert into an authenticated TRADER + CUSTOMER account,
   * receiving an 8-digit King ID and aggregating all farmer billings.
   *
   * @param dto - Registration payload with mobile, password, name, and shop details
   * @returns Complete auth token and user profile
   */
  @ApiOperation({
    summary: 'Register or upgrade as Trader / Shopkeeper',
    description:
      'Creates a new trader account or upgrades an existing guest account with TRADER and CUSTOMER roles, generating a King ID and auto-linking all farmer ledger records matching the mobile number.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trader account successfully registered or upgraded with JWT token and King ID.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed on mobile number or password length.',
  })
  @Throttle({ default: { limit: 1000, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('register-trader')
  registerTrader(@Body() dto: RegisterTraderDto) {
    return this.authService.registerTrader(dto);
  }

  @Throttle({ default: { limit: 1000, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout-other-sessions')
  logoutOtherSessions(@CurrentUser() user: AuthUser & { sessionId?: string }) {
    return this.authService.logoutOtherSessions(user.id, user.sessionId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-password')
  verifyPassword(
    @CurrentUser() user: AuthUser | null,
    @Body() body: { password?: string; mobile?: string },
  ) {
    const identifier = user?.id || body?.mobile || '';
    return this.authService.verifyPassword(identifier, body.password ?? '');
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password/start')
  forgotPasswordStart(@Body() dto: ForgotPasswordStartDto) {
    return this.authService.forgotPasswordStart(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password/verify')
  forgotPasswordVerify(@Body() dto: ForgotPasswordVerifyDto) {
    return this.authService.forgotPasswordVerify(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password/reset')
  forgotPasswordReset(@Body() dto: ForgotPasswordResetDto) {
    return this.authService.forgotPasswordReset(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password/firebase-reset')
  firebaseForgotPasswordReset(@Body() body: { idToken: string; newPassword: string }) {
    return this.authService.firebaseForgotPasswordReset(body.idToken, body.newPassword);
  }
}
