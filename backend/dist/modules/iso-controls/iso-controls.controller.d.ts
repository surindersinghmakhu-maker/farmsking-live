import { IsoControlsService } from './iso-controls.service';
import type { AuthUser } from '../../common/types/auth-user.type';
export declare class IsoControlsController {
    private readonly isoControlsService;
    constructor(isoControlsService: IsoControlsService);
    getAllControls(): Promise<{
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
    toggleModule(moduleKey: string, body: {
        isEnabled: boolean;
        maintenanceMessage?: string;
    }, user: AuthUser): Promise<{
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
