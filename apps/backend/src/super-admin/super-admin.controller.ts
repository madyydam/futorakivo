import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SuperAdminGuard } from './super-admin.guard';
import { CreateTenantDto, SuperAdminService } from './super-admin.service';

@ApiTags('super-admin')
@Controller('v1/super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  /**
   * Super Admin Login Endpoint with strict rate limiting (5 req/min).
   */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('auth/login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('totpCode') totpCode?: string,
  ) {
    return this.superAdminService.login(email, password, totpCode);
  }

  /**
   * Super Admin Logout audit endpoint.
   */
  @Post('auth/logout')
  @UseGuards(SuperAdminGuard)
  async logout(@Req() req: any) {
    const adminEmail = req.superAdmin?.email || 'admin@futoragroup.in';
    return this.superAdminService.logout(adminEmail);
  }

  /**
   * Verify Active Super Admin Session.
   */
  @Get('auth/me')
  @UseGuards(SuperAdminGuard)
  async getMe(@Req() req: any) {
    return {
      authenticated: true,
      user: req.superAdmin,
    };
  }

  @Get('tenants')
  @UseGuards(SuperAdminGuard)
  async getTenants() {
    return this.superAdminService.getTenants();
  }

  /**
   * Onboard / Provision a new restaurant directly from Super Admin.
   */
  @Post('tenants')
  @UseGuards(SuperAdminGuard)
  async createTenant(@Body() dto: CreateTenantDto, @Req() req: any) {
    const adminEmail = req.superAdmin?.email || 'admin@futoragroup.in';
    return this.superAdminService.createTenant(dto, adminEmail);
  }

  @Get('analytics')
  @UseGuards(SuperAdminGuard)
  async getPlatformAnalytics() {
    return this.superAdminService.getPlatformAnalytics();
  }

  @Get('plans')
  @UseGuards(SuperAdminGuard)
  getPlans() {
    return this.superAdminService.getPlans();
  }

  @Get('broadcasts')
  @UseGuards(SuperAdminGuard)
  getBroadcasts() {
    return this.superAdminService.getBroadcasts();
  }

  @Post('broadcasts')
  @UseGuards(SuperAdminGuard)
  createBroadcast(
    @Body('title') title: string,
    @Body('message') message: string,
    @Body('level') level: 'INFO' | 'WARNING' | 'CRITICAL',
  ) {
    return this.superAdminService.createBroadcast(
      title,
      message,
      level || 'INFO',
    );
  }

  @Patch('tenants/:id/status')
  @UseGuards(SuperAdminGuard)
  async updateTenantStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.superAdminService.updateTenantStatus(id, status);
  }

  @Patch('tenants/:id/plan')
  @UseGuards(SuperAdminGuard)
  async updateTenantPlan(
    @Param('id') id: string,
    @Body('plan') plan: string,
  ) {
    return this.superAdminService.updateTenantPlan(id, plan);
  }

  @Post('tenants/:id/extend-trial')
  @UseGuards(SuperAdminGuard)
  async extendTrial(@Param('id') id: string, @Body('days') days: number) {
    return this.superAdminService.extendTrial(id, Number(days) || 14);
  }

  /**
   * Cryptographically Signed Support Impersonation ("Login as Tenant").
   */
  @Post('impersonate/:restaurantId')
  @UseGuards(SuperAdminGuard)
  async impersonateTenant(
    @Param('restaurantId') restaurantId: string,
    @Req() req: any,
  ) {
    const adminEmail = req.superAdmin?.email || 'admin@futoragroup.in';
    return this.superAdminService.impersonateTenant(restaurantId, adminEmail);
  }

  /**
   * Emergency Killswitch / Freeze on a tenant.
   */
  @Post('tenants/:id/killswitch')
  @UseGuards(SuperAdminGuard)
  async killswitchTenant(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    const adminEmail = req.superAdmin?.email || 'admin@futoragroup.in';
    return this.superAdminService.killswitchTenant(id, reason, adminEmail);
  }

  /**
   * Hardware fleet monitoring.
   */
  @Get('hardware')
  @UseGuards(SuperAdminGuard)
  async getHardwareFleet() {
    return this.superAdminService.getHardwareFleet();
  }

  /**
   * Remote device revoke / unpair.
   */
  @Post('hardware/:id/revoke')
  @UseGuards(SuperAdminGuard)
  async revokeDevice(@Param('id') id: string, @Req() req: any) {
    const adminEmail = req.superAdmin?.email || 'admin@futoragroup.in';
    return this.superAdminService.revokeDevice(id, adminEmail);
  }

  /**
   * Approves tenant info & payment, generates 12-digit activation code (4-4-4).
   */
  @Post('tenants/:id/approve')
  @UseGuards(SuperAdminGuard)
  async approveTenant(@Param('id') id: string, @Req() req: any) {
    const adminEmail = req.superAdmin?.email || 'admin@futoragroup.in';
    return this.superAdminService.approveTenant(id, adminEmail);
  }

  /**
   * Public License Activation Endpoint (Rate limited to 5 attempts per 15 minutes).
   * Exact moment of activation starts the subscription timer!
   */
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  @Post('activate-license')
  async activateLicense(@Body('code') code: string) {
    return this.superAdminService.activateLicense(code);
  }

  /**
   * Real-time system health and database latency metrics.
   */
  @Get('health')
  @UseGuards(SuperAdminGuard)
  async getSystemHealth() {
    return this.superAdminService.getSystemHealth();
  }

  /**
   * Live platform audit logs trail.
   */
  @Get('audit-logs')
  @UseGuards(SuperAdminGuard)
  async getAuditLogs() {
    return this.superAdminService.getAuditLogs(50);
  }
}
