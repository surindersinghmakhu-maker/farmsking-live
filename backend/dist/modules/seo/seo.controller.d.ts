import { SeoService } from './seo.service';
export declare class SeoController {
    private readonly seoService;
    constructor(seoService: SeoService);
    getStatus(): any;
    triggerSubmission(): Promise<any>;
}
