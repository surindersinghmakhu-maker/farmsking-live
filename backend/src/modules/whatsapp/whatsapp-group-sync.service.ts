import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappBotService } from './whatsapp.service';
import { AdvisorAssignmentStatus, FarmerSubscriptionPlan, SubscriptionPlanStatus, Role } from '@prisma/client';

export interface GroupSyncResult {
  groupJid: string;
  totalActiveEligible: number;
  addedCount: number;
  inviteSentCount: number;
  removedCount: number;
  skippedCount: number;
  timestamp: string;
}

@Injectable()
export class WhatsAppGroupSyncService implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppGroupSyncService.name);
  private syncIntervalMs = 30 * 60 * 1000; // 30 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappBotService: WhatsappBotService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Initializing WhatsApp Group Sync Service...');
    
    // Initial run 15 seconds after server boot
    setTimeout(() => {
      this.syncAdvisorWhatsAppGroup().catch((err) =>
        this.logger.error('Boot-time WhatsApp group sync failed:', err),
      );
    }, 15000);

    // Periodic scheduled worker loop (every 30 minutes)
    setInterval(() => {
      this.logger.log('⏰ Running scheduled WhatsApp Group member reconciliation sync...');
      this.syncAdvisorWhatsAppGroup().catch((err) =>
        this.logger.error('Scheduled WhatsApp group sync failed:', err),
      );
    }, this.syncIntervalMs);
  }

  /**
   * If stored value is a WhatsApp invite link (https://chat.whatsapp.com/CODE),
   * resolve it to the actual group JID using Baileys groupGetInviteInfo().
   * Otherwise return the value as-is (already a JID or empty string).
   */
  async resolveGroupJidFromValue(value: string): Promise<string> {
    const trimmed = value.trim();
    if (!trimmed) return '';

    // If it's already a JID like 120363XXXXXX@g.us return directly
    if (trimmed.includes('@g.us')) return trimmed;

    // If it's a WhatsApp invite link, extract invite code and resolve
    if (trimmed.startsWith('https://chat.whatsapp.com/')) {
      const code = trimmed.replace('https://chat.whatsapp.com/', '').split('?')[0].trim();
      if (!code) return '';
      try {
        const { isConnected } = this.whatsappBotService.getQrCodeStatus();
        if (!isConnected) {
          this.logger.warn(`WhatsApp Bot not connected — cannot resolve invite link code: ${code}`);
          return '';
        }
        const info = await this.whatsappBotService.getGroupInfoFromInviteCode(code);
        if (info?.id) {
          this.logger.log(`Resolved invite link code ${code} to group JID: ${info.id}`);
          // Persist the resolved JID back to AppSetting so future lookups are instant
          try {
            await this.prisma.appSetting.updateMany({
              where: { id: 'default', whatsappGroupJid: trimmed },
              data: { whatsappGroupJid: info.id },
            });
          } catch {}
          return info.id;
        }
      } catch (err) {
        this.logger.error(`Failed to resolve WhatsApp invite link ${trimmed}:`, err);
      }
      return '';
    }

    return trimmed;
  }

  /**
   * Get target Advisor WhatsApp Group JID from specific Advisor user, AppSetting DB, or .env fallback
   */
  async getAdvisorGroupJid(advisorId?: string): Promise<string> {
    if (advisorId) {
      try {
        const advisor = await this.prisma.user.findUnique({
          where: { id: advisorId },
          select: { whatsappGroupJid: true },
        });
        if (advisor?.whatsappGroupJid) {
          return this.resolveGroupJidFromValue(advisor.whatsappGroupJid);
        }
      } catch {}
    }

    try {
      const settings = await this.prisma.appSetting.findUnique({
        where: { id: 'default' },
      });
      if (settings?.whatsappGroupJid) {
        return this.resolveGroupJidFromValue(settings.whatsappGroupJid);
      }
    } catch {}

    return (
      this.configService.get<string>('WHATSAPP_ADVISOR_GROUP_JID') ||
      process.env.WHATSAPP_ADVISOR_GROUP_JID ||
      ''
    );
  }

  /**
   * Check WhatsApp Group Sync settings in SuperAdmin AppSetting
   */
  async getSyncSettings(): Promise<{ isEnabled: boolean; autoAddEnabled: boolean; autoRemoveEnabled: boolean }> {
    try {
      const settings = await this.prisma.appSetting.findUnique({
        where: { id: 'default' },
      });
      return {
        isEnabled: settings?.whatsappGroupSyncEnabled ?? true,
        autoAddEnabled: settings?.whatsappAutoAddEnabled ?? true,
        autoRemoveEnabled: settings?.whatsappAutoRemoveEnabled ?? true,
      };
    } catch {
      return { isEnabled: true, autoAddEnabled: true, autoRemoveEnabled: true };
    }
  }

  /**
   * Helper: Check if master WhatsApp sync is enabled
   */
  async isSyncEnabled(): Promise<boolean> {
    const s = await this.getSyncSettings();
    return s.isEnabled;
  }

  /**
   * Complete reconciliation of WhatsApp Group participants
   * Eligible = users with FARMER or ADVISOR role AND whatsappGroupEnabled = true
   */
  async syncAdvisorWhatsAppGroup(advisorId?: string): Promise<GroupSyncResult> {
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
      this.logger.warn(
        '⚠️ WHATSAPP_ADVISOR_GROUP_JID is not configured in DB or .env. Skipping group sync.',
      );
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

    // ── Eligible users: FARMER or ADVISOR role + whatsappGroupEnabled = true + not deleted
    const eligibleUsers = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        mobile: { not: '' },
        whatsappGroupEnabled: true,
        OR: [
          { role: { in: [Role.FARMER, Role.ADVISOR] } },
          { roles: { hasSome: [Role.FARMER, Role.ADVISOR] } },
        ],
      },
      select: { id: true, mobile: true, name: true },
    });

    // Map by clean mobile number
    const eligibleMap = new Map<string, { id: string; mobile: string; name: string }>();
    for (const u of eligibleUsers) {
      if (u.mobile) eligibleMap.set(u.mobile.trim(), u);
    }

    // ── Protected staff: SUPER_ADMIN / ADMIN — NEVER auto-removed
    const protectedStaffUsers = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        mobile: { not: '' },
        OR: [
          { role: { in: [Role.SUPER_ADMIN, Role.ADMIN] } },
          { roles: { hasSome: [Role.SUPER_ADMIN, Role.ADMIN] } },
        ],
      },
      select: { mobile: true },
    });
    const protectedMobilesSet = new Set<string>();
    for (const staff of protectedStaffUsers) {
      if (staff.mobile) protectedMobilesSet.add(staff.mobile.trim());
    }

    // ── Fetch current group member JIDs
    const currentGroupMemberJids = await this.whatsappBotService.getGroupParticipants(groupJid);
    const memberJidSet = new Set(currentGroupMemberJids.map((jid) => jid.toLowerCase()));

    let addedCount = 0;
    let inviteSentCount = 0;
    let removedCount = 0;
    let skippedCount = 0;

    // ── AUTO-ADD eligible users not yet in group
    for (const [mobile, user] of eligibleMap.entries()) {
      const userJid = this.whatsappBotService.formatJid(mobile).toLowerCase();
      if (!memberJidSet.has(userJid)) {
        if (autoAddEnabled) {
          this.logger.log(`➕ Auto-adding FARMER/ADVISOR: ${user.name} (${mobile}) to WhatsApp Group`);
          const result = await this.whatsappBotService.addParticipantToGroup(groupJid, mobile, user.name);
          if (result.status === 'ADDED') {
            addedCount++;
          } else if (result.status === 'INVITE_SENT') {
            inviteSentCount++;
          } else {
            skippedCount++;
          }
        } else {
          this.logger.log(`⏩ Auto-add is OFF. Skipping ${user.name} (${mobile}).`);
          skippedCount++;
        }
      } else {
        skippedCount++; // already in group
      }
    }

    // ── AUTO-REMOVE users in group who are no longer eligible
    if (autoRemoveEnabled) {
      const allUsers = await this.prisma.user.findMany({
        where: { mobile: { not: '' } },
        select: { id: true, mobile: true, name: true, whatsappGroupEnabled: true, role: true, roles: true },
      });

      for (const user of allUsers) {
        if (!user.mobile) continue;
        const cleanMobile = user.mobile.trim();

        // 🛡️ CRITICAL: SUPER_ADMIN and ADMIN must ALWAYS stay in the group
        if (protectedMobilesSet.has(cleanMobile)) continue;

        // Eligible users with switch ON stay safely
        if (eligibleMap.has(cleanMobile)) continue;

        const userJid = this.whatsappBotService.formatJid(cleanMobile).toLowerCase();
        if (memberJidSet.has(userJid)) {
          this.logger.warn(
            `➖ Not eligible (no FARMER/ADVISOR role OR switch OFF). Removing: ${user.name} (${cleanMobile})`,
          );
          const result = await this.whatsappBotService.removeParticipantFromGroup(groupJid, cleanMobile, user.name);
          if (result.success) removedCount++;
        }
      }
    }

    const summary: GroupSyncResult = {
      groupJid,
      totalActiveEligible: eligibleMap.size,
      addedCount,
      inviteSentCount,
      removedCount,
      skippedCount,
      timestamp,
    };

    this.logger.log(
      `✅ WhatsApp Group Sync completed. Eligible: ${summary.totalActiveEligible}, Added: ${addedCount}, Invited: ${inviteSentCount}, Removed: ${removedCount}, Skipped: ${skippedCount}`,
    );

    return summary;
  }

  /**
   * Sync group membership for a specific farmer immediately when their advisor plan or switch changes
   */
  async syncSingleFarmerGroupStatus(farmerId: string): Promise<{ action: string; success: boolean }> {
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

    // 🛡️ CRITICAL PROTECTION: Never auto-remove Admins or Advisors!
    const isStaff =
      farmer.role === Role.SUPER_ADMIN ||
      farmer.role === Role.ADMIN ||
      farmer.role === Role.ADVISOR ||
      (Array.isArray(farmer.roles) && farmer.roles.some((r) => [Role.SUPER_ADMIN, Role.ADMIN, Role.ADVISOR].includes(r as any)));

    if (isStaff) {
      return { action: 'PROTECTED_STAFF_USER', success: true };
    }

    const now = new Date();

    // Check if farmer has any active advisor assignment
    const activeAssignment = await this.prisma.advisorAssignment.findFirst({
      where: {
        farmerId,
        status: AdvisorAssignmentStatus.ACTIVE,
        OR: [{ endDate: null }, { endDate: { gt: now } }],
      },
      select: { advisorId: true },
    });

    const advisorId = activeAssignment?.advisorId;
    const groupJid = await this.getAdvisorGroupJid(advisorId);
    if (!groupJid) return { action: 'SKIPPED_NO_GROUP_JID', success: false };

    // Farmer is eligible only if they have an active plan AND whatsappGroupEnabled is true
    const isEligible = !!activeAssignment && farmer.whatsappGroupEnabled === true;

    if (isEligible) {
      this.logger.log(`Instant Sync: Adding active farmer ${farmer.name} (${farmer.mobile}) to WhatsApp group ${groupJid}`);
      const res = await this.whatsappBotService.addParticipantToGroup(groupJid, farmer.mobile);
      return { action: res.status || 'ADDED', success: res.success };
    } else {
      this.logger.log(`Instant Sync: Plan expired or WhatsApp Switch OFF. Removing farmer ${farmer.name} (${farmer.mobile}) from group ${groupJid}`);
      const res = await this.whatsappBotService.removeParticipantFromGroup(groupJid, farmer.mobile);
      return { action: res.status || 'REMOVED', success: res.success };
    }
  }

  /**
   * Auto-add a newly registered user to the global WhatsApp group immediately after signup.
   * Only adds if user has FARMER or ADVISOR role (not plain CUSTOMER).
   * Respects: whatsappGroupSyncEnabled, autoAddEnabled, bot connection status, and group configured.
   */
  async autoAddNewUser(userId: string, mobile: string, name: string): Promise<void> {
    try {
      const { isEnabled, autoAddEnabled } = await this.getSyncSettings();
      if (!isEnabled || !autoAddEnabled) {
        this.logger.log(`⏩ Auto-add skipped for ${mobile} (sync disabled in settings).`);
        return;
      }

      // Only FARMER and ADVISOR role users should be in the group
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, roles: true },
      });
      const eligibleRoles = [Role.FARMER, Role.ADVISOR];
      const hasEligibleRole =
        (user?.role && eligibleRoles.includes(user.role as Role)) ||
        (Array.isArray(user?.roles) && user.roles.some((r) => eligibleRoles.includes(r as Role)));

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
    } catch (err) {
      this.logger.error(`Failed to auto-add user ${mobile} to WhatsApp group:`, err);
    }
  }

  /**
   * Immediately remove a user from the WhatsApp group when they turn the group switch OFF.
   * Called from UsersService when whatsappGroupEnabled changes to false.
   */
  async autoRemoveUser(userId: string, mobile: string, name: string): Promise<void> {
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
    } catch (err) {
      this.logger.error(`Failed to auto-remove user ${mobile} from WhatsApp group:`, err);
    }
  }
}
