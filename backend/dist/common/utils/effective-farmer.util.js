"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEffectiveFarmerId = getEffectiveFarmerId;
const client_1 = require("@prisma/client");
function getEffectiveFarmerId(user) {
    if ((user.role === client_1.Role.SUPERVISOR ||
        (Array.isArray(user.roles) && user.roles.includes(client_1.Role.SUPERVISOR))) &&
        user.employerFarmerId) {
        return user.employerFarmerId;
    }
    return user.id;
}
//# sourceMappingURL=effective-farmer.util.js.map