import { Injectable, Logger, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DefaultModuleConfig {
  moduleKey: string;
  moduleName: string;
  maintenanceMessage: string;
}

export const DEFAULT_ISO_MODULES: DefaultModuleConfig[] = [
  {
    moduleKey: 'ADMIN',
    moduleName: 'Admin Control Center',
    maintenanceMessage: 'The Admin Management module is currently undergoing scheduled ISO compliance maintenance.',
  },
  {
    moduleKey: 'ECOMMERCE',
    moduleName: 'AgriStore E-Commerce',
    maintenanceMessage: 'AgriStore E-Commerce & Shopping is currently under scheduled maintenance.',
  },
  {
    moduleKey: 'CUSTOMER_FARMER_DASHBOARD',
    moduleName: 'Customer / Farmer Dashboard',
    maintenanceMessage: 'Customer & Farmer Tools are undergoing scheduled maintenance.',
  },
  {
    moduleKey: 'FARMER_DOCTOR',
    moduleName: 'Farmer Doctor & Crop Consultations',
    maintenanceMessage: 'Farmer Doctor Services are temporarily paused for maintenance.',
  },
  {
    moduleKey: 'GARDENER_DASHBOARD',
    moduleName: 'Gardener Dashboard',
    maintenanceMessage: 'Gardener Portal & Tools are currently undergoing maintenance.',
  },
  {
    moduleKey: 'GARDEN_ADVISOR',
    moduleName: 'Garden Advisor Services',
    maintenanceMessage: 'Garden Advisor Portal is currently undergoing scheduled maintenance.',
  },
  {
    moduleKey: 'STAFF_PORTAL',
    moduleName: 'Staff Portal & Technical Trainers',
    maintenanceMessage: 'Staff & Technical Trainer Services are under scheduled maintenance.',
  },
  {
    moduleKey: 'WALLET',
    moduleName: 'Wallet & Payout Engine',
    maintenanceMessage: 'Wallet Services & Payout operations are under scheduled maintenance.',
  },
  {
    moduleKey: 'ACCOUNTS',
    moduleName: 'Accounts & Financial Ledger',
    maintenanceMessage: 'Accounts & Financial Ledger module is undergoing scheduled maintenance.',
  },
];

@Injectable()
export class IsoControlsService implements OnModuleInit {
  private readonly logger = new Logger(IsoControlsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    setTimeout(() => {
      this.seedDefaultModules().catch(err => this.logger.error('Boot seed failed', err));
    }, 5000);
  }

  /** Seed initial ISO module control records if missing */
  async seedDefaultModules() {
    try {
      for (const mod of DEFAULT_ISO_MODULES) {
        const existing = await this.prisma.isoModuleControl.findUnique({
          where: { moduleKey: mod.moduleKey },
        });
        if (!existing) {
          await this.prisma.isoModuleControl.create({
            data: {
              moduleKey: mod.moduleKey,
              moduleName: mod.moduleName,
              isEnabled: true,
              maintenanceMessage: mod.maintenanceMessage,
            },
          });
          this.logger.log(`Initialized ISO Module Control: ${mod.moduleKey}`);
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to seed ISO module controls: ${err.message}`);
    }
  }

  /** Get all ISO module controls for public/user status check */
  async getAllModuleControls() {
    return this.prisma.isoModuleControl.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Get single module control status */
  async getModuleControl(moduleKey: string) {
    const mod = await this.prisma.isoModuleControl.findUnique({
      where: { moduleKey: moduleKey.toUpperCase() },
    });
    if (!mod) {
      throw new NotFoundException(`ISO Module ${moduleKey} not found.`);
    }
    return mod;
  }

  /** Toggle ISO module ON/OFF and create ISO Audit Log */
  async toggleModule(moduleKey: string, isEnabled: boolean, maintenanceMessage?: string, actorId?: string, actorName?: string) {
    const key = moduleKey.toUpperCase();
    const existing = await this.prisma.isoModuleControl.findUnique({
      where: { moduleKey: key },
    });

    if (!existing) {
      throw new NotFoundException(`ISO Module ${moduleKey} not found.`);
    }

    const updated = await this.prisma.isoModuleControl.update({
      where: { moduleKey: key },
      data: {
        isEnabled,
        maintenanceMessage: maintenanceMessage ?? existing.maintenanceMessage,
        updatedById: actorId,
      },
    });

    // Generate ISO Audit Log entry
    await this.prisma.isoAuditLog.create({
      data: {
        action: 'MODULE_TOGGLE',
        moduleKey: key,
        actorId: actorId || 'SYSTEM_ADMIN',
        actorName: actorName || 'Admin User',
        details: {
          previousState: existing.isEnabled,
          newState: isEnabled,
          maintenanceMessage: updated.maintenanceMessage,
        },
      },
    });

    this.logger.log(`ISO Module [${key}] state toggled to ${isEnabled} by ${actorName || actorId}`);
    return updated;
  }

  /** Fetch ISO audit logs */
  async getAuditLogs() {
    return this.prisma.isoAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
