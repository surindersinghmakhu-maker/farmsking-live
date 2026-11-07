export declare class CreateAddressDto {
    tag: 'HOME' | 'FARM' | 'WORK';
    name?: string;
    line: string;
    mobile?: string;
    postOffice: string;
    district: string;
    state: string;
    pincode: string;
    isDefault?: boolean;
}
