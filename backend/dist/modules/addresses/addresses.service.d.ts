import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateAddressDto } from './dto/create-address.dto';
export declare class AddressesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(user: AuthUser, dto: CreateAddressDto): Promise<{
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
        isDefault: boolean;
    }>;
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
        isDefault: boolean;
    }[]>;
    setDefault(user: AuthUser, id: string): Promise<{
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
        isDefault: boolean;
    }>;
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
        isDefault: boolean;
    }>;
}
