"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIENT_CATEGORY_ROLES = exports.PARTNER_CATEGORY_ROLES = exports.STAFF_CATEGORY_ROLES = exports.EXPLICIT_CLIENT_ROLES = exports.PARTNER_PORTAL_ROLES = exports.FARM_STAFF_ROLES = exports.ADMIN_STAFF_ROLES = void 0;
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
exports.STAFF_CATEGORY_ROLES = exports.ADMIN_STAFF_ROLES;
exports.PARTNER_CATEGORY_ROLES = [client_1.Role.AGENT, client_1.Role.ADVISOR, client_1.Role.SELLER, client_1.Role.TRADER];
exports.CLIENT_CATEGORY_ROLES = [client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.CUSTOMER, client_1.Role.SUPERVISOR, client_1.Role.LABOUR];
function getActiveRolesList(user) {
    const deactivated = new Set(user.deactivatedRoles ?? []);
    const combined = [user.role, ...(user.roles ?? [])].filter(Boolean);
    return Array.from(new Set(combined)).filter((r) => !deactivated.has(r));
}
function validateRoleCombination(roles) {
    const unique = Array.from(new Set(roles));
    const staffMatches = unique.filter((r) => exports.ADMIN_STAFF_ROLES.includes(r));
    if (staffMatches.length > 1) {
        return {
            valid: false,
            error: 'Staff accounts can hold only one Staff role (Admin, Manager, Operator, Technical Staff, or Accountant).',
        };
    }
    if (unique.includes(client_1.Role.FARMER) && unique.includes(client_1.Role.GARDENER)) {
        return {
            valid: false,
            error: 'In the Client category, an account can hold only one role: Farmer OR Gardener.',
        };
    }
    const farmStaffMatches = unique.filter((r) => exports.FARM_STAFF_ROLES.includes(r));
    if (farmStaffMatches.length > 1) {
        return {
            valid: false,
            error: 'An account cannot hold both Supervisor and Labour Worker roles.',
        };
    }
    if ((unique.includes(client_1.Role.FARMER) || unique.includes(client_1.Role.GARDENER)) && farmStaffMatches.length > 0) {
        return {
            valid: false,
            error: 'Farm Staff roles (Supervisor or Labour) cannot combine with Farmer or Gardener on the same account.',
        };
    }
    const partnerMatches = unique.filter((r) => exports.PARTNER_CATEGORY_ROLES.includes(r));
    const isAdvisorAndAgentOnly = partnerMatches.length === 2 &&
        partnerMatches.includes(client_1.Role.ADVISOR) &&
        partnerMatches.includes(client_1.Role.AGENT);
    if (partnerMatches.length > 1 && !isAdvisorAndAgentOnly) {
        return {
            valid: false,
            error: 'In the Partner category, only Advisor (Crop Doctor / Garden Advisor) and Sales Manager (Agent) can combine on the same account. Seller and Trader accounts are dedicated.',
        };
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
                reason: 'Not registered as a FarmsKing Partner (Seller, Crop Doctor, Garden Advisor, or Sales Manager). Please contact FarmsKing Support to register, or switch to User Login.',
            };
        }
        return { allowed: true };
    }
    const activeRoles = getActiveRolesList(user);
    if (portal === 'CLIENT') {
        const clientRolesList = [client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.SUPERVISOR, client_1.Role.LABOUR, client_1.Role.TRADER];
        const hasClientRole = activeRoles.some((r) => clientRolesList.includes(r));
        if (!hasClientRole) {
            return {
                allowed: false,
                reason: 'This account has no active Client role. Please sign in through Partner Login or the Admin Portal.',
            };
        }
        return { allowed: true };
    }
    if (portal === 'PARTNER') {
        const hasPartnerRole = activeRoles.some((r) => exports.PARTNER_PORTAL_ROLES.includes(r));
        if (!hasPartnerRole) {
            return {
                allowed: false,
                reason: 'Not registered as a FarmsKing Partner (Seller, Crop Doctor, Garden Advisor, or Sales Manager). Please contact FarmsKing Support or apply below, or switch to User Login.',
            };
        }
        return { allowed: true };
    }
    return { allowed: true };
}
//# sourceMappingURL=role-policy.util.js.map