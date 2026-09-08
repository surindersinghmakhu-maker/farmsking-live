import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { ResolveCallRequestDto } from './dto/resolve-call-request.dto';
import { ChatGateway } from '../chat/chat.gateway';
export declare class CallRequestsService {
    private readonly prisma;
    private readonly notificationsService;
    private readonly chatGateway;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, chatGateway: ChatGateway);
    create(farmer: AuthUser): Promise<{
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
            photoUrl: string | null;
        };
        advisor: {
            id: string;
            mobile: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CallRequestStatus;
        farmerId: string;
        advisorId: string;
        resolvedAt: Date | null;
        resolvedComment: string | null;
    }>;
    getMyPending(farmer: AuthUser): import(".prisma/client").Prisma.Prisma__CallRequestClient<({
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
            photoUrl: string | null;
        };
        advisor: {
            id: string;
            mobile: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CallRequestStatus;
        farmerId: string;
        advisorId: string;
        resolvedAt: Date | null;
        resolvedComment: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    listMine(advisor: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
            photoUrl: string | null;
        };
        advisor: {
            id: string;
            mobile: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CallRequestStatus;
        farmerId: string;
        advisorId: string;
        resolvedAt: Date | null;
        resolvedComment: string | null;
    })[]>;
    resolve(advisor: AuthUser, id: string, dto: ResolveCallRequestDto): Promise<{
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
            photoUrl: string | null;
        };
        advisor: {
            id: string;
            mobile: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CallRequestStatus;
        farmerId: string;
        advisorId: string;
        resolvedAt: Date | null;
        resolvedComment: string | null;
    }>;
}
