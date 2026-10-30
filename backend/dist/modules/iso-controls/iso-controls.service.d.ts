import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export interface DefaultModuleConfig {
    moduleKey: string;
    moduleName: string;
    maintenanceMessage: string;
}
export declare const DEFAULT_ISO_MODULES: DefaultModuleConfig[];
export declare class IsoControlsService implements OnModuleInit {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    seedDefaultModules(): Promise<void>;
    getAllModuleControls(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedById: string | null;
        moduleKey: string;
        moduleName: string;
        isEnabled: boolean;
        maintenanceMessage: string | null;
    }[]>;
    getModuleControl(moduleKey: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedById: string | null;
        moduleKey: string;
        moduleName: string;
        isEnabled: boolean;
        maintenanceMessage: string | null;
    }>;
    toggleModule(moduleKey: string, isEnabled: boolean, maintenanceMessage?: string, actorId?: string, actorName?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedById: string | null;
        moduleKey: string;
        moduleName: string;
        isEnabled: boolean;
        maintenanceMessage: string | null;
    }>;
    getAuditLogs(): Promise<{
        id: string;
        createdAt: Date;
        moduleKey: string | null;
        actorId: string;
        action: string;
        actorName: string | null;
        details: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
}
