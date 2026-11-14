import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';

@ApiTags('super-admin')
@Controller('v1/super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('tenants')
  async getTenants() {
    return this.superAdminService.getTenants();
  }

  @Get('analytics')
  async getPlatformAnalytics() {
    return this.superAdminService.getPlatformAnalytics();
  }

  @Patch('tenants/:id/status')
  async updateTenantStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.superAdminService.updateTenantStatus(id, status);
  }

  @Patch('tenants/:id/plan')
  async updateTenantPlan(
    @Param('id') id: string,
    @Body('plan') plan: string,
  ) {
    return this.superAdminService.updateTenantPlan(id, plan);
  }
}
