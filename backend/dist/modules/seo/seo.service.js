"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var SeoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoService = exports.OFFICIAL_SEO_URLS = exports.INDEXNOW_KEY = void 0;
const common_1 = require("@nestjs/common");
const https = __importStar(require("https"));
exports.INDEXNOW_KEY = '7c23f4c12cd8c5dcddf6d149b8339b9f';
exports.OFFICIAL_SEO_URLS = [
    'https://farmsking.in/',
    'https://farmsking.in/ai-doctor',
    'https://farmsking.in/crop-disease-scanner',
    'https://farmsking.in/dose',
    'https://farmsking.in/shop',
    'https://farmsking.in/order-tracking',
    'https://farmsking.in/crop-intelligence',
    'https://farmsking.in/kisan-crop-intelligence-engine.html',
    'https://farmsking.in/kisan-doctor-advisory.html',
    'https://farmsking.in/punjab-kheti-advisory.html',
    'https://farmsking.in/reverse-sowing-engine.html',
    'https://farmsking.in/surinder-agro-farm.html',
    'https://farmsking.in/about-farmsking.html',
    'https://farmsking.in/seller-dashboard',
    'https://farmsking.in/seller-payouts',
    'https://farmsking.in/compliance',
    'https://farmsking.in/contact-us',
    'https://farmsking.in/terms',
    'https://farmsking.in/privacy-policy',
    'https://farmsking.in/refund-policy',
    'https://farmsking.in/shipping-policy',
    'https://farmsking.in/llms.txt',
    'https://farmsking.in/llms-full.txt',
    'https://farmsking.in/ai-knowledge.json',
    'https://farmsking.in/sitemap.xml',
];
let SeoService = SeoService_1 = class SeoService {
    constructor() {
        this.logger = new common_1.Logger(SeoService_1.name);
        this.submissionInterval = null;
        this.lastReport = {
            lastSubmittedAt: null,
            urlsCount: exports.OFFICIAL_SEO_URLS.length,
            accepted: false,
            frequency: 'Every 12 hours (Automated)',
            endpoints: {},
            nextScheduledSubmissionAt: null,
        };
    }
    onApplicationBootstrap() {
        this.logger.log('🌐 Initializing FarmsKing Automated SEO & AI Search Engine Submitter...');
        const startupTimer = setTimeout(() => {
            this.submitAllUrls().catch((err) => {
                this.logger.warn(`Startup SEO submission warning: ${err?.message || err}`);
            });
        }, 15000);
        startupTimer.unref();
        const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
        this.submissionInterval = setInterval(() => {
            this.logger.log('⏰ Running scheduled 12-hour SEO & AI search re-indexing submission...');
            this.submitAllUrls().catch((err) => {
                this.logger.warn(`Scheduled SEO submission error: ${err?.message || err}`);
            });
        }, TWELVE_HOURS_MS);
        this.submissionInterval.unref();
        this.lastReport.nextScheduledSubmissionAt = new Date(Date.now() + 15000).toISOString();
    }
    onModuleDestroy() {
        if (this.submissionInterval) {
            clearInterval(this.submissionInterval);
            this.submissionInterval = null;
        }
    }
    async submitAllUrls() {
        const payload = {
            host: 'farmsking.in',
            key: exports.INDEXNOW_KEY,
            keyLocation: `https://farmsking.in/${exports.INDEXNOW_KEY}.txt`,
            urlList: exports.OFFICIAL_SEO_URLS,
        };
        const endpointsResults = {};
        try {
            const resIndexNow = await this.postJson('https://api.indexnow.org/indexnow', payload);
            endpointsResults['api.indexnow.org'] = resIndexNow;
        }
        catch (e) {
            endpointsResults['api.indexnow.org'] = { error: e.message };
        }
        try {
            const resBing = await this.postJson('https://www.bing.com/indexnow', payload);
            endpointsResults['www.bing.com'] = resBing;
        }
        catch (e) {
            endpointsResults['www.bing.com'] = { error: e.message };
        }
        const accepted = endpointsResults['api.indexnow.org']?.statusCode === 202 ||
            endpointsResults['api.indexnow.org']?.statusCode === 200 ||
            endpointsResults['www.bing.com']?.statusCode === 202 ||
            endpointsResults['www.bing.com']?.statusCode === 200;
        const now = new Date();
        const nextSubmission = new Date(now.getTime() + 12 * 60 * 60 * 1000);
        this.lastReport = {
            lastSubmittedAt: now.toISOString(),
            urlsCount: exports.OFFICIAL_SEO_URLS.length,
            accepted,
            frequency: 'Every 12 hours (Automated)',
            endpoints: endpointsResults,
            nextScheduledSubmissionAt: nextSubmission.toISOString(),
        };
        if (accepted) {
            this.logger.log(`✅ Automated SEO & AI Search Submission ACCEPTED (HTTP 202) for ${exports.OFFICIAL_SEO_URLS.length} canonical URLs.`);
        }
        else {
            this.logger.warn(`⚠️ Automated SEO Submission response: ${JSON.stringify(endpointsResults)}`);
        }
        return this.lastReport;
    }
    getStatus() {
        return this.lastReport;
    }
    postJson(urlStr, data) {
        return new Promise((resolve) => {
            try {
                const url = new URL(urlStr);
                const postBody = JSON.stringify(data);
                const req = https.request({
                    hostname: url.hostname,
                    port: url.port || 443,
                    path: url.pathname + url.search,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Content-Length': Buffer.byteLength(postBody),
                        'User-Agent': 'FarmsKing-SEO-Bot/2.0 (+https://farmsking.in)',
                    },
                    timeout: 15000,
                }, (res) => {
                    let body = '';
                    res.on('data', (chunk) => {
                        body += chunk;
                    });
                    res.on('end', () => {
                        resolve({
                            statusCode: res.statusCode,
                            statusMessage: res.statusMessage,
                            body,
                        });
                    });
                });
                req.on('error', (err) => resolve({ error: err.message }));
                req.on('timeout', () => {
                    req.destroy();
                    resolve({ error: 'Request timed out' });
                });
                req.write(postBody);
                req.end();
            }
            catch (e) {
                resolve({ error: e.message });
            }
        });
    }
};
exports.SeoService = SeoService;
exports.SeoService = SeoService = SeoService_1 = __decorate([
    (0, common_1.Injectable)()
], SeoService);
//# sourceMappingURL=seo.service.js.map