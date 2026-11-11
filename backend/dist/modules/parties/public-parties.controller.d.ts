import { PartiesService } from './parties.service';
import { LookupBuyerStatementDto } from './dto/lookup-buyer-statement.dto';
export declare class PublicPartiesController {
    private readonly partiesService;
    constructor(partiesService: PartiesService);
    lookupStatement(dto: LookupBuyerStatementDto): Promise<{
        found: boolean;
        farmer: {
            name: string;
            farmName: string;
            mobile: string;
            kingId: string | null;
            village: string | null;
            district: string | null;
            id?: undefined;
            state?: undefined;
        };
        buyerMobile: string;
        message: string;
        buyerParty?: undefined;
        statement?: undefined;
        arhtiyaHisab?: undefined;
    } | {
        found: boolean;
        farmer: {
            id: string;
            name: string;
            farmName: string;
            mobile: string;
            kingId: string | null;
            village: string | null;
            district: string | null;
            state: string | null;
        };
        buyerParty: {
            name: string | undefined;
            mobile: string;
            address: string | null | undefined;
            kingId: string | null;
            shopNumber: string | null;
            mandiName: string | null;
        };
        statement: {
            party: {
                isUnified: boolean;
                id: string;
                mobile: string | null;
                name: string;
                createdAt: Date;
                deletedAt: Date | null;
                ownerId: string;
                address: string | null;
                kingId?: undefined;
            } | {
                id: string;
                ownerId: string | null;
                name: string;
                address: string;
                mobile: string | null;
                createdAt: Date;
                kingId: string;
                isUnified: boolean;
            };
            balance: number;
            entries: any[];
        };
        arhtiyaHisab: any;
        buyerMobile?: undefined;
        message?: undefined;
    }>;
}
