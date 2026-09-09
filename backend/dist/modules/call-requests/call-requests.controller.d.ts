import type { AuthUser } from '../../common/types/auth-user.type';
import { CallRequestsService } from './call-requests.service';
import { ResolveCallRequestDto } from './dto/resolve-call-request.dto';
export declare class CallRequestsController {
    private readonly callRequestsService;
    constructor(callRequestsService: CallRequestsService);
    create(user: AuthUser): Promise<{
        advisor: {
            id: string;
            mobile: string;
            name: string;
        };
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
            photoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CallRequestStatus;
        advisorId: string;
        farmerId: string;
        resolvedAt: Date | null;
        resolvedComment: string | null;
    }>;
    getMyPending(user: AuthUser): import(".prisma/client").Prisma.Prisma__CallRequestClient<({
        advisor: {
            id: string;
            mobile: string;
            name: string;
        };
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
            photoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CallRequestStatus;
        advisorId: string;
        farmerId: string;
        resolvedAt: Date | null;
        resolvedComment: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    listMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        advisor: {
            id: string;
            mobile: string;
            name: string;
        };
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
            photoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CallRequestStatus;
        advisorId: string;
        farmerId: string;
        resolvedAt: Date | null;
        resolvedComment: string | null;
    })[]>;
    resolve(user: AuthUser, id: string, dto: ResolveCallRequestDto): Promise<{
        advisor: {
            id: string;
            mobile: string;
            name: string;
        };
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
            photoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CallRequestStatus;
        advisorId: string;
        farmerId: string;
        resolvedAt: Date | null;
        resolvedComment: string | null;
    }>;
}
