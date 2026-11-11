"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeRoleAlias = normalizeRoleAlias;
exports.hasActiveRole = hasActiveRole;
const client_1 = require("@prisma/client");
function normalizeRoleAlias(val) {
    if (val === 'AGENT')
        return client_1.Role.AGENT;
    return val;
}
function hasActiveRole(user, role) {
    if (user.role === role)
        return true;
    return (user.roles ?? []).includes(role) && !(user.deactivatedRoles ?? []).includes(role);
}
//# sourceMappingURL=auth-user.util.js.map