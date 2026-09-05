import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordStartDto } from './dto/forgot-password-start.dto';
import { ForgotPasswordVerifyDto } from './dto/forgot-password-verify.dto';
import { ForgotPasswordResetDto } from './dto/forgot-password-reset.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('send-otp')
  sendWhatsAppOtp(@Body() body: { mobile: string; otp: string }) {
    return this.authService.sendWhatsAppOtp(body.mobile, body.otp);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
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
}
