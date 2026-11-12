"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEffectiveFarmerId = getEffectiveFarmerId;
const client_1 = require("@prisma/client");
const auth_user_util_1 = require("./auth-user.util");
function getEffectiveFarmerId(user) {
    if ((0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SUPERVISOR) && user.employerFarmerId) {
        return user.employerFarmerId;
    }
    return user.id;
}
//# sourceMappingURL=effective-farmer.util.js.map