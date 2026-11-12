"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertSupervisorPermission = assertSupervisorPermission;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const auth_user_util_1 = require("./auth-user.util");
const CATEGORY_TO_PERMISSION = {
    spray: client_1.SupervisorPermission.MANAGE_SPRAY_SCHEDULE,
    labour: client_1.SupervisorPermission.MANAGE_LABOUR_EXPENSES,
    advisory: client_1.SupervisorPermission.CROP_DOCTOR_CHAT,
    sales: client_1.SupervisorPermission.MANAGE_HARVEST_SALES,
};
async function assertSupervisorPermission(prisma, user, category, mode) {
    if (!user)
        return;
    if ((0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADMIN) ||
        (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SUPER_ADMIN) ||
        (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.FARMER) ||
        !(0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SUPERVISOR)) {
        return;
    }
    let cfg = null;
    try {
        const rows = await prisma.$queryRawUnsafe(`SELECT "supervisorFeaturesConfig" FROM "users" WHERE "id" = $1 LIMIT 1`, user.id);
        const rawCfg = rows?.[0]?.supervisorFeaturesConfig;
        if (rawCfg) {
            cfg = typeof rawCfg === 'string' ? JSON.parse(rawCfg) : rawCfg;
        }
    }
    catch {
        cfg = null;
    }
    if (cfg && typeof cfg === 'object' && Object.keys(cfg).length > 0 && cfg[category]) {
        if (cfg[category]?.[mode] === true) {
            return;
        }
        throw new common_1.ForbiddenException(`Supervisor does not have ${mode} access for the ${category} module. Ask the employer farmer to enable it.`);
    }
    const record = await prisma.user.findUnique({
        where: { id: user.id },
        select: { supervisorPermissions: true },
    });
    const requiredPerm = CATEGORY_TO_PERMISSION[category];
    if (!record?.supervisorPermissions?.includes(requiredPerm)) {
        throw new common_1.ForbiddenException(`Supervisor does not have ${requiredPerm} permission. Ask the employer farmer to grant access.`);
    }
}
//# sourceMappingURL=supervisor-permission.util.js.map