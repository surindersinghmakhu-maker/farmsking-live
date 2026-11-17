import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SeoService } from './seo.service';

@ApiTags('SEO & AI Search Engine Automation')
@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get live SEO indexing & automated search submission status' })
  getStatus(): any {
    return this.seoService.getStatus();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('submit')
  @ApiOperation({ summary: 'Trigger instant SEO & AI Search IndexNow submission (Admin only)' })
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
