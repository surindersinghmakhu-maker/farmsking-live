import { Role } from '@prisma/client';
import {
  evaluatePortalEligibility,
  pickBestPrimaryRole,
  validateRoleCombination,
} from './role-policy.util';

describe('Role Policy Matrix & Portal Eligibility', () => {
  describe('validateRoleCombination', () => {
    it('allows Farmer + Agent + Seller (+ Customer) on one account', () => {
      const res = validateRoleCombination([Role.CUSTOMER, Role.FARMER, Role.AGENT, Role.SELLER]);
      expect(res.valid).toBe(true);
    });

    it('allows Gardener + Agent + Seller on one account', () => {
      const res = validateRoleCombination([Role.CUSTOMER, Role.GARDENER, Role.AGENT, Role.SELLER]);
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

    it('blocks Supervisor from combining with Farmer, Agent, Seller, or Labour', () => {
      expect(validateRoleCombination([Role.SUPERVISOR, Role.FARMER]).valid).toBe(false);
      expect(validateRoleCombination([Role.SUPERVISOR, Role.AGENT]).valid).toBe(false);
      expect(validateRoleCombination([Role.SUPERVISOR, Role.SELLER]).valid).toBe(false);
      expect(validateRoleCombination([Role.SUPERVISOR, Role.LABOUR]).valid).toBe(false);
      expect(validateRoleCombination([Role.SUPERVISOR, Role.CUSTOMER]).valid).toBe(true);
    });

    it('blocks Labour from combining with Farmer, Agent, Seller, or Supervisor', () => {
      expect(validateRoleCombination([Role.LABOUR, Role.FARMER]).valid).toBe(false);
      expect(validateRoleCombination([Role.LABOUR, Role.AGENT]).valid).toBe(false);
      expect(validateRoleCombination([Role.LABOUR, Role.SELLER]).valid).toBe(false);
      expect(validateRoleCombination([Role.LABOUR, Role.CUSTOMER]).valid).toBe(true);
    });

    it('keeps Admin Panel staff (Admin, Super Admin, Manager, Operator, Technical Trainer) strictly single-role', () => {
      expect(validateRoleCombination([Role.TECHNICAL_TRAINER, Role.FARMER]).valid).toBe(false);
      expect(validateRoleCombination([Role.MANAGER, Role.AGENT]).valid).toBe(false);
      expect(validateRoleCombination([Role.OPERATOR, Role.TECHNICAL_TRAINER]).valid).toBe(false);
      expect(validateRoleCombination([Role.ACCOUNTANT, Role.FARMER]).valid).toBe(false);
      expect(validateRoleCombination([Role.ACCOUNTANT, Role.AGENT]).valid).toBe(false);
      expect(validateRoleCombination([Role.TECHNICAL_TRAINER, Role.CUSTOMER]).valid).toBe(true);
      expect(validateRoleCombination([Role.MANAGER]).valid).toBe(true);
      expect(validateRoleCombination([Role.ACCOUNTANT]).valid).toBe(true);
    });
  });

  describe('evaluatePortalEligibility', () => {
    it('allows dual Farmer + Agent + Seller in BOTH User (CLIENT) and Agent (PARTNER) login tabs', () => {
      const dualUser = {
        role: Role.FARMER,
        roles: [Role.CUSTOMER, Role.FARMER, Role.AGENT, Role.SELLER],
        deactivatedRoles: [],
      };
      expect(evaluatePortalEligibility(dualUser, 'CLIENT').allowed).toBe(true);
      expect(evaluatePortalEligibility(dualUser, 'PARTNER').allowed).toBe(true);
    });

    it('blocks pure Agent / Seller / Advisor (with baseline CUSTOMER) from User (CLIENT) login tab', () => {
      const pureAgent = { role: Role.AGENT, roles: [Role.CUSTOMER, Role.AGENT], deactivatedRoles: [] };
      const pureSeller = { role: Role.SELLER, roles: [Role.CUSTOMER, Role.SELLER], deactivatedRoles: [] };
      const pureAdvisor = { role: Role.ADVISOR, roles: [Role.CUSTOMER, Role.ADVISOR], deactivatedRoles: [] };

      expect(evaluatePortalEligibility(pureAgent, 'CLIENT').allowed).toBe(false);
      expect(evaluatePortalEligibility(pureAgent, 'PARTNER').allowed).toBe(true);
      expect(evaluatePortalEligibility(pureSeller, 'CLIENT').allowed).toBe(false);
      expect(evaluatePortalEligibility(pureSeller, 'PARTNER').allowed).toBe(true);
      expect(evaluatePortalEligibility(pureAdvisor, 'CLIENT').allowed).toBe(false);
      expect(evaluatePortalEligibility(pureAdvisor, 'PARTNER').allowed).toBe(true);
    });

    it('blocks pure Farmer, Gardener, Buyer, Supervisor, Labour from Agent (PARTNER) login tab', () => {
      const farmer = { role: Role.FARMER, roles: [Role.CUSTOMER, Role.FARMER], deactivatedRoles: [] };
      const buyer = { role: Role.CUSTOMER, roles: [Role.CUSTOMER], deactivatedRoles: [] };
      const supervisor = { role: Role.SUPERVISOR, roles: [Role.SUPERVISOR, Role.CUSTOMER], deactivatedRoles: [] };
      const labour = { role: Role.LABOUR, roles: [Role.LABOUR, Role.CUSTOMER], deactivatedRoles: [] };

      expect(evaluatePortalEligibility(farmer, 'CLIENT').allowed).toBe(true);
      expect(evaluatePortalEligibility(farmer, 'PARTNER').allowed).toBe(false);
      expect(evaluatePortalEligibility(buyer, 'CLIENT').allowed).toBe(true);
      expect(evaluatePortalEligibility(buyer, 'PARTNER').allowed).toBe(false);
      expect(evaluatePortalEligibility(supervisor, 'CLIENT').allowed).toBe(true);
      expect(evaluatePortalEligibility(supervisor, 'PARTNER').allowed).toBe(false);
      expect(evaluatePortalEligibility(labour, 'CLIENT').allowed).toBe(true);
      expect(evaluatePortalEligibility(labour, 'PARTNER').allowed).toBe(false);
    });

    it('blocks all Admin Panel staff roles from both CLIENT and PARTNER login tabs', () => {
      for (const staffRole of [
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.MANAGER,
        Role.OPERATOR,
        Role.TECHNICAL_TRAINER,
        Role.ACCOUNTANT,
      ]) {
        const staff = { role: staffRole, roles: [staffRole, Role.CUSTOMER], deactivatedRoles: [] };
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

