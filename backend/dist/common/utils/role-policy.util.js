"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPLICIT_CLIENT_ROLES = exports.PARTNER_PORTAL_ROLES = exports.FARM_STAFF_ROLES = exports.ADMIN_STAFF_ROLES = void 0;
exports.getActiveRolesList = getActiveRolesList;
exports.validateRoleCombination = validateRoleCombination;
exports.assertRoleCombinationAllowed = assertRoleCombinationAllowed;
exports.pickBestPrimaryRole = pickBestPrimaryRole;
exports.evaluatePortalEligibility = evaluatePortalEligibility;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
exports.ADMIN_STAFF_ROLES = [
    client_1.Role.SUPER_ADMIN,
    client_1.Role.ADMIN,
    client_1.Role.MANAGER,
    client_1.Role.OPERATOR,
    client_1.Role.TECHNICAL_TRAINER,
    client_1.Role.ACCOUNTANT,
];
exports.FARM_STAFF_ROLES = [
    client_1.Role.SUPERVISOR,
    client_1.Role.LABOUR,
];
exports.PARTNER_PORTAL_ROLES = [
    client_1.Role.AGENT,
    client_1.Role.ADVISOR,
    client_1.Role.SELLER,
];
exports.EXPLICIT_CLIENT_ROLES = [
    client_1.Role.FARMER,
    client_1.Role.GARDENER,
    client_1.Role.TRADER,
    client_1.Role.SUPERVISOR,
    client_1.Role.LABOUR,
];
const OPERATIONAL_NON_CUSTOMER_ROLES = [
    client_1.Role.FARMER,
    client_1.Role.GARDENER,
    client_1.Role.SUPERVISOR,
    client_1.Role.LABOUR,
    client_1.Role.AGENT,
    client_1.Role.SELLER,
    client_1.Role.ADVISOR,
    client_1.Role.TRADER,
    ...exports.ADMIN_STAFF_ROLES,
];
const PRIMARY_ROLE_PRIORITY = [
    client_1.Role.SUPER_ADMIN,
    client_1.Role.ADMIN,
    client_1.Role.MANAGER,
    client_1.Role.ACCOUNTANT,
    client_1.Role.OPERATOR,
    client_1.Role.TECHNICAL_TRAINER,
    client_1.Role.SUPERVISOR,
    client_1.Role.LABOUR,
    client_1.Role.FARMER,
    client_1.Role.GARDENER,
    client_1.Role.TRADER,
    client_1.Role.ADVISOR,
    client_1.Role.AGENT,
    client_1.Role.SELLER,
    client_1.Role.CUSTOMER,
];
function getActiveRolesList(user) {
    const deactivated = new Set(user.deactivatedRoles ?? []);
    const combined = [user.role, ...(user.roles ?? [])].filter(Boolean);
    return Array.from(new Set(combined)).filter((r) => !deactivated.has(r));
}
function validateRoleCombination(roles) {
    const unique = Array.from(new Set(roles));
    const adminMatches = unique.filter((r) => exports.ADMIN_STAFF_ROLES.includes(r));
    if (adminMatches.length > 1) {
        return {
            valid: false,
            error: 'Admin Panel staff roles (Super Admin, Admin, Manager, Accountant, Operator, Technical Trainer) are single-role only and cannot be combined.',
        };
    }
    if (adminMatches.length === 1) {
        const nonBaseline = unique.filter((r) => r !== client_1.Role.CUSTOMER && !exports.ADMIN_STAFF_ROLES.includes(r));
        if (nonBaseline.length > 0) {
            return {
                valid: false,
                error: 'Admin Panel staff accounts cannot hold Farmer, Gardener, Supervisor, Labour, Agent, Seller, Advisor, or Trader roles.',
            };
        }
        return { valid: true };
    }
    if (unique.includes(client_1.Role.FARMER) && unique.includes(client_1.Role.GARDENER)) {
        return {
            valid: false,
            error: 'An account cannot be both Farmer and Gardener at the same time.',
        };
    }
    const farmStaffMatches = unique.filter((r) => exports.FARM_STAFF_ROLES.includes(r));
    if (farmStaffMatches.length > 0) {
        if (farmStaffMatches.length > 1) {
            return {
                valid: false,
                error: 'An account cannot hold both Supervisor and Labour Worker roles.',
            };
        }
        const staffRole = farmStaffMatches[0];
        const otherOperational = unique.filter((r) => r !== staffRole && r !== client_1.Role.CUSTOMER && OPERATIONAL_NON_CUSTOMER_ROLES.includes(r));
        if (otherOperational.length > 0) {
            return {
                valid: false,
                error: 'Farm Staff accounts (Supervisor and Labour Worker) are single-role only and cannot combine with Farmer, Gardener, Agent, Seller, Advisor, or Trader roles.',
            };
        }
    }
    return { valid: true };
}
function assertRoleCombinationAllowed(roles) {
    const result = validateRoleCombination(roles);
    if (!result.valid) {
        throw new common_1.ConflictException(result.error);
    }
}
function pickBestPrimaryRole(roles) {
    const unique = Array.from(new Set(roles));
    for (const candidate of PRIMARY_ROLE_PRIORITY) {
        if (unique.includes(candidate)) {
            return candidate;
        }
    }
    return unique[0] ?? client_1.Role.CUSTOMER;
}
function evaluatePortalEligibility(user, portal) {
    if (!portal)
        return { allowed: true };
    if (!user) {
        if (portal === 'PARTNER') {
            return {
                allowed: false,
                reason: 'No Agent account is registered with these details. Please switch to the User Login section for Farmer, Gardener, or Buyer accounts.',
            };
        }
        return { allowed: true };
    }
    const activeRoles = getActiveRolesList(user);
    if (activeRoles.some((r) => exports.ADMIN_STAFF_ROLES.includes(r))) {
        return {
            allowed: false,
            reason: 'Admin and Staff accounts (Super Admin, Admin, Manager, Operator, Technical Trainer) cannot sign in here. Please use the Admin Panel.',
        };
    }
    const isPartnerAccount = activeRoles.some((r) => exports.PARTNER_PORTAL_ROLES.includes(r));
    const hasExplicitClientRole = activeRoles.some((r) => exports.EXPLICIT_CLIENT_ROLES.includes(r));
    if (portal === 'PARTNER' && !isPartnerAccount) {
        return {
            allowed: false,
            reason: 'This account belongs to User Login (Farmer, Gardener, or Buyer). Please switch to the User Login section.',
        };
    }
    if (portal === 'CLIENT' && isPartnerAccount && !hasExplicitClientRole) {
        return {
            allowed: false,
            reason: 'This account is registered as an Agent account (Crop Doctor, Agent, or Seller). Please switch to the Agent Login section.',
        };
    }
    return { allowed: true };
}
//# sourceMappingURL=role-policy.util.js.map