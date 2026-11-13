import { Role } from '@prisma/client';
import {
  evaluatePortalEligibility,
  pickBestPrimaryRole,
  validateRoleCombination,
} from './role-policy.util';

describe('Role Policy Matrix & Portal Eligibility', () => {
  describe('validateRoleCombination', () => {
    it('allows Farmer + Advisor + Agent (+ Customer) on one account', () => {
      const res = validateRoleCombination([Role.CUSTOMER, Role.FARMER, Role.ADVISOR, Role.AGENT]);
      expect(res.valid).toBe(true);
    });

    it('allows Gardener + Advisor + Agent on one account', () => {
      const res = validateRoleCombination([Role.CUSTOMER, Role.GARDENER, Role.ADVISOR, Role.AGENT]);
      expect(res.valid).toBe(true);
    });

    it('allows Advisor + Agent on one account', () => {
      const res = validateRoleCombination([Role.CUSTOMER, Role.ADVISOR, Role.AGENT]);
      expect(res.valid).toBe(true);
    });

    it('blocks Farmer + Gardener together', () => {
      const res = validateRoleCombination([Role.CUSTOMER, Role.FARMER, Role.GARDENER]);
      expect(res.valid).toBe(false);
    });

    it('allows Supervisor to combine with Labour, while blocking Farmer, Agent, or Seller', () => {
      expect(validateRoleCombination([Role.SUPERVISOR, Role.LABOUR]).valid).toBe(true);
      expect(validateRoleCombination([Role.SUPERVISOR, Role.LABOUR, Role.CUSTOMER]).valid).toBe(true);
      expect(validateRoleCombination([Role.SUPERVISOR, Role.FARMER]).valid).toBe(false);
      expect(validateRoleCombination([Role.SUPERVISOR, Role.AGENT]).valid).toBe(false);
      expect(validateRoleCombination([Role.SUPERVISOR, Role.SELLER]).valid).toBe(false);
      expect(validateRoleCombination([Role.SUPERVISOR, Role.CUSTOMER]).valid).toBe(true);
    });

    it('allows Labour to combine with Supervisor, while blocking Farmer, Agent, or Seller', () => {
      expect(validateRoleCombination([Role.LABOUR, Role.SUPERVISOR]).valid).toBe(true);
      expect(validateRoleCombination([Role.LABOUR, Role.FARMER]).valid).toBe(false);
      expect(validateRoleCombination([Role.LABOUR, Role.AGENT]).valid).toBe(false);
      expect(validateRoleCombination([Role.LABOUR, Role.SELLER]).valid).toBe(false);
      expect(validateRoleCombination([Role.LABOUR, Role.CUSTOMER]).valid).toBe(true);
    });

    it('keeps Admin Panel staff strictly single-role within the staff category', () => {
      expect(validateRoleCombination([Role.OPERATOR, Role.TECHNICAL_TRAINER]).valid).toBe(false);
      expect(validateRoleCombination([Role.ADMIN, Role.MANAGER]).valid).toBe(false);
      expect(validateRoleCombination([Role.SUPER_ADMIN, Role.ACCOUNTANT]).valid).toBe(false);
      expect(validateRoleCombination([Role.MANAGER]).valid).toBe(true);
      expect(validateRoleCombination([Role.ACCOUNTANT]).valid).toBe(true);
      expect(validateRoleCombination([Role.TECHNICAL_TRAINER]).valid).toBe(true);
    });
  });

  describe('evaluatePortalEligibility', () => {
    it('allows dual Farmer + Advisor + Agent in BOTH User (CLIENT) and Agent (PARTNER) login tabs', () => {
      const dualUser = {
        role: Role.FARMER,
        roles: [Role.CUSTOMER, Role.FARMER, Role.ADVISOR, Role.AGENT],
        deactivatedRoles: [],
      };
      expect(evaluatePortalEligibility(dualUser, 'CLIENT').allowed).toBe(true);
      expect(evaluatePortalEligibility(dualUser, 'PARTNER').allowed).toBe(true);
    });

    it('allows Seller / Advisor / Sales Manager (AGENT) signing in on User (CLIENT) tab as a Client', () => {
      const pureAgent = { role: Role.AGENT, roles: [Role.CUSTOMER, Role.AGENT], deactivatedRoles: [] };
      const pureSeller = { role: Role.SELLER, roles: [Role.CUSTOMER, Role.SELLER], deactivatedRoles: [] };
      const pureAdvisor = { role: Role.ADVISOR, roles: [Role.CUSTOMER, Role.ADVISOR], deactivatedRoles: [] };

      expect(evaluatePortalEligibility(pureAgent, 'CLIENT').allowed).toBe(true);
      expect(evaluatePortalEligibility(pureAgent, 'PARTNER').allowed).toBe(true);
      expect(evaluatePortalEligibility(pureSeller, 'CLIENT').allowed).toBe(true);
      expect(evaluatePortalEligibility(pureSeller, 'PARTNER').allowed).toBe(true);
      expect(evaluatePortalEligibility(pureAdvisor, 'CLIENT').allowed).toBe(true);
      expect(evaluatePortalEligibility(pureAdvisor, 'PARTNER').allowed).toBe(true);
    });

    it('blocks non-partner accounts (Farmer, Buyer, Supervisor, Labour, or unregistered) from Partner login tab', () => {
      const farmer = { role: Role.FARMER, roles: [Role.CUSTOMER, Role.FARMER], deactivatedRoles: [] };
      const buyer = { role: Role.CUSTOMER, roles: [Role.CUSTOMER], deactivatedRoles: [] };
      const supervisor = { role: Role.SUPERVISOR, roles: [Role.SUPERVISOR, Role.CUSTOMER], deactivatedRoles: [] };
      const labour = { role: Role.LABOUR, roles: [Role.LABOUR, Role.CUSTOMER], deactivatedRoles: [] };

      expect(evaluatePortalEligibility(null, 'PARTNER').allowed).toBe(false);
      expect(evaluatePortalEligibility(null, 'PARTNER').reason).toContain('Not registered as a FarmsKing Partner');
      expect(evaluatePortalEligibility(farmer, 'CLIENT').allowed).toBe(true);
      expect(evaluatePortalEligibility(farmer, 'PARTNER').allowed).toBe(false);
      expect(evaluatePortalEligibility(farmer, 'PARTNER').reason).toContain('Not registered as a FarmsKing Partner');
      expect(evaluatePortalEligibility(buyer, 'CLIENT').allowed).toBe(true);
      expect(evaluatePortalEligibility(buyer, 'PARTNER').allowed).toBe(false);
      expect(evaluatePortalEligibility(supervisor, 'CLIENT').allowed).toBe(true);
      expect(evaluatePortalEligibility(supervisor, 'PARTNER').allowed).toBe(false);
      expect(evaluatePortalEligibility(labour, 'CLIENT').allowed).toBe(true);
      expect(evaluatePortalEligibility(labour, 'PARTNER').allowed).toBe(false);
    });

    it('blocks pure Admin Panel staff accounts with no Client or Partner role from CLIENT and PARTNER login tabs', () => {
      for (const staffRole of [
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.MANAGER,
        Role.OPERATOR,
        Role.TECHNICAL_TRAINER,
        Role.ACCOUNTANT,
      ]) {
        const staff = { role: staffRole, roles: [staffRole], deactivatedRoles: [] };
        expect(evaluatePortalEligibility(staff, 'CLIENT').allowed).toBe(false);
        expect(evaluatePortalEligibility(staff, 'PARTNER').allowed).toBe(false);
      }
    });

    it('ignores deactivated Partner role when checking portal access', () => {
      const farmerWithDeactivatedAgent = {
        role: Role.FARMER,
        roles: [Role.CUSTOMER, Role.FARMER, Role.AGENT],
        deactivatedRoles: [Role.AGENT],
      };
      expect(evaluatePortalEligibility(farmerWithDeactivatedAgent, 'CLIENT').allowed).toBe(true);
      expect(evaluatePortalEligibility(farmerWithDeactivatedAgent, 'PARTNER').allowed).toBe(false);
    });
  });

  describe('pickBestPrimaryRole', () => {
    it('prioritizes Farmer over Agent/Seller/Customer when resolving primary role', () => {
      expect(pickBestPrimaryRole([Role.CUSTOMER, Role.SELLER, Role.AGENT, Role.FARMER])).toBe(Role.FARMER);
      expect(pickBestPrimaryRole([Role.CUSTOMER, Role.SUPERVISOR])).toBe(Role.SUPERVISOR);
    });
  });
});

