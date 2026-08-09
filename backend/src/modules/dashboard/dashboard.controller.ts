import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

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
