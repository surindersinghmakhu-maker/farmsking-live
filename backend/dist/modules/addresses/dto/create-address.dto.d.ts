export declare class CreateAddressDto {
    tag: 'HOME' | 'FARM' | 'WORK';
    line: string;
    mobile?: string;
    postOffice: string;
    district: string;
    state: string;
    pincode: string;
}
