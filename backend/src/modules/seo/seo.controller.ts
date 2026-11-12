import { Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeoService } from './seo.service';
import type { SeoSubmissionReport } from './seo.service';

@ApiTags('SEO & AI Search Engine Automation')
@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get live SEO indexing & automated search submission status' })
  getStatus(): any {
    return this.seoService.getStatus();
  }

  @Post('submit')
  @ApiOperation({ summary: 'Trigger instant SEO & AI Search IndexNow submission' })
  async triggerSubmission(): Promise<any> {
    const report = await this.seoService.submitAllUrls();
    return {
      message: report.accepted
        ? 'SEO & AI Search Engine submission accepted successfully (HTTP 202)'
        : 'SEO submission dispatched with response recorded',
      report,
    };
  }
}
