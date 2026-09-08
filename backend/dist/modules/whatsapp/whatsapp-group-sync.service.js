"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WhatsAppGroupSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppGroupSyncService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const whatsapp_service_1 = require("./whatsapp.service");
const client_1 = require("@prisma/client");
let WhatsAppGroupSyncService = WhatsAppGroupSyncService_1 = class WhatsAppGroupSyncService {
    prisma;
    whatsappBotService;
    configService;
    logger = new common_1.Logger(WhatsAppGroupSyncService_1.name);
    syncIntervalMs = 30 * 60 * 1000;
    constructor(prisma, whatsappBotService, configService) {
        this.prisma = prisma;
        this.whatsappBotService = whatsappBotService;
        this.configService = configService;
    }
    async onModuleInit() {
        this.logger.log('🚀 Initializing WhatsApp Group Sync Service...');
        setTimeout(() => {
            this.syncAdvisorWhatsAppGroup().catch((err) => this.logger.error('Boot-time WhatsApp group sync failed:', err));
        }, 15000);
        setInterval(() => {
            this.logger.log('⏰ Running scheduled WhatsApp Group member reconciliation sync...');
            this.syncAdvisorWhatsAppGroup().catch((err) => this.logger.error('Scheduled WhatsApp group sync failed:', err));
        }, this.syncIntervalMs);
    }
    async resolveGroupJidFromValue(value) {
        const trimmed = value.trim();
        if (!trimmed)
            return '';
        if (trimmed.includes('@g.us'))
            return trimmed;
        if (trimmed.startsWith('https://chat.whatsapp.com/')) {
            const code = trimmed.replace('https://chat.whatsapp.com/', '').split('?')[0].trim();
            if (!code)
                return '';
            try {
                const { isConnected } = this.whatsappBotService.getQrCodeStatus();
                if (!isConnected) {
                    this.logger.warn(`WhatsApp Bot not connected — cannot resolve invite link code: ${code}`);
                    return '';
                }
                const info = await this.whatsappBotService.getGroupInfoFromInviteCode(code);
                if (info?.id) {
                    this.logger.log(`Resolved invite link code ${code} to group JID: ${info.id}`);
                    try {
                        await this.prisma.appSetting.updateMany({
                            where: { id: 'default', whatsappGroupJid: trimmed },
                            data: { whatsappGroupJid: info.id },
                        });
                    }
                    catch { }
                    return info.id;
                }
            }
            catch (err) {
                this.logger.error(`Failed to resolve WhatsApp invite link ${trimmed}:`, err);
            }
            return '';
        }
        return trimmed;
    }
    async getAdvisorGroupJid(advisorId) {
        if (advisorId) {
            try {
                const advisor = await this.prisma.user.findUnique({
                    where: { id: advisorId },
                    select: { whatsappGroupJid: true },
                });
                if (advisor?.whatsappGroupJid) {
                    return this.resolveGroupJidFromValue(advisor.whatsappGroupJid);
                }
            }
            catch { }
        }
        try {
            const settings = await this.prisma.appSetting.findUnique({
                where: { id: 'default' },
            });
            if (settings?.whatsappGroupJid) {
                return this.resolveGroupJidFromValue(settings.whatsappGroupJid);
            }
        }
        catch { }
        return (this.configService.get('WHATSAPP_ADVISOR_GROUP_JID') ||
            process.env.WHATSAPP_ADVISOR_GROUP_JID ||
            '');
    }
    async getSyncSettings() {
        try {
            const settings = await this.prisma.appSetting.findUnique({
                where: { id: 'default' },
            });
            return {
                isEnabled: settings?.whatsappGroupSyncEnabled ?? true,
                autoAddEnabled: settings?.whatsappAutoAddEnabled ?? true,
                autoRemoveEnabled: settings?.whatsappAutoRemoveEnabled ?? true,
            };
        }
        catch {
            return { isEnabled: true, autoAddEnabled: true, autoRemoveEnabled: true };
        }
    }
    async isSyncEnabled() {
        const s = await this.getSyncSettings();
        return s.isEnabled;
    }
    async syncAdvisorWhatsAppGroup(advisorId) {
        const timestamp = new Date().toISOString();
        const { isEnabled, autoAddEnabled, autoRemoveEnabled } = await this.getSyncSettings();
        if (!isEnabled) {
            this.logger.log('⏸️ WhatsApp Group Sync is currently DISABLED in SuperAdmin AppSetting. Skipping sync.');
            return {
                groupJid: 'DISABLED_BY_SUPERADMIN',
                totalActiveEligible: 0,
                addedCount: 0,
                inviteSentCount: 0,
                removedCount: 0,
                skippedCount: 0,
                timestamp,
            };
        }
        const groupJid = await this.getAdvisorGroupJid(advisorId);
        if (!groupJid) {
            this.logger.warn('⚠️ WHATSAPP_ADVISOR_GROUP_JID is not configured in DB or .env. Skipping group sync.');
            return {
                groupJid: 'UNCONFIGURED',
                totalActiveEligible: 0,
                addedCount: 0,
                inviteSentCount: 0,
                removedCount: 0,
                skippedCount: 0,
                timestamp,
            };
        }
        const { isConnected } = this.whatsappBotService.getQrCodeStatus();
        if (!isConnected) {
            this.logger.warn('⚠️ WhatsApp bot is not connected. Skipping group sync.');
            return {
                groupJid,
                totalActiveEligible: 0,
                addedCount: 0,
                inviteSentCount: 0,
                removedCount: 0,
                skippedCount: 0,
                timestamp,
            };
        }
        this.logger.log(`🔍 Starting role-based sync for WhatsApp Group: ${groupJid} (AutoAdd: ${autoAddEnabled}, AutoRemove: ${autoRemoveEnabled})`);
        const eligibleUsers = await this.prisma.user.findMany({
            where: {
                deletedAt: null,
                mobile: { not: '' },
                whatsappGroupEnabled: true,
                OR: [
                    { role: { in: [client_1.Role.FARMER, client_1.Role.ADVISOR] } },
                    { roles: { hasSome: [client_1.Role.FARMER, client_1.Role.ADVISOR] } },
                ],
            },
            select: { id: true, mobile: true, name: true },
        });
        const eligibleMap = new Map();
        for (const u of eligibleUsers) {
            if (u.mobile)
                eligibleMap.set(u.mobile.trim(), u);
        }
        const protectedStaffUsers = await this.prisma.user.findMany({
            where: {
                deletedAt: null,
                mobile: { not: '' },
                OR: [
                    { role: { in: [client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN] } },
                    { roles: { hasSome: [client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN] } },
                ],
            },
            select: { mobile: true },
        });
        const protectedMobilesSet = new Set();
        for (const staff of protectedStaffUsers) {
            if (staff.mobile)
                protectedMobilesSet.add(staff.mobile.trim());
        }
        const currentGroupMemberJids = await this.whatsappBotService.getGroupParticipants(groupJid);
        const memberJidSet = new Set(currentGroupMemberJids.map((jid) => jid.toLowerCase()));
        let addedCount = 0;
        let inviteSentCount = 0;
        let removedCount = 0;
        let skippedCount = 0;
        for (const [mobile, user] of eligibleMap.entries()) {
            const userJid = this.whatsappBotService.formatJid(mobile).toLowerCase();
            if (!memberJidSet.has(userJid)) {
                if (autoAddEnabled) {
                    this.logger.log(`➕ Auto-adding FARMER/ADVISOR: ${user.name} (${mobile}) to WhatsApp Group`);
                    const result = await this.whatsappBotService.addParticipantToGroup(groupJid, mobile, user.name);
                    if (result.status === 'ADDED') {
                        addedCount++;
                    }
                    else if (result.status === 'INVITE_SENT') {
                        inviteSentCount++;
                    }
                    else {
                        skippedCount++;
                    }
                }
                else {
                    this.logger.log(`⏩ Auto-add is OFF. Skipping ${user.name} (${mobile}).`);
                    skippedCount++;
                }
            }
            else {
                skippedCount++;
            }
        }
        if (autoRemoveEnabled) {
            const allUsers = await this.prisma.user.findMany({
                where: { mobile: { not: '' } },
                select: { id: true, mobile: true, name: true, whatsappGroupEnabled: true, role: true, roles: true },
            });
            for (const user of allUsers) {
                if (!user.mobile)
                    continue;
                const cleanMobile = user.mobile.trim();
                if (protectedMobilesSet.has(cleanMobile))
                    continue;
                if (eligibleMap.has(cleanMobile))
                    continue;
                const userJid = this.whatsappBotService.formatJid(cleanMobile).toLowerCase();
                if (memberJidSet.has(userJid)) {
                    this.logger.warn(`➖ Not eligible (no FARMER/ADVISOR role OR switch OFF). Removing: ${user.name} (${cleanMobile})`);
                    const result = await this.whatsappBotService.removeParticipantFromGroup(groupJid, cleanMobile, user.name);
                    if (result.success)
                        removedCount++;
                }
            }
        }
        const summary = {
            groupJid,
            totalActiveEligible: eligibleMap.size,
            addedCount,
            inviteSentCount,
            removedCount,
            skippedCount,
            timestamp,
        };
        this.logger.log(`✅ WhatsApp Group Sync completed. Eligible: ${summary.totalActiveEligible}, Added: ${addedCount}, Invited: ${inviteSentCount}, Removed: ${removedCount}, Skipped: ${skippedCount}`);
        return summary;
    }
    async syncSingleFarmerGroupStatus(farmerId) {
        const isEnabled = await this.isSyncEnabled();
        if (!isEnabled) {
            return { action: 'DISABLED_BY_SUPERADMIN', success: false };
        }
        const farmer = await this.prisma.user.findUnique({
            where: { id: farmerId },
            select: { id: true, mobile: true, name: true, whatsappGroupEnabled: true, role: true, roles: true },
        });
        if (!farmer || !farmer.mobile) {
            return { action: 'FARMER_NOT_FOUND_OR_NO_MOBILE', success: false };
        }
        const isStaff = farmer.role === client_1.Role.SUPER_ADMIN ||
            farmer.role === client_1.Role.ADMIN ||
            farmer.role === client_1.Role.ADVISOR ||
            (Array.isArray(farmer.roles) && farmer.roles.some((r) => [client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN, client_1.Role.ADVISOR].includes(r)));
        if (isStaff) {
            return { action: 'PROTECTED_STAFF_USER', success: true };
        }
        const now = new Date();
        const activeAssignment = await this.prisma.advisorAssignment.findFirst({
            where: {
                farmerId,
                status: client_1.AdvisorAssignmentStatus.ACTIVE,
                OR: [{ endDate: null }, { endDate: { gt: now } }],
            },
            select: { advisorId: true },
        });
        const advisorId = activeAssignment?.advisorId;
        const groupJid = await this.getAdvisorGroupJid(advisorId);
        if (!groupJid)
            return { action: 'SKIPPED_NO_GROUP_JID', success: false };
        const isEligible = !!activeAssignment && farmer.whatsappGroupEnabled === true;
        if (isEligible) {
            this.logger.log(`Instant Sync: Adding active farmer ${farmer.name} (${farmer.mobile}) to WhatsApp group ${groupJid}`);
            const res = await this.whatsappBotService.addParticipantToGroup(groupJid, farmer.mobile);
            return { action: res.status || 'ADDED', success: res.success };
        }
        else {
            this.logger.log(`Instant Sync: Plan expired or WhatsApp Switch OFF. Removing farmer ${farmer.name} (${farmer.mobile}) from group ${groupJid}`);
            const res = await this.whatsappBotService.removeParticipantFromGroup(groupJid, farmer.mobile);
            return { action: res.status || 'REMOVED', success: res.success };
        }
    }
    async autoAddNewUser(userId, mobile, name) {
        try {
            const { isEnabled, autoAddEnabled } = await this.getSyncSettings();
            if (!isEnabled || !autoAddEnabled) {
                this.logger.log(`⏩ Auto-add skipped for ${mobile} (sync disabled in settings).`);
                return;
            }
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { role: true, roles: true },
            });
            const eligibleRoles = [client_1.Role.FARMER, client_1.Role.ADVISOR];
            const hasEligibleRole = (user?.role && eligibleRoles.includes(user.role)) ||
                (Array.isArray(user?.roles) && user.roles.some((r) => eligibleRoles.includes(r)));
            if (!hasEligibleRole) {
                this.logger.log(`⏩ Skipping auto-add for ${mobile} — not a FARMER or ADVISOR.`);
                return;
            }
            const { isConnected } = this.whatsappBotService.getQrCodeStatus();
            if (!isConnected) {
                this.logger.warn(`⚠️ WhatsApp Bot not connected — skipping auto-add for ${mobile}.`);
                return;
            }
            const groupJid = await this.getAdvisorGroupJid();
            if (!groupJid) {
                this.logger.warn(`⚠️ No target WhatsApp group configured — skipping auto-add for ${mobile}.`);
                return;
            }
            this.logger.log(`🆕 FARMER/ADVISOR: Auto-adding ${name} (${mobile}) to WhatsApp group ${groupJid}`);
            const result = await this.whatsappBotService.addParticipantToGroup(groupJid, mobile, name);
            this.logger.log(`Auto-add result for ${mobile}: ${result.status}`);
        }
        catch (err) {
            this.logger.error(`Failed to auto-add user ${mobile} to WhatsApp group:`, err);
        }
    }
    async autoRemoveUser(userId, mobile, name) {
        try {
            const { isEnabled } = await this.getSyncSettings();
            if (!isEnabled) {
                this.logger.log(`⏩ Auto-remove skipped for ${mobile} (sync disabled).`);
                return;
            }
            const { isConnected } = this.whatsappBotService.getQrCodeStatus();
            if (!isConnected) {
                this.logger.warn(`⚠️ WhatsApp Bot not connected — cannot remove ${mobile} from group.`);
                return;
            }
            const groupJid = await this.getAdvisorGroupJid();
            if (!groupJid) {
                this.logger.warn(`⚠️ No target WhatsApp group configured — skipping remove for ${mobile}.`);
                return;
            }
            this.logger.log(`🔕 User turned WhatsApp Group OFF: Removing ${name} (${mobile}) from group ${groupJid}`);
            await this.whatsappBotService.removeParticipantFromGroup(groupJid, mobile, name);
        }
        catch (err) {
            this.logger.error(`Failed to auto-remove user ${mobile} from WhatsApp group:`, err);
        }
    }
};
exports.WhatsAppGroupSyncService = WhatsAppGroupSyncService;
exports.WhatsAppGroupSyncService = WhatsAppGroupSyncService = WhatsAppGroupSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        whatsapp_service_1.WhatsappBotService,
        config_1.ConfigService])
], WhatsAppGroupSyncService);
//# sourceMappingURL=whatsapp-group-sync.service.js.map