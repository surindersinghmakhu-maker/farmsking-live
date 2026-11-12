import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('dashboards')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('farmer')
  getFarmerDashboard() {
    return this.dashboardService.getFarmerDashboard();
  }

  @Get('advisor')
  getAdvisorDashboard() {
    return this.dashboardService.getAdvisorDashboard();
  }

  @Get('garden-advisor')
  getGardenAdvisorDashboard() {
    return this.dashboardService.getGardenAdvisorDashboard();
  }

  @Get('gardener')
  getGardenerDashboard() {
    return this.dashboardService.getGardenerDashboard();
  }

  @Get('customer')
  getCustomerDashboard() {
    return this.dashboardService.getCustomerDashboard();
  }

  @Get('business-partner')
  getPartnerDashboard() {
    return this.dashboardService.getPartnerDashboard();
  }
}
