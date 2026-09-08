import type { AuthUser } from '../../common/types/auth-user.type';
import { CallRequestsService } from './call-requests.service';
import { ResolveCallRequestDto } from './dto/resolve-call-request.dto';
export declare class CallRequestsController {
    private readonly callRequestsService;
    constructor(callRequestsService: CallRequestsService);
    create(user: AuthUser): Promise<{
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
    getMyPending(user: AuthUser): import(".prisma/client").Prisma.Prisma__CallRequestClient<({
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
    listMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
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
    resolve(user: AuthUser, id: string, dto: ResolveCallRequestDto): Promise<{
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
