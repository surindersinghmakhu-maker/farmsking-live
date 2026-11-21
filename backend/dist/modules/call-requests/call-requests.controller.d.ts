import type { AuthUser } from '../../common/types/auth-user.type';
import { CallRequestsService } from './call-requests.service';
import { ResolveCallRequestDto } from './dto/resolve-call-request.dto';
import { CreateCallRequestDto } from './dto/create-call-request.dto';
export declare class CallRequestsController {
    private readonly callRequestsService;
    constructor(callRequestsService: CallRequestsService);
    create(user: AuthUser, dto?: CreateCallRequestDto): Promise<{
        selectedCrop: {
            id: string | undefined;
            name: string;
            variety: string | null;
        } | null;
        notes: string | null;
        farmer: {
            name: string;
            mobile: string;
            id: string;
            kingId: string | null;
            photoUrl: string | null;
        };
        advisor: {
            name: string;
            mobile: string;
            id: string;
        };
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CallRequestStatus;
        farmerId: string;
        resolvedAt: Date | null;
        advisorId: string;
        resolvedComment: string | null;
    }>;
    getMyPending(user: AuthUser): import(".prisma/client").Prisma.Prisma__CallRequestClient<({
        farmer: {
            name: string;
            mobile: string;
            id: string;
            kingId: string | null;
            photoUrl: string | null;
        };
        advisor: {
            name: string;
            mobile: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CallRequestStatus;
        farmerId: string;
        resolvedAt: Date | null;
        advisorId: string;
        resolvedComment: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    listMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        farmer: {
            name: string;
            mobile: string;
            id: string;
            kingId: string | null;
            photoUrl: string | null;
        };
        advisor: {
            name: string;
            mobile: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CallRequestStatus;
        farmerId: string;
        resolvedAt: Date | null;
        advisorId: string;
        resolvedComment: string | null;
    })[]>;
    resolve(user: AuthUser, id: string, dto: ResolveCallRequestDto): Promise<{
        farmer: {
            name: string;
            mobile: string;
            id: string;
            kingId: string | null;
            photoUrl: string | null;
        };
        advisor: {
            name: string;
            mobile: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CallRequestStatus;
        farmerId: string;
        resolvedAt: Date | null;
        advisorId: string;
        resolvedComment: string | null;
    }>;
}
