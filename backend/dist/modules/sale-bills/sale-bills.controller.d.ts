import type { AuthUser } from '../../common/types/auth-user.type';
import { SaleBillsService } from './sale-bills.service';
import { CreateSaleBillDto } from './dto/create-sale-bill.dto';
export declare class SaleBillsController {
    private readonly saleBillsService;
    constructor(saleBillsService: SaleBillsService);
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
    findAllMine(user: AuthUser): Promise<{
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
    findOne(user: AuthUser, id: string): Promise<any>;
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
}
