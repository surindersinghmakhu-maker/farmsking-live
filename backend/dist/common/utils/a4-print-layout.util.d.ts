export interface A4DocumentOptions {
    title: string;
    documentNumber?: string;
    issueDate?: string;
    bodyHtml: string;
    badgeText?: string;
    extraStyles?: string;
    footerNote?: string;
    showCorporateHeader?: boolean;
}
export declare function generateStandardA4Html(opts: A4DocumentOptions): string;
