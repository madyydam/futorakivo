import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
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

  @Get('plans')
  getPlans() {
    return this.superAdminService.getPlans();
  }

  @Get('broadcasts')
  getBroadcasts() {
    return this.superAdminService.getBroadcasts();
  }

  @Post('broadcasts')
  createBroadcast(
    @Body('title') title: string,
    @Body('message') message: string,
    @Body('level') level: 'INFO' | 'WARNING' | 'CRITICAL',
  ) {
    return this.superAdminService.createBroadcast(title, message, level || 'INFO');
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

  @Post('tenants/:id/extend-trial')
  async extendTrial(
    @Param('id') id: string,
    @Body('days') days: number,
  ) {
    return this.superAdminService.extendTrial(id, Number(days) || 14);
  }
}
