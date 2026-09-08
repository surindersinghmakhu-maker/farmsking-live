import { PartyRole, PartyType } from '@prisma/client';
export declare class CreateUnifiedPartyDto {
    name: string;
    type?: PartyType;
    roles?: PartyRole[];
    mandiName?: string;
    shopNumber?: string;
    mobile?: string;
    address?: string;
    village?: string;
    district?: string;
    state?: string;
}
