"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeRoleAlias = normalizeRoleAlias;
exports.hasActiveRole = hasActiveRole;
const client_1 = require("@prisma/client");
function normalizeRoleAlias(val) {
    if (val === 'BUSINESS_PARTNER')
        return client_1.Role.AGENT;
    return val;
}
function hasActiveRole(user, role) {
    if (!user)
        return false;
    const deactivated = user.deactivatedRoles ?? [];
    if (deactivated.includes(role))
        return false;
    if (user.role === role)
        return true;
    return (user.roles ?? []).includes(role);
}
//# sourceMappingURL=auth-user.util.js.map