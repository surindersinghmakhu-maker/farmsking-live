jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn(() => [{ name: '[DEFAULT]' }]),
  initializeApp: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn().mockRejectedValue(new Error('Mock token verification not configured')),
  })),
}));

import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { UserSessionService } from './user-session.service';
import { LabourService } from '../labour/labour.service';

describe('Auth OTP-Only Client/Worker & Security Regression Tests', () => {
  const createDeps = () => {
    const prisma: any = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      labourWorker: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
      notification: { create: jest.fn().mockResolvedValue({}) },
    };
    const jwtService: any = { sign: jest.fn().mockReturnValue('mock.jwt.token') };
    const whatsappBotService: any = {
      sendOtpMessage: jest.fn().mockResolvedValue({ success: true }),
      sendDirectTextMessage: jest.fn().mockResolvedValue({}),
    };
    const whatsappGroupSyncService: any = { autoAddNewUser: jest.fn().mockResolvedValue({}) };
    const appSettingsService: any = {};
    const walletService: any = { ensureWelcomeBonus: jest.fn().mockResolvedValue({}) };
    const userSessionService = new UserSessionService();
    const emailService: any = {};

    const service = new AuthService(
      prisma,
      jwtService,
      whatsappBotService,
      whatsappGroupSyncService,
      appSettingsService,
      walletService,
      userSessionService,
      emailService,
    );
    return { service, prisma, userSessionService };
  };

  it('blocks password login for FARMER, LABOUR, CUSTOMER, and SUPERVISOR roles', async () => {
    for (const role of [Role.FARMER, Role.LABOUR, Role.CUSTOMER, Role.SUPERVISOR]) {
      const { service, prisma } = createDeps();
      prisma.user.findFirst.mockResolvedValue({
        id: `u-${role}`,
        mobile: '9876543210',
        role,
        roles: [role],
        deactivatedRoles: [],
        passwordHash: 'hash',
        isPermanentlyBlocked: false,
        lockoutUntil: null,
      });

      await expect(
        service.login({ mobile: '9876543210', password: 'SomePassword123', portal: 'CLIENT' }),
      ).rejects.toThrow(ForbiddenException);
    }
  });

  it('allows pre-added LabourWorker without account to sign in with verified OTP, issuing a King ID and default CUSTOMER role', async () => {
    const { service, prisma } = createDeps();
    prisma.user.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prisma.labourWorker.findFirst.mockResolvedValue({
      id: 'lw-1',
      name: 'Raju Worker',
      mobile: '9811122233',
    });
    prisma.user.findUnique.mockResolvedValue(null); // for generateUniqueKingId uniqueness check
    prisma.user.create.mockResolvedValue({
      id: 'u-worker-1',
      kingId: '12345678',
      mobile: '9811122233',
      name: 'Raju Worker',
      role: Role.CUSTOMER,
      roles: [Role.CUSTOMER],
      deactivatedRoles: [],
      isPermanentlyBlocked: false,
      lockoutUntil: null,
      failedLoginAttempts: 0,
      isPhoneVerified: true,
    });
    prisma.user.update.mockImplementation(async ({ where, data }: any) => ({
      id: where.id,
      kingId: '12345678',
      mobile: '9811122233',
      name: 'Raju Worker',
      role: Role.CUSTOMER,
      roles: [Role.CUSTOMER],
      deactivatedRoles: [],
      ...data,
    }));
    prisma.labourWorker.updateMany.mockResolvedValue({ count: 1 });

    await service.sendLoginOtp('9811122233', 'CLIENT');
    const res = await service.verifyLoginOtp('9811122233', '123456', 'CLIENT');

    expect(res.isNewUser).toBe(false);
    expect((res as any).accessToken).toBe('mock.jwt.token');
    expect((res as any).user.kingId).toBe('12345678');
    expect((res as any).user.role).toBe(Role.CUSTOMER);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mobile: '9811122233',
          role: Role.CUSTOMER,
          roles: [Role.CUSTOMER],
          isPhoneVerified: true,
        }),
      }),
    );
  });

  it('rejects completeOtpRegistration without prior OTP verification or for existing accounts', async () => {
    const { service, prisma } = createDeps();

    await expect(
      service.completeOtpRegistration({
        mobile: '9988776655',
        role: 'FARMER',
        portal: 'CLIENT',
      }),
    ).rejects.toThrow(UnauthorizedException);

    // After verifying OTP for new number, reject if user already exists by the time completion runs
    prisma.user.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prisma.labourWorker.findFirst.mockResolvedValue(null);
    await service.sendLoginOtp('9988776655', 'CLIENT');
    const step2 = await service.verifyLoginOtp('9988776655', '123456', 'CLIENT');
    expect(step2.isNewUser).toBe(true);

    prisma.user.findFirst.mockResolvedValueOnce({ id: 'existing-user', mobile: '9988776655' });
    await expect(
      service.completeOtpRegistration({
        mobile: '9988776655',
        role: 'FARMER',
        portal: 'CLIENT',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects existing active mobile takeover on /auth/register', async () => {
    const { service, prisma } = createDeps();
    prisma.user.findFirst.mockResolvedValue({ id: 'victim-id', mobile: '9876543210' });

    await expect(
      service.register({
        mobile: '9876543210',
        password: 'attacker-password',
        name: 'Attacker',
      } as any),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects googleLogin when no valid idToken or accessToken is provided', async () => {
    const { service } = createDeps();
    await expect(
      service.googleLogin({
        email: 'victim@example.com',
        name: 'Spoofed',
      } as any),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('enforces max-2 session eviction without resurrecting revoked session ids', () => {
    const sessionSvc = new UserSessionService();
    const s1 = sessionSvc.createSession('u-1', 'dev1');
    const s2 = sessionSvc.createSession('u-1', 'dev2');
    const s3 = sessionSvc.createSession('u-1', 'dev3');

    expect(s3.evictedOldest).toBe(true);
    expect(sessionSvc.isValidSession('u-1', s1.sessionId)).toBe(false);
    expect(sessionSvc.isValidSession('u-1', s2.sessionId)).toBe(true);
    expect(sessionSvc.isValidSession('u-1', s3.sessionId)).toBe(true);

    sessionSvc.logoutSession('u-1', s2.sessionId);
    expect(sessionSvc.isValidSession('u-1', s2.sessionId)).toBe(false);
  });

  it('does not create any User account or King ID when Farmer adds a LabourWorker', async () => {
    const prisma: any = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
      },
      labourWorker: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'lw-new',
          farmerId: 'farmer-1',
          userId: null,
          name: 'Sohan Worker',
          mobile: '9811122244',
        }),
      },
    };
    const labourService = new LabourService(prisma);
    const created = await labourService.createWorker(
      { id: 'farmer-1', role: Role.FARMER, roles: [Role.FARMER, Role.CUSTOMER], deactivatedRoles: [] } as any,
      { name: 'Sohan Worker', mobile: '9811122244' } as any,
    );

    expect(created.userId).toBeNull();
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('requires mobile OTP verification after Gmail signup and activates verified mobile via sendMobileLinkOtp + verifyMobileLinkOtp', async () => {
    const { service, prisma } = createDeps();
    (service as any).emailService = {
      sendEmailLinkedNotification: jest.fn().mockResolvedValue({}),
      sendMobileUpdatedEmailNotification: jest.fn().mockResolvedValue({}),
      sendEmailDisconnectedNotification: jest.fn().mockResolvedValue({}),
    };

    // Mock Google userinfo fetch
    const origFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        email: 'kisan.gmail@gmail.com',
        email_verified: true,
        name: 'Kisan Gmail',
        sub: 'google-sub-123',
      }),
    }) as any;

    try {
      prisma.user.findFirst.mockResolvedValueOnce(null);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u-google-1',
        kingId: '10009911',
        email: 'kisan.gmail@gmail.com',
        googleId: 'google-sub-123',
        name: 'Kisan Gmail',
        mobile: 'G_9988776655',
        role: Role.CUSTOMER,
        roles: [Role.CUSTOMER],
        deactivatedRoles: [],
        isPhoneVerified: false,
        isEmailVerified: true,
      });

      const gRes = await service.googleLogin({ accessToken: 'valid-google-token', portal: 'CLIENT' });
      expect(gRes.requiresMobileVerification).toBe(true);
      expect(gRes.user.isPhoneVerified).toBe(false);

      // Step 2: Send & verify mobile OTP
      prisma.user.findFirst.mockResolvedValue(null);
      const otpSend = await service.sendMobileLinkOtp({ id: 'u-google-1', mobile: 'G_9988776655' } as any, '9876543211');
      expect(otpSend.success).toBe(true);

      prisma.user.update.mockResolvedValue({
        id: 'u-google-1',
        kingId: '10009911',
        email: 'kisan.gmail@gmail.com',
        name: 'Kisan Gmail',
        mobile: '9876543211',
        role: Role.CUSTOMER,
        roles: [Role.CUSTOMER],
        isPhoneVerified: true,
        isEmailVerified: true,
      });

      const linkRes = await service.verifyMobileLinkOtp(
        { id: 'u-google-1', mobile: 'G_9988776655' } as any,
        { mobile: '9876543211', otp: otpSend.devOtp! },
      );
      expect(linkRes.success).toBe(true);
      expect(linkRes.user.mobile).toBe('9876543211');
      expect(linkRes.user.isPhoneVerified).toBe(true);
    } finally {
      global.fetch = origFetch;
    }
  });
});

