import { AppService } from './app.service';
import { PrismaService } from './modules/prisma/prisma.service';
export declare class AppController {
    private readonly appService;
    private readonly prisma;
    constructor(appService: AppService, prisma: PrismaService);
    getHello(): string;
    getHealth(): {
        status: string;
        timestamp: string;
    };
    setupAdmin(): Promise<{
        success: boolean;
        action: string;
        userId: string;
        mobile: string;
    }>;
}
