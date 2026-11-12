export declare const COMPLIANCE_CATEGORIES: readonly ["MCA_ROC", "GST", "INCOME_TAX_TDS", "AGRI_LICENSE", "PAYMENT_GATEWAY", "LEGAL_NOTICE", "AGREEMENT"];
export declare const COMPLIANCE_STATUSES: readonly ["PENDING", "IN_PROGRESS", "COMPLIANT", "OVERDUE"];
export declare class CreateComplianceRecordDto {
    category: (typeof COMPLIANCE_CATEGORIES)[number];
    title: string;
    authority?: string;
    referenceNo?: string;
    dueDate?: string;
    filedDate?: string;
    status?: (typeof COMPLIANCE_STATUSES)[number];
    assignedTo?: string;
    documentUrl?: string;
    notes?: string;
}
export declare class UpdateComplianceRecordDto {
    category?: (typeof COMPLIANCE_CATEGORIES)[number];
    title?: string;
    authority?: string;
    referenceNo?: string;
    dueDate?: string;
    filedDate?: string;
    status?: (typeof COMPLIANCE_STATUSES)[number];
    assignedTo?: string;
    documentUrl?: string;
    notes?: string;
}
