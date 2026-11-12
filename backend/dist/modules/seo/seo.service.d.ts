import { OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
export declare const INDEXNOW_KEY = "7c23f4c12cd8c5dcddf6d149b8339b9f";
export declare const OFFICIAL_SEO_URLS: string[];
export interface SeoSubmissionReport {
    lastSubmittedAt: string | null;
    urlsCount: number;
    accepted: boolean;
    frequency: string;
    endpoints: Record<string, {
        statusCode?: number;
        statusMessage?: string;
        error?: string;
    }>;
    nextScheduledSubmissionAt: string | null;
}
export declare class SeoService implements OnApplicationBootstrap, OnModuleDestroy {
    private readonly logger;
    private submissionInterval;
    private lastReport;
    onApplicationBootstrap(): void;
    onModuleDestroy(): void;
    submitAllUrls(): Promise<SeoSubmissionReport>;
    getStatus(): SeoSubmissionReport;
    private postJson;
}
