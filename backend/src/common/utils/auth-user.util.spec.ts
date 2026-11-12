import { ForbiddenException } from '@nestjs/common';
import { Role, SupervisorPermission } from '@prisma/client';
import { hasActiveRole, normalizeRoleAlias } from './auth-user.util';
import { getEffectiveFarmerId } from './effective-farmer.util';
import { assertSupervisorPermission } from './supervisor-permission.util';

describe('auth-user, effective-farmer & supervisor-permission utils', () => {
  it('normalizes legacy BUSINESS_PARTNER alias to AGENT cleanly', () => {
    expect(normalizeRoleAlias('BUSINESS_PARTNER')).toBe(Role.AGENT);
    expect(normalizeRoleAlias(Role.AGENT)).toBe(Role.AGENT);
    expect(normalizeRoleAlias(Role.FARMER)).toBe(Role.FARMER);
  });

  it('hasActiveRole rejects roles even when user.role matches if deactivated', () => {
    const user = {
      role: Role.SUPERVISOR,
      roles: [Role.SUPERVISOR, Role.CUSTOMER],
      deactivatedRoles: [Role.SUPERVISOR],
    };
    expect(hasActiveRole(user, Role.SUPERVISOR)).toBe(false);
    expect(hasActiveRole(user, Role.CUSTOMER)).toBe(true);
  });

  it('getEffectiveFarmerId returns employerFarmerId ONLY when SUPERVISOR is active', () => {
    const activeSupervisor = {
      id: 'sup-1',
      mobile: '9999999991',
      role: Role.SUPERVISOR,
      roles: [Role.SUPERVISOR],
      deactivatedRoles: [],
      name: 'Sup',
      employerFarmerId: 'farmer-1',
    };
    expect(getEffectiveFarmerId(activeSupervisor)).toBe('farmer-1');

    const deactivatedSupervisor = {
      ...activeSupervisor,
      deactivatedRoles: [Role.SUPERVISOR],
    };
    expect(getEffectiveFarmerId(deactivatedSupervisor)).toBe('sup-1');
  });

  it('assertSupervisorPermission denies disallowed module access for pure supervisor', async () => {
    const prismaMock = {
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ supervisorFeaturesConfig: { sales: { view: false, entry: false }, spray: { view: true, entry: true } } }]),
      user: { findUnique: jest.fn().mockResolvedValue({ supervisorPermissions: [] }) },
    } as any;

    const supUser = {
      id: 'sup-1',
      mobile: '9999999991',
      role: Role.SUPERVISOR,
      roles: [Role.SUPERVISOR],
      deactivatedRoles: [],
      name: 'Sup',
      employerFarmerId: 'farmer-1',
    };

    await expect(assertSupervisorPermission(prismaMock, supUser, 'spray', 'entry')).resolves.toBeUndefined();
    await expect(assertSupervisorPermission(prismaMock, supUser, 'sales', 'view')).rejects.toThrow(ForbiddenException);
  });
});

