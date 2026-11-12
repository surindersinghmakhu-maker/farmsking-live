import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AdvisorAssignmentStatus, Role } from '@prisma/client';
import { AppSettingsService } from './modules/app-settings/app-settings.service';
import { CashfreeService } from './modules/cashfree/cashfree.service';
import { MediaStoreService } from './modules/media-store/media-store.service';
import { AddressesService } from './modules/addresses/addresses.service';
import { ChatGateway } from './modules/chat/chat.gateway';
import { UserSessionService } from './modules/auth/user-session.service';

describe('Platform Security Hardening Regression Tests', () => {
  it('strips sensitive systemIntegrations & serviceProvidersConfig from public AppSettingsService.get()', async () => {
    const prisma: any = {
      appSetting: {
        upsert: jest.fn().mockResolvedValue({
          id: 'default',
          appName: 'FarmsKing',
          logoUrl: 'https://farmsking.in/logo.png',
          upiId: 'test@upi',
          featureFlags: {
            doctorMaintenanceMode: false,
            systemIntegrations: {
              ai: { providers: { gemini: { apiKey: 'SECRET_GEMINI_KEY' } } },
              gateway: { providers: { cashfree: { secretKey: 'SECRET_CASHFREE_KEY' } } },
            },
            serviceProvidersConfig: {
              activeProviders: { gateway: 'CASHFREE' },
              fieldValues: { gateway: { CASHFREE_SECRET_KEY: 'LEAK_TEST' } },
            },
            googleDriveWebhookUrl: 'https://script.google.com/secret',
          },
        }),
      },
      user: { findFirst: jest.fn().mockResolvedValue(null) },
    };

    const service = new AppSettingsService(prisma);
    const publicRes = await service.get();

    expect(publicRes.appName).toBe('FarmsKing');
    expect((publicRes as any).systemIntegrations).toBeUndefined();
    expect((publicRes as any).serviceProvidersConfig).toBeUndefined();
    expect((publicRes as any).googleDriveWebhookUrl).toBeUndefined();
    expect((publicRes as any).featureFlags?.systemIntegrations).toBeUndefined();
    expect((publicRes as any).featureFlags?.serviceProvidersConfig).toBeUndefined();

    // Internal integrations reader must still work cleanly
    const integrations = await service.getIntegrations();
    expect(integrations.ai.providers.gemini.apiKey).toBe('SECRET_GEMINI_KEY');
  });

  it('rejects unsigned or malformed Cashfree webhooks (fail-closed)', async () => {
    const configService: any = {
      get: jest.fn((key: string) => {
        if (key === 'CASHFREE_APP_ID') return 'live_app';
        if (key === 'CASHFREE_SECRET_KEY') return 'real_webhook_secret_123';
        return 'SANDBOX';
      }),
    };
    const prisma: any = {};
    const cashfree = new CashfreeService(configService, prisma);

    await expect(
      cashfree.handleWebhook({ data: { order: { order_id: 'WALLET-123' } } }, undefined, undefined, undefined),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      cashfree.handleWebhook(
        { data: { order: { order_id: 'WALLET-123' } } },
        'bad-signature',
        '1700000000',
        '{"data":{}}',
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('enforces crop ownership / advisor assignment on MediaStoreService access & deletion', async () => {
    const prisma: any = {
      cropCycle: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'crop-uuid-1',
          plot: { farm: { ownerId: 'farmer-owner-1' } },
        }),
      },
      advisorAssignment: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $queryRawUnsafe: jest.fn().mockResolvedValue([]),
    };
    const uploadsService: any = {};
    const mediaStore = new MediaStoreService(prisma, uploadsService);

    const otherFarmer: any = { id: 'attacker-farmer', role: Role.FARMER, roles: [Role.FARMER], deactivatedRoles: [] };
    await expect(mediaStore.getMediaForCrop(otherFarmer, 'crop-uuid-1')).rejects.toThrow(ForbiddenException);

    const assignedAdvisor: any = { id: 'advisor-1', role: Role.ADVISOR, roles: [Role.ADVISOR], deactivatedRoles: [] };
    prisma.advisorAssignment.findFirst.mockResolvedValue({ id: 'assign-1', status: AdvisorAssignmentStatus.ACTIVE });
    await expect(mediaStore.getMediaForCrop(assignedAdvisor, 'crop-uuid-1')).resolves.toEqual([]);
  });

  it('prevents ownerId mass assignment in AddressesService.update()', async () => {
    const prisma: any = {
      customerAddress: {
        findUnique: jest.fn().mockResolvedValue({ id: 'addr-1', ownerId: 'user-1', isDefault: false }),
        updateMany: jest.fn(),
        update: jest.fn().mockImplementation(async ({ data }) => data),
      },
    };
    const service = new AddressesService(prisma);
    const caller: any = { id: 'user-1', role: Role.CUSTOMER };

    await service.update(caller, 'addr-1', { line: 'New Line', ownerId: 'attacker-id' } as any);
    const passedData = prisma.customerAddress.update.mock.calls[0][0].data;
    expect(passedData.line).toBe('New Line');
    expect(passedData.ownerId).toBeUndefined();
  });

  it('disconnects blocked or revoked sessions on ChatGateway WebSocket handshake', async () => {
    const userSessionService = new UserSessionService();
    const { sessionId } = userSessionService.createSession('u-blocked');
    userSessionService.logoutSession('u-blocked', sessionId);

    const jwtService: any = {
      verify: jest.fn().mockReturnValue({ sub: 'u-blocked', sid: sessionId, iat: Math.floor(Date.now() / 1000) }),
    };
    const prisma: any = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'u-blocked',
          mobile: '9999999999',
          role: Role.FARMER,
          roles: [Role.FARMER],
          deactivatedRoles: [],
          name: 'Test',
          isPermanentlyBlocked: true,
          lockoutUntil: null,
        }),
      },
    };
    const gateway = new ChatGateway(jwtService, prisma, {} as any, userSessionService);

    const mockClient: any = {
      handshake: { auth: { token: 'fake.jwt.token' }, query: {} },
      data: {},
      disconnect: jest.fn(),
      join: jest.fn(),
    };
    await gateway.handleConnection(mockClient);
    expect(mockClient.disconnect).toHaveBeenCalled();
    expect(mockClient.join).not.toHaveBeenCalled();
  });
});

