import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateSaleBillDto } from './dto/create-sale-bill.dto';
export declare class SaleBillsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private nextBillNo;
    create(user: AuthUser, dto: CreateSaleBillDto): Promise<{
        id: string;
        createdAt: Date;
        farmerId: string;
        partyId: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        billNo: string;
        farmerName: string;
        partyName: string;
        partyMobile: string | null;
        partyAddress: string | null;
        isCash: boolean;
        items: import("@prisma/client/runtime/library").JsonValue;
        totalItems: number;
        amountReceived: import("@prisma/client/runtime/library").Decimal;
        thisSaleBalance: import("@prisma/client/runtime/library").Decimal;
        previousBalance: import("@prisma/client/runtime/library").Decimal;
        netReceivable: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(user: AuthUser, id: string, dto: CreateSaleBillDto): Promise<{
        id: string;
        createdAt: Date;
        farmerId: string;
        partyId: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        billNo: string;
        farmerName: string;
        partyName: string;
        partyMobile: string | null;
        partyAddress: string | null;
        isCash: boolean;
        items: import("@prisma/client/runtime/library").JsonValue;
        totalItems: number;
        amountReceived: import("@prisma/client/runtime/library").Decimal;
        thisSaleBalance: import("@prisma/client/runtime/library").Decimal;
        previousBalance: import("@prisma/client/runtime/library").Decimal;
        netReceivable: import("@prisma/client/runtime/library").Decimal;
    }>;
    findOneOrThrow(user: AuthUser, id: string): Promise<any>;
    listMine(user: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        farmerId: string;
        partyId: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        billNo: string;
        farmerName: string;
        partyName: string;
        partyMobile: string | null;
        partyAddress: string | null;
        isCash: boolean;
        items: import("@prisma/client/runtime/library").JsonValue;
        totalItems: number;
        amountReceived: import("@prisma/client/runtime/library").Decimal;
        thisSaleBalance: import("@prisma/client/runtime/library").Decimal;
        previousBalance: import("@prisma/client/runtime/library").Decimal;
        netReceivable: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    countMine(user: AuthUser): Promise<{
        count: number;
    }>;
}
