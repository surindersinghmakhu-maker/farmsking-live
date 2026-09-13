"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasActiveRole = hasActiveRole;
function hasActiveRole(user, role) {
    if (user.role === role)
        return true;
    return (user.roles ?? []).includes(role) && !(user.deactivatedRoles ?? []).includes(role);
}
//# sourceMappingURL=auth-user.util.js.map