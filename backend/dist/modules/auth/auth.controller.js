"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const register_dto_1 = require("./dto/register.dto");
const register_trader_dto_1 = require("./dto/register-trader.dto");
const login_dto_1 = require("./dto/login.dto");
const google_login_dto_1 = require("./dto/google-login.dto");
const firebase_login_dto_1 = require("./dto/firebase-login.dto");
const link_google_dto_1 = require("./dto/link-google.dto");
const otp_dto_1 = require("./dto/otp.dto");
const partner_apply_dto_1 = require("./dto/partner-apply.dto");
const forgot_password_start_dto_1 = require("./dto/forgot-password-start.dto");
const forgot_password_verify_dto_1 = require("./dto/forgot-password-verify.dto");
const forgot_password_reset_dto_1 = require("./dto/forgot-password-reset.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    sendWhatsAppOtp(body) {
        return this.authService.sendWhatsAppOtp(body.mobile, body.otp);
    }
    sendRegisterOtp(body) {
        return this.authService.sendRegisterOtp(body.mobile);
    }
    extractClientMeta(req) {
        if (!req)
            return {};
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
    verifyRegisterOtp(body, req) {
        return this.authService.verifyRegisterOtp(body.mobile, body.otp, this.extractClientMeta(req));
    }
    sendPartyOtp(user, body) {
        return this.authService.sendPartyOtp(user.id, body.mobile);
    }
    verifyPartyOtp(user, body) {
        return this.authService.verifyPartyOtp(user.id, body.mobile, body.otp);
    }
    sendPartnerSignupOtp(body) {
        return this.authService.sendPartnerSignupOtp(body.mobile);
    }
    verifyPartnerSignupOtp(body, req) {
        return this.authService.verifyPartnerSignupOtp(body.mobile, body.otp, this.extractClientMeta(req));
    }
    applyForPartnerRole(dto) {
        return this.authService.applyForPartnerRole(dto);
    }
    uploadPartnerKycDocument(partnerUploadToken, file) {
        if (!file) {
            throw new common_1.BadRequestException('Please select an image file to upload.');
        }
        return this.authService.uploadPartnerKycDocument(partnerUploadToken, file);
    }
    sendLoginOtp(body) {
        return this.authService.sendLoginOtp(body.mobile, body.portal);
    }
    verifyLoginOtp(body, req) {
        return this.authService.verifyLoginOtp(body.mobile, body.otp, body.portal, this.extractClientMeta(req));
    }
    completeOtpRegistration(body) {
        return this.authService.completeOtpRegistration(body);
    }
    sendEmailOtp(body) {
        return this.authService.sendEmailOtp(body.email, body.otp);
    }
    googleLogin(dto) {
        return this.authService.googleLogin(dto);
    }
    firebaseLogin(body, req) {
        return this.authService.firebaseLogin(body.idToken, body.portal, this.extractClientMeta(req));
    }
    linkGoogleAccount(user, dto) {
        return this.authService.linkGoogleAccount(user, dto);
    }
    unlinkGoogleAccount(user) {
        return this.authService.unlinkGoogleAccount(user);
    }
    sendEmailVerification(user, body, headerOrigin) {
        return this.authService.sendEmailVerificationLink(user.id, body.email, body.origin || headerOrigin);
    }
    verifyEmail(body) {
        return this.authService.verifyEmailToken(body.token);
    }
    verifyEmailGet(token) {
        return this.authService.verifyEmailToken(token);
    }
    sendMobileLinkOtp(user, body) {
        return this.authService.sendMobileLinkOtp(user, body.mobile);
    }
    register(dto) {
        return this.authService.register(dto);
    }
    registerTrader(dto) {
        return this.authService.registerTrader(dto);
    }
    login(dto) {
        return this.authService.login(dto);
    }
    logout(user) {
        return this.authService.logout(user.id, user.sessionId);
    }
    logoutOtherSessions(user) {
        return this.authService.logoutOtherSessions(user.id, user.sessionId);
    }
    verifyPassword(user, body) {
        return this.authService.verifyPassword(user.id, body?.password ?? '');
    }
    forgotPasswordStart(dto) {
        return this.authService.forgotPasswordStart(dto);
    }
    forgotPasswordVerify(dto) {
        return this.authService.forgotPasswordVerify(dto);
    }
    forgotPasswordReset(dto) {
        return this.authService.forgotPasswordReset(dto);
    }
    firebaseForgotPasswordReset(body) {
        return this.authService.firebaseForgotPasswordReset(body.idToken, body.newPassword);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 60_000 } }),
    (0, common_1.Post)('send-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_dto_1.SendWhatsAppOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendWhatsAppOtp", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('send-register-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_dto_1.SendMobileOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendRegisterOtp", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('verify-register-otp'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_dto_1.VerifyMobileOtpDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyRegisterOtp", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('party-otp/send'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, otp_dto_1.SendMobileOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendPartyOtp", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('party-otp/verify'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, otp_dto_1.VerifyMobileOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyPartyOtp", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('partner-otp/send'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_dto_1.SendMobileOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendPartnerSignupOtp", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('partner-otp/verify'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_dto_1.VerifyMobileOtpDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyPartnerSignupOtp", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.Post)('partner-apply'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [partner_apply_dto_1.PartnerApplyDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "applyForPartnerRole", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 25, ttl: 60_000 } }),
    (0, common_1.Post)('partner-upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Headers)('x-partner-upload-token')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "uploadPartnerKycDocument", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('send-login-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_dto_1.SendLoginOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendLoginOtp", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('verify-login-otp'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_dto_1.VerifyLoginOtpDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyLoginOtp", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('complete-otp-registration'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_dto_1.CompleteOtpRegistrationDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "completeOtpRegistration", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 60_000 } }),
    (0, common_1.Post)('send-email-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_dto_1.SendEmailOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendEmailOtp", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 100, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('google-login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [google_login_dto_1.GoogleLoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "googleLogin", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('firebase-login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [firebase_login_dto_1.FirebaseLoginDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "firebaseLogin", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('link-google'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, link_google_dto_1.LinkGoogleDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "linkGoogleAccount", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('unlink-google'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "unlinkGoogleAccount", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('send-email-verification'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('origin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendEmailVerification", null);
__decorate([
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('verify-email'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Get)('verify-email'),
    __param(0, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyEmailGet", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('send-mobile-link-otp'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, otp_dto_1.SendMobileLinkOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendMobileLinkOtp", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 1000, ttl: 60_000 } }),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'Register or upgrade as Trader / Shopkeeper',
        description: 'Creates a new trader account or upgrades an existing guest account with TRADER and CUSTOMER roles, generating a King ID and auto-linking all farmer ledger records matching the mobile number.',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Trader account successfully registered or upgraded with JWT token and King ID.',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Validation failed on mobile number or password length.',
    }),
    (0, throttler_1.Throttle)({ default: { limit: 1000, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('register-trader'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_trader_dto_1.RegisterTraderDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "registerTrader", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 1000, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('logout'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('logout-other-sessions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logoutOtherSessions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('verify-password'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyPassword", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('forgot-password/start'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_start_dto_1.ForgotPasswordStartDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "forgotPasswordStart", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('forgot-password/verify'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_verify_dto_1.ForgotPasswordVerifyDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "forgotPasswordVerify", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('forgot-password/reset'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_reset_dto_1.ForgotPasswordResetDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "forgotPasswordReset", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('forgot-password/firebase-reset'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "firebaseForgotPasswordReset", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map