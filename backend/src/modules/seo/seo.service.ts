import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import * as https from 'https';

export const INDEXNOW_KEY = 'farmskinge4b8a2c1f9d3750862a4b6c8';

export const OFFICIAL_SEO_URLS = [
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

export interface SeoSubmissionReport {
  lastSubmittedAt: string | null;
  urlsCount: number;
  accepted: boolean;
  frequency: string;
  endpoints: Record<string, { statusCode?: number; statusMessage?: string; error?: string }>;
  nextScheduledSubmissionAt: string | null;
}

@Injectable()
export class SeoService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(SeoService.name);
  private submissionInterval: NodeJS.Timeout | null = null;
  private lastReport: SeoSubmissionReport = {
    lastSubmittedAt: null,
    urlsCount: OFFICIAL_SEO_URLS.length,
    accepted: false,
    frequency: 'Every 12 hours (Automated)',
    endpoints: {},
    nextScheduledSubmissionAt: null,
  };

  onApplicationBootstrap() {
    this.logger.log('🌐 Initializing FarmsKing Automated SEO & AI Search Engine Submitter...');
    // Initial submission 15 seconds after server bootstrap
    const startupTimer = setTimeout(() => {
      this.submitAllUrls().catch((err) => {
        this.logger.warn(`Startup SEO submission warning: ${err?.message || err}`);
      });
    }, 15000);
    startupTimer.unref();

    // Periodic submission every 12 hours (12 * 60 * 60 * 1000 ms)
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

  async submitAllUrls(): Promise<SeoSubmissionReport> {
    const payload = {
      host: 'farmsking.in',
      key: INDEXNOW_KEY,
      keyLocation: `https://farmsking.in/${INDEXNOW_KEY}.txt`,
      urlList: OFFICIAL_SEO_URLS,
    };

    const endpointsResults: Record<string, any> = {};

    // Submit to api.indexnow.org
    try {
      const resIndexNow = await this.postJson('https://api.indexnow.org/indexnow', payload);
      endpointsResults['api.indexnow.org'] = resIndexNow;
    } catch (e: any) {
      endpointsResults['api.indexnow.org'] = { error: e.message };
    }

    // Submit to www.bing.com/indexnow
    try {
      const resBing = await this.postJson('https://www.bing.com/indexnow', payload);
      endpointsResults['www.bing.com'] = resBing;
    } catch (e: any) {
      endpointsResults['www.bing.com'] = { error: e.message };
    }

    const accepted =
      endpointsResults['api.indexnow.org']?.statusCode === 202 ||
      endpointsResults['api.indexnow.org']?.statusCode === 200 ||
      endpointsResults['www.bing.com']?.statusCode === 202 ||
      endpointsResults['www.bing.com']?.statusCode === 200;

    const now = new Date();
    const nextSubmission = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    this.lastReport = {
      lastSubmittedAt: now.toISOString(),
      urlsCount: OFFICIAL_SEO_URLS.length,
      accepted,
      frequency: 'Every 12 hours (Automated)',
      endpoints: endpointsResults,
      nextScheduledSubmissionAt: nextSubmission.toISOString(),
    };

    if (accepted) {
      this.logger.log(
        `✅ Automated SEO & AI Search Submission ACCEPTED (HTTP 202) for ${OFFICIAL_SEO_URLS.length} canonical URLs.`,
      );
    } else {
      this.logger.warn(`⚠️ Automated SEO Submission response: ${JSON.stringify(endpointsResults)}`);
    }

    return this.lastReport;
  }

  getStatus(): SeoSubmissionReport {
    return this.lastReport;
  }

  private postJson(urlStr: string, data: any): Promise<any> {
    return new Promise((resolve) => {
      try {
        const url = new URL(urlStr);
        const postBody = JSON.stringify(data);
        const req = https.request(
          {
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
          },
          (res) => {
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
          },
        );

        req.on('error', (err) => resolve({ error: err.message }));
        req.on('timeout', () => {
          req.destroy();
          resolve({ error: 'Request timed out' });
        });

        req.write(postBody);
        req.end();
      } catch (e: any) {
        resolve({ error: e.message });
      }
    });
  }
}
