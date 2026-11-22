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
        advisorId: string;
        status: import(".prisma/client").$Enums.CallRequestStatus;
        id: string;
        createdAt: Date;
        farmerId: string;
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
        advisorId: string;
        status: import(".prisma/client").$Enums.CallRequestStatus;
        id: string;
        createdAt: Date;
        farmerId: string;
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
        advisorId: string;
        status: import(".prisma/client").$Enums.CallRequestStatus;
        id: string;
        createdAt: Date;
        farmerId: string;
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
        advisorId: string;
        status: import(".prisma/client").$Enums.CallRequestStatus;
        id: string;
        createdAt: Date;
        farmerId: string;
        resolvedAt: Date | null;
        resolvedComment: string | null;
    }>;
}
