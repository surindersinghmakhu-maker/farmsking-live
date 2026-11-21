import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
export declare class AddressesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(user: AuthUser, dto: CreateAddressDto): Promise<{
        name: string | null;
        mobile: string | null;
        id: string;
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
        name: string | null;
        mobile: string | null;
        id: string;
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
        name: string | null;
        mobile: string | null;
        id: string;
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
    update(user: AuthUser, id: string, dto: UpdateAddressDto): Promise<{
        name: string | null;
        mobile: string | null;
        id: string;
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
