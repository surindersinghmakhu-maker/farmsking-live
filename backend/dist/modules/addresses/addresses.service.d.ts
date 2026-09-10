import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateAddressDto } from './dto/create-address.dto';
export declare class AddressesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(user: AuthUser, dto: CreateAddressDto): import(".prisma/client").Prisma.Prisma__CustomerAddressClient<{
        id: string;
        mobile: string | null;
        district: string;
        state: string;
        pincode: string;
        postOffice: string;
        createdAt: Date;
        ownerId: string;
        tag: string;
        line: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    listMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        mobile: string | null;
        district: string;
        state: string;
        pincode: string;
        postOffice: string;
        createdAt: Date;
        ownerId: string;
        tag: string;
        line: string;
    }[]>;
    remove(user: AuthUser, id: string): Promise<{
        success: boolean;
    }>;
    update(user: AuthUser, id: string, dto: Partial<CreateAddressDto>): Promise<{
        id: string;
        mobile: string | null;
        district: string;
        state: string;
        pincode: string;
        postOffice: string;
        createdAt: Date;
        ownerId: string;
        tag: string;
        line: string;
    }>;
}
