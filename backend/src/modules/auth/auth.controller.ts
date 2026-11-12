import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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
  CompleteOtpRegistrationDto,
  SendMobileOtpDto,
  VerifyMobileOtpDto,
} from './dto/otp.dto';
import { PartnerApplyDto } from './dto/partner-apply.dto';
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

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('send-otp')
  sendWhatsAppOtp(@Body() body: SendWhatsAppOtpDto) {
    return this.authService.sendWhatsAppOtp(body.mobile, body.otp);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('send-register-otp')
  sendRegisterOtp(@Body() body: SendMobileOtpDto) {
    return this.authService.sendRegisterOtp(body.mobile);
  }

  private extractClientMeta(req?: any): { ipAddress?: string; userAgent?: string } {
    if (!req) return {};
    const forwarded = req.headers?.['x-forwarded-for'];
    const rawIp = Array.isArray(forwarded)
      ? forwarded[0]
      : typeof forwarded === 'string'
        ? forwarded.split(',')[0]
        : req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress;
    const ipAddress = rawIp ? String(rawIp).trim().slice(0, 64) : undefined;
    const rawUa = req.headers?.['user-agent'];
    const userAgent = rawUa ? String(rawUa).trim().slice(0, 255) : undefined;
    return { ipAddress, userAgent };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify-register-otp')
  verifyRegisterOtp(@Body() body: VerifyMobileOtpDto, @Req() req: any) {
    return this.authService.verifyRegisterOtp(body.mobile, body.otp, this.extractClientMeta(req));
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('party-otp/send')
  sendPartyOtp(@CurrentUser() user: AuthUser, @Body() body: SendMobileOtpDto) {
    return this.authService.sendPartyOtp(user.id, body.mobile);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('party-otp/verify')
  verifyPartyOtp(@CurrentUser() user: AuthUser, @Body() body: VerifyMobileOtpDto) {
    return this.authService.verifyPartyOtp(user.id, body.mobile, body.otp);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('partner-otp/send')
  sendPartnerSignupOtp(@Body() body: SendMobileOtpDto) {
    return this.authService.sendPartnerSignupOtp(body.mobile);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('partner-otp/verify')
  verifyPartnerSignupOtp(@Body() body: VerifyMobileOtpDto, @Req() req: any) {
    return this.authService.verifyPartnerSignupOtp(body.mobile, body.otp, this.extractClientMeta(req));
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @Post('partner-apply')
  applyForPartnerRole(@Body() dto: PartnerApplyDto) {
    return this.authService.applyForPartnerRole(dto);
  }

  @Throttle({ default: { limit: 25, ttl: 60_000 } })
  @Post('partner-upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadPartnerKycDocument(
    @Headers('x-partner-upload-token') partnerUploadToken: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('Please select an image file to upload.');
    }
    return this.authService.uploadPartnerKycDocument(partnerUploadToken, file);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('send-login-otp')
  sendLoginOtp(@Body() body: SendLoginOtpDto) {
    return this.authService.sendLoginOtp(body.mobile, body.portal);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify-login-otp')
  verifyLoginOtp(@Body() body: VerifyLoginOtpDto, @Req() req: any) {
    return this.authService.verifyLoginOtp(body.mobile, body.otp, body.portal, this.extractClientMeta(req));
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('complete-otp-registration')
  completeOtpRegistration(@Body() body: CompleteOtpRegistrationDto) {
    return this.authService.completeOtpRegistration(body);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
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
  firebaseLogin(@Body() body: FirebaseLoginDto, @Req() req: any) {
    return this.authService.firebaseLogin(body.idToken, body.portal, this.extractClientMeta(req));
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
  @Post('send-email-verification')
  sendEmailVerification(
    @CurrentUser() user: AuthUser,
    @Body() body: { email: string; origin?: string },
    @Headers('origin') headerOrigin?: string,
  ) {
    return this.authService.sendEmailVerificationLink(user.id, body.email, body.origin || headerOrigin);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmailToken(body.token);
  }

  @Get('verify-email')
  verifyEmailGet(@Query('token') token: string) {
    return this.authService.verifyEmailToken(token);
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
  @Post('logout')
  logout(@CurrentUser() user: AuthUser & { sessionId?: string }) {
    return this.authService.logout(user.id, user.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout-other-sessions')
  logoutOtherSessions(@CurrentUser() user: AuthUser & { sessionId?: string }) {
    return this.authService.logoutOtherSessions(user.id, user.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify-password')
  verifyPassword(
    @CurrentUser() user: AuthUser,
    @Body() body: { password?: string },
  ) {
    return this.authService.verifyPassword(user.id, body?.password ?? '');
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
