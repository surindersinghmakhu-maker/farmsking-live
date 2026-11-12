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

    it('preserves King ID on deleteMe, attaches changing char suffix across repeat deletes, and blocks double delete', async () => {
      const deletedRows: any[] = [];
      let currentUser: any = {
        id: 'u-repeat-1',
        name: 'Farmer Repeat',
        mobile: '9876543210',
        farmMobile: null,
        email: 'repeat@farmsking.in',
        kingId: '10009999',
        passwordHash: 'HASHED',
        deletedAt: null,
      };

      const prismaMock: any = {
        user: {
          findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
            if (where?.id === currentUser.id) return currentUser;
            return null;
          }),
          findMany: jest.fn().mockImplementation(async ({ where }: any) => {
            if (where?.mobile?.startsWith) {
              return deletedRows
                .filter((r) => r.mobile.startsWith(where.mobile.startsWith) && r.id !== where.id?.not)
                .map((r) => ({ mobile: r.mobile }));
            }
            if (where?.email?.startsWith) {
              return deletedRows
                .filter((r) => r.email && r.email.startsWith(where.email.startsWith) && r.id !== where.id?.not)
                .map((r) => ({ email: r.email }));
            }
            return [
              {
                id: 'u-repeat-1',
                kingId: '10009999',
                mobile: '9876543210_del_A',
                name: 'Deleted Account',
                passwordHash: 'ACCOUNT_DELETED_PERMANENTLY',
                deletedAt: new Date(),
              },
            ];
          }),
          count: jest.fn().mockResolvedValue(1),
          update: jest.fn().mockImplementation(async ({ data }: any) => {
            currentUser = { ...currentUser, ...data };
            return currentUser;
          }),
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

      // 1st delete -> mobile becomes 9876543210_del_A, kingId stays intact
      const otp1 = await usersService.requestDeleteMeOtp({ id: currentUser.id } as any, '9876543210');
      await usersService.deleteMe({ id: currentUser.id } as any, { otp: otp1.devOtp });
      expect(currentUser.mobile).toBe('9876543210_del_A');
      expect(currentUser.kingId).toBe('10009999');
      expect(currentUser.passwordHash).toBe('ACCOUNT_DELETED_PERMANENTLY');
      deletedRows.push({ ...currentUser });

      // Trying to delete already permanently deleted account via admin is blocked
      const superAdmin: any = { id: 'sa-1', role: Role.SUPER_ADMIN, roles: [Role.SUPER_ADMIN], deactivatedRoles: [] };
      const stepUp = await settingsService.requestAdminActionOtp(superAdmin);
      await expect(usersService.deleteUserByAdmin(superAdmin, currentUser.id, stepUp.devOtp)).rejects.toThrow(ConflictException);

      // 2nd signup & delete with same mobile -> mobile becomes 9876543210_del_B
      currentUser = {
        id: 'u-repeat-2',
        name: 'Farmer Repeat 2',
        mobile: '9876543210',
        farmMobile: null,
        email: 'repeat@farmsking.in',
        kingId: '10008888',
        passwordHash: 'HASHED',
        deletedAt: null,
      };
      const otp2 = await usersService.requestDeleteMeOtp({ id: currentUser.id } as any, '9876543210');
      await usersService.deleteMe({ id: currentUser.id } as any, { otp: otp2.devOtp });
      expect(currentUser.mobile).toBe('9876543210_del_B');
      expect(currentUser.kingId).toBe('10008888');
      deletedRows.push({ ...currentUser });

      // 3rd signup & delete with same mobile -> mobile becomes 9876543210_del_C
      currentUser = {
        id: 'u-repeat-3',
        name: 'Farmer Repeat 3',
        mobile: '9876543210',
        farmMobile: null,
        email: 'repeat@farmsking.in',
        kingId: '10007777',
        passwordHash: 'HASHED',
        deletedAt: null,
      };
      const otp3 = await usersService.requestDeleteMeOtp({ id: currentUser.id } as any, '9876543210');
      await usersService.deleteMe({ id: currentUser.id } as any, { otp: otp3.devOtp });
      expect(currentUser.mobile).toBe('9876543210_del_C');

      // list() exposes isPermanentlyDeleted without exposing passwordHash
      const listRes = await usersService.list({ status: 'inactive' });
      expect(listRes.items[0]).toMatchObject({
        kingId: '10009999',
        isPermanentlyDeleted: true,
      });
      expect((listRes.items[0] as any).passwordHash).toBeUndefined();
    });

    it('allows restoring deleted account when no new ID exists on mobile, and blocks restore if a new active ID exists on same mobile', async () => {
      const superAdmin: any = { id: 'sa-1', role: Role.SUPER_ADMIN, roles: [Role.SUPER_ADMIN], deactivatedRoles: [] };
      const deletedUser: any = {
        id: 'u-del-1',
        name: 'Deleted Account',
        mobile: '9876543210_del_A',
        email: null,
        kingId: '10004444',
        role: Role.FARMER,
        roles: [Role.CUSTOMER, Role.FARMER],
        deactivatedRoles: [],
        passwordHash: 'ACCOUNT_DELETED_PERMANENTLY',
        deletedAt: new Date(),
      };
      let activeNewUser: any = null;

      const prismaMock: any = {
        user: {
          findUnique: jest.fn().mockResolvedValue(deletedUser),
          findFirst: jest.fn().mockImplementation(async () => activeNewUser),
          update: jest.fn().mockImplementation(async ({ data }: any) => ({
            ...deletedUser,
            ...data,
          })),
        },
      };

      const usersService = new UsersService(
        prismaMock,
        { getBalance: jest.fn().mockResolvedValue(0) } as any,
        { autoRemoveUser: jest.fn().mockResolvedValue(null), autoAddNewUser: jest.fn().mockResolvedValue(null) } as any,
        { create: jest.fn() } as any,
      );

      // 1. If a new active account exists on the same mobile -> restore is BLOCKED
      activeNewUser = { id: 'u-new-1', kingId: '10005555', name: 'New Farmer' };
      await expect(usersService.reactivate(superAdmin, 'u-del-1')).rejects.toThrow(ConflictException);

      // 2. If NO active account exists on that mobile -> restore SUCCEEDS
      activeNewUser = null;
      const restored = await usersService.reactivate(superAdmin, 'u-del-1');
      expect(restored.deletedAt).toBeNull();
      expect(restored.mobile).toBe('9876543210');
      expect(restored.kingId).toBe('10004444');
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

    it('records existing Client trying Partner via OTP as Unread follow-up and allows marking Done/Read or Unread', async () => {
      const leadStore = new Map<string, any>();
      const existingClient = {
        id: 'client-1',
        kingId: '10006666',
        mobile: '9876511122',
        name: 'Harpreet Farmer',
        email: null,
        role: Role.FARMER,
        roles: [Role.CUSTOMER, Role.FARMER],
        deactivatedRoles: [],
        isPermanentlyBlocked: false,
        pincode: '143422',
        district: 'Tarn Taran',
        state: 'Punjab',
        village: 'Goindwal Sahib',
      };

      const prismaMock: any = {
        user: {
          findFirst: jest.fn(async ({ where }: any) => {
            const orList = where?.OR || [];
            if (orList.some((c: any) => c.mobile === '9876511122' || c.mobile?.endsWith === '9876511122')) {
              return existingClient;
            }
            return null;
          }),
          findMany: jest.fn().mockResolvedValue([{ id: 'admin-1' }]),
        },
        partnerApplication: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        verifiedSignupLead: {
          findUnique: jest.fn(async ({ where }: any) => leadStore.get(where.mobile || where.id) || null),
          upsert: jest.fn(async ({ where, create, update }: any) => {
            const existing = leadStore.get(where.mobile);
            const next = existing
              ? { ...existing, ...update, attemptCount: (existing.attemptCount || 1) + 1 }
              : { id: 'lead-client-partner-1', ...create };
            leadStore.set(where.mobile, next);
            leadStore.set(next.id, next);
            return next;
          }),
          update: jest.fn(async ({ where, data }: any) => {
            const existing = leadStore.get(where.id);
            const next = { ...existing, ...data };
            leadStore.set(next.mobile, next);
            leadStore.set(next.id, next);
            return next;
          }),
        },
        notification: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
        isoAuditLog: { create: jest.fn().mockResolvedValue({}) },
      };

      const authService = new AuthService(
        prismaMock,
        { sign: jest.fn().mockReturnValue('partner.upload.jwt') } as any,
        { sendOtpMessage: jest.fn().mockResolvedValue({ success: true }) } as any,
        {} as any,
        {} as any,
        {} as any,
        new UserSessionService(),
        {} as any,
      );

      const otpRes = await authService.sendPartnerSignupOtp('9876511122');
      await authService.verifyPartnerSignupOtp('9876511122', otpRes.devOtp!);

      const recorded = leadStore.get('9876511122');
      expect(recorded).toBeTruthy();
      expect(recorded.portal).toBe('PARTNER');
      expect(recorded.status).toBe(VerifiedLeadStatus.OTP_CONFIRMED);
      expect(recorded.convertedUserId).toBe('client-1');

      const usersService = new UsersService(
        prismaMock,
        { getBalance: jest.fn().mockResolvedValue(0) } as any,
        { autoAddNewUser: jest.fn().mockResolvedValue({}) } as any,
        { create: jest.fn().mockResolvedValue({}) } as any,
      );
      const adminCaller: any = { id: 'admin-1', name: 'Super Admin', role: Role.SUPER_ADMIN, roles: [Role.SUPER_ADMIN] };

      const markedDone = await usersService.updateVerifiedSignupLeadNotes(adminCaller, recorded.id, {
        status: VerifiedLeadStatus.DISMISSED,
        adminNotes: 'Called farmer and guided on KYC upload.',
      });
      expect(markedDone.lead.status).toBe(VerifiedLeadStatus.DISMISSED);

      const markedUnread = await usersService.updateVerifiedSignupLeadNotes(adminCaller, recorded.id, {
        status: VerifiedLeadStatus.OTP_CONFIRMED,
      });
      expect(markedUnread.lead.status).toBe(VerifiedLeadStatus.OTP_CONFIRMED);
    });
  });

  describe('Admin Block & Unblock Enforcement (Same Mobile Re-Signup & Sign-In Blocked)', () => {
    it('keeps mobile intact on Admin Block, blocks both sign-in and re-signup across OTP/password/register/mobile-link, and allows login after Unblock', async () => {
      const targetUser: any = {
        id: 'u-block-1',
        kingId: '10008899',
        mobile: '9876599887',
        email: 'blocked.user@example.com',
        name: 'Jatinder Singh',
        role: Role.AGENT,
        roles: [Role.AGENT, Role.CUSTOMER],
        deactivatedRoles: [],
        passwordHash: '$argon2id$dummyhash',
        isPermanentlyBlocked: false,
        deletedAt: null,
        failedLoginAttempts: 0,
        lockoutUntil: null,
      };

      const prismaMock: any = {
        user: {
          findUnique: jest.fn(async ({ where }: any) => (where?.id === targetUser.id ? { ...targetUser } : null)),
          findFirst: jest.fn(async ({ where }: any) => {
            if (where?.id?.not === targetUser.id) return null;
            const orList = where?.OR || [];
            const mobileMatches =
              orList.length === 0 ||
              orList.some(
                (c: any) =>
                  c.mobile === targetUser.mobile ||
                  c.mobile === `+91${targetUser.mobile}` ||
                  c.mobile?.endsWith === targetUser.mobile ||
                  c.kingId === targetUser.kingId,
              );
            if (!mobileMatches) return null;

            const andList = where?.AND || [];
            const allowsBlocked = andList.some((a: any) =>
              (a?.OR || []).some((o: any) => o.isPermanentlyBlocked === true),
            );
            if (targetUser.deletedAt === null || (allowsBlocked && targetUser.isPermanentlyBlocked)) {
              return { ...targetUser };
            }
            return null;
          }),
          update: jest.fn(async ({ where, data }: any) => {
            if (where?.id === targetUser.id) {
              Object.assign(targetUser, data);
            }
            return { ...targetUser };
          }),
        },
        labourWorker: { findFirst: jest.fn().mockResolvedValue(null) },
        partnerApplication: { findFirst: jest.fn().mockResolvedValue(null) },
      };

      const waMock: any = {
        autoRemoveUser: jest.fn().mockResolvedValue({}),
        autoAddNewUser: jest.fn().mockResolvedValue({}),
        sendOtpMessage: jest.fn().mockResolvedValue({ success: true }),
      };

      const usersService = new UsersService(
        prismaMock,
        { getBalance: jest.fn().mockResolvedValue(0) } as any,
        waMock,
        { create: jest.fn().mockResolvedValue({}) } as any,
      );

      const authService = new AuthService(
        prismaMock,
        { sign: jest.fn().mockReturnValue('mock.jwt.token'), verify: jest.fn() } as any,
        waMock,
        { autoAddNewUser: jest.fn().mockResolvedValue({}) } as any,
        {} as any,
        {} as any,
        new UserSessionService(),
        {} as any,
      );

      const adminCaller: any = { id: 'admin-1', name: 'Super Admin', role: Role.SUPER_ADMIN, roles: [Role.SUPER_ADMIN] };

      // 1. Admin clicks Block -> sets isPermanentlyBlocked + deletedAt and keeps mobile unchanged
      const blockedRes = await usersService.deactivate(adminCaller, targetUser.id);
      expect(blockedRes.isPermanentlyBlocked).toBe(true);
      expect(blockedRes.deletedAt).toBeTruthy();
      expect(blockedRes.mobile).toBe('9876599887');

      // 2. Blocked mobile CANNOT sign in (OTP login or password login) or sign up again
      await expect(authService.sendLoginOtp('9876599887', 'CLIENT')).rejects.toThrow(UnauthorizedException);
      await expect(authService.verifyLoginOtp('9876599887', '123456', 'CLIENT')).rejects.toThrow(UnauthorizedException);
      await expect(authService.sendRegisterOtp('9876599887')).rejects.toThrow(UnauthorizedException);
      await expect(
        authService.register({ mobile: '9876599887', password: 'Password@123', name: 'New Attempt' } as any),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        authService.login({ mobile: '9876599887', password: 'Password@123', portal: 'PARTNER' } as any),
      ).rejects.toThrow(UnauthorizedException);
      await expect(authService.sendPartnerSignupOtp('9876599887')).rejects.toThrow(UnauthorizedException);
      await expect(
        authService.sendMobileLinkOtp({ id: 'google-temp-1', mobile: 'G_1122334455' } as any, '9876599887'),
      ).rejects.toThrow(UnauthorizedException);

      // 3. Admin clicks Unblock -> clears isPermanentlyBlocked & deletedAt, allowing OTP sign-in again
      const unblockedRes = await usersService.reactivate(adminCaller, targetUser.id);
      expect(unblockedRes.isPermanentlyBlocked).toBe(false);
      expect(unblockedRes.deletedAt).toBeNull();

      const otpSend = await authService.sendLoginOtp('9876599887', 'CLIENT');
      expect(otpSend.success).toBe(true);
      const otpVerify = await authService.verifyLoginOtp('9876599887', otpSend.devOtp!, 'CLIENT');
      expect(otpVerify.isNewUser).toBe(false);
    });

    it('reports real-time isOnline presence in UsersService.list via UserSessionService activity & WebSocket state', async () => {
      const sessionService = new UserSessionService();
      const s = sessionService.createSession('u-live-1', 'Web Browser');

      const prismaMock: any = {
        user: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'u-live-1',
              kingId: '10001122',
              mobile: '9876511223',
              name: 'Online Farmer',
              role: Role.FARMER,
              roles: [Role.CUSTOMER, Role.FARMER],
              deactivatedRoles: [],
              createdAt: new Date(),
              deletedAt: null,
              isPermanentlyBlocked: false,
              passwordHash: 'hash1',
            },
            {
              id: 'u-offline-2',
              kingId: '10001133',
              mobile: '9876511224',
              name: 'Offline Farmer',
              role: Role.FARMER,
              roles: [Role.CUSTOMER, Role.FARMER],
              deactivatedRoles: [],
              createdAt: new Date(),
              deletedAt: null,
              isPermanentlyBlocked: false,
              passwordHash: 'hash2',
            },
          ]),
          count: jest.fn().mockResolvedValue(2),
        },
      };

      const usersService = new UsersService(
        prismaMock,
        { getBalance: jest.fn().mockResolvedValue(0) } as any,
        { autoAddNewUser: jest.fn().mockResolvedValue({}) } as any,
        { create: jest.fn().mockResolvedValue({}) } as any,
        undefined,
        undefined,
        undefined,
        sessionService,
      );

      const list1 = await usersService.list({ page: 1, limit: 20 });
      expect(list1.items.find((u: any) => u.id === 'u-live-1')?.isOnline).toBe(true);
      expect(list1.items.find((u: any) => u.id === 'u-offline-2')?.isOnline).toBe(false);

      sessionService.logoutSession('u-live-1', s.sessionId);
      const list2 = await usersService.list({ page: 1, limit: 20 });
      expect(list2.items.find((u: any) => u.id === 'u-live-1')?.isOnline).toBe(false);
    });

    it('enforces mandatory mobile OTP verification in 3-step adminCreateUser flow for Clients, Partners (SellerStore), and Staff', async () => {
      const usersMap = new Map<string, any>();
      const farmerPlanUpserted: string[] = [];
      const sellerStoreCreated: any[] = [];

      const prismaMock: any = {
        user: {
          findFirst: jest.fn(async ({ where }: any) => {
            if (where?.email) return null;
            const orList = where?.OR || [];
            for (const u of usersMap.values()) {
              for (const cond of orList) {
                if (cond.mobile && u.mobile === cond.mobile) return u;
              }
            }
            return null;
          }),
          findUnique: jest.fn(async ({ where }: any) => {
            if (where?.kingId) {
              for (const u of usersMap.values()) if (u.kingId === where.kingId) return u;
            }
            return null;
          }),
          create: jest.fn(async ({ data }: any) => {
            const created = { id: `u-admin-created-${usersMap.size + 1}`, ...data, createdAt: new Date(), deletedAt: null };
            usersMap.set(created.id, created);
            return created;
          }),
        },
        farmerPlan: {
          upsert: jest.fn(async ({ where }: any) => {
            farmerPlanUpserted.push(where.farmerId);
            return {};
          }),
        },
        gardenerPlan: { upsert: jest.fn().mockResolvedValue({}) },
        sellerStore: {
          create: jest.fn(async ({ data }: any) => {
            sellerStoreCreated.push(data);
            return data;
          }),
        },
        verifiedSignupLead: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() },
        isoAuditLog: { create: jest.fn().mockResolvedValue({}) },
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
          create: jest.fn().mockResolvedValue({ code: 'FKSF99' }),
        },
      };
      prismaMock.$transaction = jest.fn(async (cb: any) => cb(prismaMock));

      const usersService = new UsersService(
        prismaMock,
        { ensureWelcomeBonus: jest.fn().mockResolvedValue({}) } as any,
        { autoAddNewUser: jest.fn().mockResolvedValue({}) } as any,
        { create: jest.fn().mockResolvedValue({}) } as any,
        undefined,
        { sendOtpMessage: jest.fn().mockResolvedValue({ success: true }), sendDirectTextMessage: jest.fn().mockResolvedValue({}) } as any,
      );

      const superAdminCaller: any = {
        id: 'super-1',
        name: 'Super Admin',
        role: Role.SUPER_ADMIN,
        roles: [Role.SUPER_ADMIN],
        deactivatedRoles: [],
      };

      // Reject creation without a verified OTP token
      await expect(
        usersService.adminCreateUser(superAdminCaller, {
          otpVerificationToken: 'tampered.invalid.token',
          category: 'CLIENTS',
          role: 'FARMER',
          mobile: '9876540011',
          name: 'Balwant Farmer',
        }),
      ).rejects.toThrow(UnauthorizedException);

      // Step 2: Send + Verify OTP -> Step 3: Create Farmer
      const farmerOtp = await usersService.sendAdminCreateOtp(superAdminCaller, '9876540011');
      const farmerVerified = await usersService.verifyAdminCreateOtp(superAdminCaller, '9876540011', farmerOtp.devOtp!);
      const farmerRes = await usersService.adminCreateUser(superAdminCaller, {
        otpVerificationToken: farmerVerified.otpVerificationToken,
        category: 'CLIENTS',
        role: 'FARMER',
        mobile: '9876540011',
        name: 'Balwant Farmer',
        sprayTankSizeL: 25,
      });
      expect(farmerRes.success).toBe(true);
      expect(farmerRes.user.role).toBe(Role.FARMER);
      expect(farmerRes.user.isPhoneVerified).toBe(true);
      expect(farmerPlanUpserted).toContain(farmerRes.user.id);

      // Partner: Create Seller -> creates SellerStore automatically
      const sellerOtp = await usersService.sendAdminCreateOtp(superAdminCaller, '9876540022');
      const sellerVerified = await usersService.verifyAdminCreateOtp(superAdminCaller, '9876540022', sellerOtp.devOtp!);
      const sellerRes = await usersService.adminCreateUser(superAdminCaller, {
        otpVerificationToken: sellerVerified.otpVerificationToken,
        category: 'PARTNERS',
        role: 'SELLER',
        mobile: '9876540022',
        name: 'Kisan Agro Store Owner',
        storeName: 'Kisan Agro Traders',
        sellerType: SellerType.COMMERCIAL,
      });
      expect(sellerRes.user.role).toBe(Role.SELLER);
      expect(sellerStoreCreated.length).toBe(1);
      expect(sellerStoreCreated[0].storeName).toBe('Kisan Agro Traders');

      // Staff: Admin cannot create ADMIN/MANAGER, SuperAdmin creates OPERATOR & receives tempPassword
      const regularAdmin: any = { id: 'admin-2', name: 'Admin', role: Role.ADMIN, roles: [Role.ADMIN] };
      await expect(
        usersService.adminCreateUser(regularAdmin, {
          otpVerificationToken: sellerVerified.otpVerificationToken,
          category: 'STAFF',
          role: 'ADMIN',
          mobile: '9876540033',
          name: 'Blocked Peer Admin',
        }),
      ).rejects.toThrow(ForbiddenException);

      const staffOtp = await usersService.sendAdminCreateOtp(superAdminCaller, '9876540044');
      const staffVerified = await usersService.verifyAdminCreateOtp(superAdminCaller, '9876540044', staffOtp.devOtp!);
      const staffRes = await usersService.adminCreateUser(superAdminCaller, {
        otpVerificationToken: staffVerified.otpVerificationToken,
        category: 'STAFF',
        role: 'OPERATOR',
        mobile: '9876540044',
        name: 'Print Desk Operator',
      });
      expect(staffRes.user.role).toBe(Role.OPERATOR);
      expect(staffRes.tempPassword).toBeTruthy();
    });
  });
});
