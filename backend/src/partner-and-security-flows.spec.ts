jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn(() => [{ name: '[DEFAULT]' }]),
  initializeApp: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn().mockRejectedValue(new Error('Invalid Firebase test token')),
  })),
}));

import { BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PartnerApplicationStatus, Role, SellerType, VerifiedLeadStatus } from '@prisma/client';
import { AppSettingsService } from './modules/app-settings/app-settings.service';
import { AuthService } from './modules/auth/auth.service';
import { UserSessionService } from './modules/auth/user-session.service';
import { UsersService } from './modules/users/users.service';

describe('Partner Self-Signup, Server OTP & Mandatory Step-Up 2FA Security Suite', () => {
  describe('AppSettingsService Mandatory Step-Up 2FA', () => {
    it('rejects updateIntegrations & updateServiceConfig without a valid Step-Up 2FA OTP', async () => {
      const prismaMock: any = {
        appSetting: { findUnique: jest.fn().mockResolvedValue({ featureFlags: {} }), upsert: jest.fn().mockResolvedValue({}) },
        user: {
          findUnique: jest.fn().mockResolvedValue({ mobile: '9872066901', email: 'admin@farmsking.in' }),
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };
      const settingsService = new AppSettingsService(prismaMock);
      const adminCaller: any = { id: 'admin-1', role: Role.SUPER_ADMIN, roles: [Role.SUPER_ADMIN], deactivatedRoles: [] };

      // Previously (!stored && !provided) bypassed! Now strictly blocked:
      await expect(settingsService.updateIntegrations(adminCaller, {})).rejects.toThrow(BadRequestException);
      await expect(
        settingsService.updateServiceConfig(adminCaller, { serviceId: 'sms', activeProvider: 'MSG91', config: {} }),
      ).rejects.toThrow(BadRequestException);

      // Request OTP and succeed once valid 6-digit OTP is supplied
      const otpRes = await settingsService.requestAdminActionOtp(adminCaller);
      expect(otpRes.success).toBe(true);
      expect(otpRes.devOtp).toMatch(/^\d{6}$/);

      // Wrong OTP decrements attempts & fails
      await expect(
        settingsService.updateIntegrations(adminCaller, { adminConfirmationOtp: '000000' }),
      ).rejects.toThrow(BadRequestException);

      // Valid OTP succeeds cleanly (even when updateServiceConfig calls internal updateIntegrations logistics sync!)
      const syncRes = await settingsService.updateServiceConfig(adminCaller, {
        serviceId: 'logistics',
        activeProvider: 'DELHIVERY',
        config: { token: 'ok' },
        adminConfirmationOtp: otpRes.devOtp,
      });
      expect(syncRes.activeProviders.logistics).toBe('DELHIVERY');

      // OTP cannot be replayed after consumption
      await expect(
        settingsService.updateIntegrations(adminCaller, { adminConfirmationOtp: otpRes.devOtp }),
      ).rejects.toThrow(BadRequestException);
    });

    it('invalidates Step-Up 2FA OTP after 5 failed attempts', async () => {
      const prismaMock: any = { user: { findUnique: jest.fn().mockResolvedValue(null) } };
      const settingsService = new AppSettingsService(prismaMock);
      const adminCaller: any = { id: 'admin-2', role: Role.ADMIN, roles: [Role.ADMIN], deactivatedRoles: [] };

      const otpRes = await settingsService.requestAdminActionOtp(adminCaller);
      for (let i = 0; i < 5; i++) {
        await expect(Promise.resolve().then(() => settingsService.verifyAdminActionOtp('admin-2', '999999'))).rejects.toThrow(
          BadRequestException,
        );
      }
      // Even real OTP fails now because attempts were exhausted and code was invalidated
      await expect(
        Promise.resolve().then(() => settingsService.verifyAdminActionOtp('admin-2', otpRes.devOtp)),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Server-Side Register, Party & Delete-Account OTP Verification', () => {
    it('enforces server-side Register & Party OTP and never generates fake FK- King IDs', async () => {
      const prismaMock: any = {
        user: {
          findFirst: jest.fn().mockResolvedValue({ id: 'u-real', name: 'Harpreet', kingId: '10002026', mobile: '9876543210' }),
        },
        labourWorker: { findFirst: jest.fn().mockResolvedValue(null) },
      };
      const waMock: any = { sendOtpMessage: jest.fn().mockResolvedValue({ success: true }), sendDirectTextMessage: jest.fn().mockResolvedValue({}) };
      const authService = new AuthService(
        prismaMock,
        { sign: jest.fn().mockReturnValue('mock.jwt') } as any,
        waMock,
        { autoAddNewUser: jest.fn() } as any,
        {} as any,
        { ensureWelcomeBonus: jest.fn() } as any,
        new UserSessionService(),
        { sendEmailOtp: jest.fn() } as any,
      );

      // Register OTP flow
      const regOtp = await authService.sendRegisterOtp('9876543210');
      expect(regOtp.devOtp).toMatch(/^\d{4}$/);
      await expect(authService.verifyRegisterOtp('9876543210', '0000')).rejects.toThrow(BadRequestException);
      const regVerify = await authService.verifyRegisterOtp('9876543210', regOtp.devOtp!);
      expect(regVerify.verified).toBe(true);

      // Party OTP flow: returns real DB King ID when user exists, and null when unregistered
      const partyOtp1 = await authService.sendPartyOtp('caller-1', '9876543210');
      const partyVerifyExisting = await authService.verifyPartyOtp('caller-1', '9876543210', partyOtp1.devOtp!);
      expect(partyVerifyExisting.kingId).toBe('10002026');

      prismaMock.user.findFirst.mockResolvedValueOnce(null);
      const partyOtp2 = await authService.sendPartyOtp('caller-1', '9812345678');
      const partyVerifyUnreg = await authService.verifyPartyOtp('caller-1', '9812345678', partyOtp2.devOtp!);
      expect(partyVerifyUnreg.kingId).toBeNull();
    });

    it('requires server OTP or valid Firebase token for self-service deleteMe and Step-Up 2FA for deleteUserByAdmin', async () => {
      const dbUser = { id: 'u-1', name: 'Farmer A', mobile: '9876543210', farmMobile: null, email: null, kingId: '10001234' };
      const prismaMock: any = {
        user: {
          findUnique: jest.fn().mockResolvedValue({ ...dbUser, deletedAt: new Date() }),
          update: jest.fn().mockResolvedValue({}),
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
      };
      const settingsService = new AppSettingsService(prismaMock);
      const waMock: any = { sendOtpMessage: jest.fn().mockResolvedValue({ success: true }) };
      const usersService = new UsersService(
        prismaMock,
        { getBalance: jest.fn().mockResolvedValue(0) } as any,
        { autoRemoveUser: jest.fn().mockResolvedValue(null) } as any,
        { create: jest.fn() } as any,
        settingsService,
        waMock,
      );

      // Unverified deleteMe blocked!
      await expect(usersService.deleteMe({ id: 'u-1', role: Role.FARMER } as any)).rejects.toThrow(BadRequestException);

      // Server OTP flow for deleteMe succeeds
      const otpChallenge = await usersService.requestDeleteMeOtp({ id: 'u-1' } as any, '9876543210');
      await expect(usersService.deleteMe({ id: 'u-1' } as any, { otp: '000000' })).rejects.toThrow(BadRequestException);
      const delRes = await usersService.deleteMe({ id: 'u-1' } as any, { otp: otpChallenge.devOtp });
      expect(delRes.success).toBe(true);

      // Super Admin deleteUserByAdmin blocked without Step-Up 2FA OTP
      const superAdmin: any = { id: 'sa-1', role: Role.SUPER_ADMIN, roles: [Role.SUPER_ADMIN], deactivatedRoles: [] };
      await expect(usersService.deleteUserByAdmin(superAdmin, 'u-1')).rejects.toThrow(BadRequestException);

      const stepUp = await settingsService.requestAdminActionOtp(superAdmin);
      const adminDelRes = await usersService.deleteUserByAdmin(superAdmin, 'u-1', stepUp.devOtp);
      expect(adminDelRes.success).toBe(true);
    });
  });

  describe('Partner Self-Signup -> Pending -> Reject -> Edit/Resubmit -> Same-KingID Approval', () => {
    it('blocks unapproved Partner login, allows rejection editing, and merges approved Partner role onto existing Farmer keeping exact same King ID', async () => {
      let existingUserRecord: any = {
        id: 'farmer-1',
        kingId: '10005555',
        mobile: '9876500001',
        name: 'Gurpreet Farmer',
        role: Role.FARMER,
        roles: [Role.CUSTOMER, Role.FARMER],
        deactivatedRoles: [],
        passwordHash: 'OTP_ONLY_MANAGED',
        isPermanentlyBlocked: false,
        lockoutUntil: null,
        failedLoginAttempts: 0,
        isPhoneVerified: true,
      };
      let storedApp: any = null;
      const auditLogs: any[] = [];
      let couponCreatedForUserId: string | null = null;

      const prismaMock: any = {
        user: {
          findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
            if (where?.role?.in) return [{ id: 'admin-1' }];
            if (where?.email) return null;
            if (where?.id === existingUserRecord.id) return existingUserRecord;
            if (where?.OR?.some((c: any) => c.mobile === '9876500001' || c.mobile?.endsWith === '9876500001')) {
              return existingUserRecord;
            }
            return null;
          }),
          findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
            if (where?.id === existingUserRecord.id) return existingUserRecord;
            return null;
          }),
          update: jest.fn().mockImplementation(async ({ data }: any) => {
            existingUserRecord = { ...existingUserRecord, ...data };
            return existingUserRecord;
          }),
        },
        labourWorker: { findFirst: jest.fn().mockResolvedValue(null) },
        partnerApplication: {
          findFirst: jest.fn().mockImplementation(async () => storedApp),
          findUnique: jest.fn().mockImplementation(async ({ where }: any) => (storedApp?.id === where.id ? storedApp : null)),
          create: jest.fn().mockImplementation(async ({ data }: any) => {
            storedApp = { id: 'papp-1', resubmissionCount: 0, ...data, createdAt: new Date(), updatedAt: new Date() };
            return storedApp;
          }),
          update: jest.fn().mockImplementation(async ({ data }: any) => {
            storedApp = { ...storedApp, ...data, updatedAt: new Date() };
            return storedApp;
          }),
        },
        coupon: {
          findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
            if (where?.kind === 'PARTNER_REFERRAL') return couponCreatedForUserId ? { id: 'c1' } : null;
            return { id: 'inv-1' };
          }),
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockImplementation(async ({ data }: any) => {
            couponCreatedForUserId = data.businessPartnerId;
            return data;
          }),
        },
        couponSystemSetting: {
          upsert: jest.fn().mockResolvedValue({
            partnerCouponCommissionPercent: 5,
            partnerCouponDiscountPercent: 10,
            partnerCouponMaxDiscountCap: 500,
            partnerCouponMinOrderAmount: 1000,
          }),
        },
        notification: { create: jest.fn().mockResolvedValue({}), createMany: jest.fn().mockResolvedValue({ count: 1 }) },
        isoAuditLog: {
          create: jest.fn().mockImplementation(async ({ data }: any) => {
            auditLogs.push(data);
            return data;
          }),
        },
        $transaction: jest.fn().mockImplementation(async (fn) => fn(prismaMock)),
      };

      const settingsService = new AppSettingsService(prismaMock);
      const waMock: any = { sendOtpMessage: jest.fn().mockResolvedValue({ success: true }), sendDirectTextMessage: jest.fn().mockResolvedValue({}) };
      const authService = new AuthService(
        prismaMock,
        { sign: jest.fn().mockReturnValue('partner.jwt.token'), verify: jest.fn() } as any,
        waMock,
        { autoAddNewUser: jest.fn() } as any,
        settingsService,
        { ensureWelcomeBonus: jest.fn() } as any,
        new UserSessionService(),
        { sendEmailOtp: jest.fn() } as any,
      );
      const usersService = new UsersService(
        prismaMock,
        { getBalance: jest.fn().mockResolvedValue(0), ensureWelcomeBonus: jest.fn() } as any,
        { autoRemoveUser: jest.fn() } as any,
        { create: jest.fn().mockResolvedValue({}) } as any,
        settingsService,
        waMock,
      );

      // 1. Existing Farmer verifies mobile on Partner Signup
      const otp = await authService.sendPartnerSignupOtp('9876500001');
      const verify = await authService.verifyPartnerSignupOtp('9876500001', otp.devOtp!);
      expect(verify.existingUserSummary?.kingId).toBe('10005555');

      // 2. Farmer submits AGENT application with complete KYC docs
      const applyRes = await authService.applyForPartnerRole({
        mobile: '9876500001',
        requestedRole: 'AGENT',
        name: 'Gurpreet Farmer',
        password: 'PartnerPass@2026',
        pincode: '143422',
        panNumber: 'ABCDE1234F',
        panDocUrl: '/uploads/pan.jpg',
        aadhaarLast4: '4321',
        aadhaarDocUrl: '/uploads/aadhaar-front.jpg',
        bankAccountHolderName: 'Gurpreet Singh',
        bankAccountNumber: '123456789012',
        bankIfsc: 'SBIN0001234',
        chequeDocUrl: '/uploads/cheque.jpg',
        photoUrl: '/uploads/photo.jpg',
        termsAccepted: true,
      });
      expect(applyRes.status).toBe('PENDING');

      // 3. Before Admin approval, Partner Login MUST be blocked with PARTNER_APPLICATION_PENDING!
      await expect(
        authService.login({ mobile: '9876500001', password: 'PartnerPass@2026', portal: 'PARTNER' }),
      ).rejects.toMatchObject({ response: { code: 'PARTNER_APPLICATION_PENDING' } });

      // 4. Admin rejects with reason -> Rejected state exposes edit mode
      const adminCaller: any = { id: 'admin-1', name: 'Super Admin', role: Role.SUPER_ADMIN, roles: [Role.SUPER_ADMIN], deactivatedRoles: [] };
      await usersService.rejectPartnerApplication(adminCaller, storedApp.id, 'Please upload clearer PAN card photo.');
      expect(storedApp.status).toBe(PartnerApplicationStatus.REJECTED);

      // Applicant verifies OTP -> sees rejection reason and gets edit pre-fill
      await authService.sendLoginOtp('9876500001', 'PARTNER');
      await expect(authService.verifyLoginOtp('9876500001', '123456', 'PARTNER')).rejects.toMatchObject({
        response: { code: 'PARTNER_APPLICATION_REJECTED', rejectionReason: 'Please upload clearer PAN card photo.' },
      });

      // 5. Applicant edits & resubmits updated PAN doc
      await authService.applyForPartnerRole({
        mobile: '9876500001',
        requestedRole: 'AGENT',
        name: 'Gurpreet Farmer',
        pincode: '143422',
        panNumber: 'ABCDE1234F',
        panDocUrl: '/uploads/pan-hd.jpg',
        aadhaarLast4: '4321',
        aadhaarDocUrl: '/uploads/aadhaar-front.jpg',
        bankAccountHolderName: 'Gurpreet Singh',
        bankAccountNumber: '123456789012',
        bankIfsc: 'SBIN0001234',
        chequeDocUrl: '/uploads/cheque.jpg',
        photoUrl: '/uploads/photo.jpg',
        termsAccepted: true,
      });
      expect(storedApp.status).toBe(PartnerApplicationStatus.PENDING);
      expect(storedApp.resubmissionCount).toBe(1);

      // 6. Admin approves using mandatory Step-Up 2FA OTP
      await expect(usersService.approvePartnerApplication(adminCaller, storedApp.id)).rejects.toThrow(BadRequestException);
      const approveOtp = await settingsService.requestAdminActionOtp(adminCaller);
      const approveRes = await usersService.approvePartnerApplication(adminCaller, storedApp.id, approveOtp.devOtp);

      expect(approveRes.success).toBe(true);
      expect(approveRes.user.kingId).toBe('10005555'); // Exact SAME King ID preserved!
      expect(approveRes.user.roles).toContain(Role.FARMER);
      expect(approveRes.user.roles).toContain(Role.AGENT);
      expect(existingUserRecord.panDocUrl).toBe('/uploads/pan-hd.jpg');
      expect(couponCreatedForUserId).toBe('farmer-1');

      // 7. Partner login now succeeds seamlessly!
      const partnerSession = await authService.login({
        mobile: '9876500001',
        password: 'PartnerPass@2026',
        portal: 'PARTNER',
      });
      expect((partnerSession as any).accessToken).toBe('partner.jwt.token');
    });

    it('blocks Supervisor and Labour Worker from applying as Partner on same mobile number', async () => {
      const prismaMock: any = {
        user: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'sup-1',
            mobile: '9876500099',
            role: Role.SUPERVISOR,
            roles: [Role.SUPERVISOR, Role.CUSTOMER],
            deactivatedRoles: [],
            isPermanentlyBlocked: false,
          }),
        },
        partnerApplication: { findFirst: jest.fn().mockResolvedValue(null) },
      };
      const authService = new AuthService(
        prismaMock,
        { sign: jest.fn() } as any,
        { sendOtpMessage: jest.fn() } as any,
        {} as any,
        {} as any,
        {} as any,
        new UserSessionService(),
        {} as any,
      );

      await expect(authService.sendPartnerSignupOtp('9876500099')).rejects.toThrow(ConflictException);
    });
  });

  describe('First-Time Verified OTP Lead Tracking & Admin Account Continuation', () => {
    it('excludes unconfirmed sendLoginOtp requests, logs verified OTP leads, and supports Admin conversion to Farmer', async () => {
      const leadStore = new Map<string, any>();
      const usersStore = new Map<string, any>();

      const prismaMock: any = {
        user: {
          findFirst: jest.fn(async (args: any) => {
            const orList = args?.where?.OR || [];
            for (const u of usersStore.values()) {
              for (const cond of orList) {
                if (cond.mobile && u.mobile === cond.mobile) return u;
                if (cond.kingId && u.kingId === cond.kingId) return u;
              }
            }
            return null;
          }),
          findMany: jest.fn().mockResolvedValue([{ id: 'admin-1' }]),
          findUnique: jest.fn(async ({ where }: any) => {
            for (const u of usersStore.values()) {
              if (where?.kingId && u.kingId === where.kingId) return u;
              if (where?.id && u.id === where.id) return u;
            }
            return null;
          }),
          create: jest.fn(async ({ data }: any) => {
            const created = {
              id: `user-${usersStore.size + 1}`,
              ...data,
              createdAt: new Date(),
              deletedAt: null,
            };
            usersStore.set(created.id, created);
            return created;
          }),
        },
        farmerPlan: { upsert: jest.fn().mockResolvedValue({}) },
        gardenerPlan: { upsert: jest.fn().mockResolvedValue({}) },
        couponSystemSetting: {
          upsert: jest.fn().mockResolvedValue({
            inviteCouponCommissionPercent: 5,
            inviteCouponDiscountPercent: 5,
            inviteCouponValidityDays: 90,
            inviteCouponUsageLimit: 100,
          }),
        },
        coupon: {
          findFirst: jest.fn().mockResolvedValue(null),
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ code: 'SFK123' }),
          upsert: jest.fn().mockResolvedValue({ code: 'SFK123' }),
        },
        labourWorker: { findFirst: jest.fn().mockResolvedValue(null) },
        partnerApplication: { findFirst: jest.fn().mockResolvedValue(null) },
        notification: { create: jest.fn().mockResolvedValue({}), createMany: jest.fn().mockResolvedValue({ count: 1 }) },
        isoAuditLog: { create: jest.fn().mockResolvedValue({}) },
        verifiedSignupLead: {
          findUnique: jest.fn(async ({ where }: any) => {
            if (where?.id) {
              for (const l of leadStore.values()) if (l.id === where.id) return l;
              return null;
            }
            return leadStore.get(where?.mobile) || null;
          }),
          upsert: jest.fn(async ({ where, create, update }: any) => {
            const existing = leadStore.get(where.mobile);
            if (!existing) {
              const row = { id: `lead-${leadStore.size + 1}`, ...create };
              leadStore.set(where.mobile, row);
              return row;
            }
            const next = {
              ...existing,
              ...update,
              attemptCount: existing.attemptCount + 1,
            };
            leadStore.set(where.mobile, next);
            return next;
          }),
          updateMany: jest.fn(async ({ where, data }: any) => {
            let count = 0;
            for (const [m, row] of leadStore.entries()) {
              if (!where?.mobile || row.mobile === where.mobile) {
                leadStore.set(m, { ...row, ...data });
                count += 1;
              }
            }
            return { count };
          }),
          update: jest.fn(async ({ where, data }: any) => {
            for (const [m, row] of leadStore.entries()) {
              if (row.id === where.id) {
                const updated = {
                  ...row,
                  ...data,
                  convertedUser: usersStore.get(data.convertedUserId) || null,
                };
                leadStore.set(m, updated);
                return updated;
              }
            }
            return null;
          }),
        },
      };
      prismaMock.$transaction = jest.fn(async (cb: any) => cb(prismaMock));
      const waMock: any = {
        sendOtpMessage: jest.fn().mockResolvedValue({ success: true }),
        sendDirectTextMessage: jest.fn().mockResolvedValue({}),
      };
      const walletMock: any = { ensureWelcomeBonus: jest.fn().mockResolvedValue({}) };
      const authService = new AuthService(
        prismaMock,
        { sign: jest.fn().mockReturnValue('mock.jwt.token'), verify: jest.fn() } as any,
        waMock,
        { autoAddNewUser: jest.fn().mockResolvedValue({}) } as any,
        {} as any,
        walletMock,
        new UserSessionService(),
        { sendEmailOtp: jest.fn() } as any,
      );

      // 1. Sending OTP on a mistyped/unconfirmed mobile does NOT create any Admin lead record
      await authService.sendLoginOtp('9812340001', 'CLIENT');
      expect(leadStore.size).toBe(0);

      // 2. Confirming valid OTP on first-time mobile DOES log VerifiedSignupLead + telemetry
      const verify1 = await authService.verifyLoginOtp('9812340001', '123456', 'CLIENT', {
        ipAddress: '103.25.10.5',
        userAgent: 'Mozilla/5.0 Chrome/120.0 Windows',
      });
      expect(verify1.isNewUser).toBe(true);
      const createdLead = leadStore.get('9812340001');
      expect(createdLead).toBeDefined();
      expect(createdLead.status).toBe(VerifiedLeadStatus.OTP_CONFIRMED);
      expect(createdLead.attemptCount).toBe(1);
      expect(createdLead.sourceChannel).toBe('CLIENT_LOGIN_OTP');
      expect(createdLead.ipAddress).toBe('103.25.10.5');

      // Re-verifying OTP before registration increments attemptCount rather than duplicating
      await authService.verifyLoginOtp('9812340001', '123456', 'CLIENT', { ipAddress: '103.25.10.5' });
      expect(leadStore.get('9812340001').attemptCount).toBe(2);

      // 3. Completing self-signup transitions another OTP lead to COMPLETED_SELF
      await authService.verifyLoginOtp('9812340002', '123456', 'CLIENT');
      await authService.completeOtpRegistration({
        mobile: '9812340002',
        name: 'Baljinder Self',
        role: 'FARMER',
        portal: 'CLIENT',
      });
      expect(leadStore.get('9812340002').status).toBe(VerifiedLeadStatus.COMPLETED_SELF);

      // 4. Admin continues the dropped lead (9812340001) into an active FARMER account
      const usersService = new UsersService(
        prismaMock,
        walletMock,
        { autoAddNewUser: jest.fn().mockResolvedValue({}) } as any,
        { create: jest.fn().mockResolvedValue({}) } as any,
        undefined,
        waMock,
      );
      const adminCaller: any = {
        id: 'admin-1',
        name: 'Super Admin',
        role: Role.SUPER_ADMIN,
        roles: [Role.SUPER_ADMIN],
        deactivatedRoles: [],
      };

      const converted = await usersService.convertVerifiedLeadToUser(adminCaller, createdLead.id, {
        name: 'Kuldeep Singh',
        role: 'FARMER',
        pincode: '143422',
        district: 'Tarn Taran',
        state: 'Punjab',
        village: 'Goindwal Sahib',
        sprayTankSizeL: 20,
        adminNotes: 'Spoke on phone; active wheat & paddy grower.',
      });

      expect(converted.success).toBe(true);
      expect(converted.user.mobile).toBe('9812340001');
      expect(converted.user.role).toBe(Role.FARMER);
      expect(converted.user.kingId).toMatch(/^\d{8}$/);
      expect(converted.lead.status).toBe(VerifiedLeadStatus.CONVERTED_BY_ADMIN);
      expect(converted.lead.convertedById).toBe('admin-1');
      expect(prismaMock.farmerPlan.upsert).toHaveBeenCalled();
      expect(walletMock.ensureWelcomeBonus).toHaveBeenCalledWith(converted.user.id);
    });
  });
});
