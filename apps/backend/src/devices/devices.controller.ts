import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  Post,
  UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import {
  createPairingCodeSchema,
  pairDeviceSchema,
  type CreatePairingCodeDto,
  type PairDeviceDto,
  type SessionUser,
} from '@futora/types';
import { Auth } from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuditAction } from '../audit/audit-action';
import { DevicesService } from './devices.service';

@ApiTags('Devices')
@Controller('v1/devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Post('pairing-code')
  @Auth('device.manage')
  @UsePipes(new ZodValidationPipe(createPairingCodeSchema))
  createPairingCode(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreatePairingCodeDto,
  ) {
    return this.devices.createPairingCode(
      user.restaurantId,
      dto.outletId,
      user.id,
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('pair')
  @UsePipes(new ZodValidationPipe(pairDeviceSchema))
  pairDevice(@Body() dto: PairDeviceDto, @Ip() ip: string) {
    return this.devices.pairDevice(dto, ip);
  }

  @Get()
  @Auth('device.unlock')
  listDevices(@CurrentUser() user: SessionUser) {
    return this.devices.listDevices(user.restaurantId);
  }

  @Post(':id/approve')
  @Auth('device.manage')
  @AuditAction('approve', 'device')
  approveDevice(
    @CurrentUser() user: SessionUser,
    @Param('id') deviceId: string,
  ) {
    return this.devices.approveDevice(user.restaurantId, deviceId, user.id);
  }

  @Post(':id/revoke')
  @Auth('device.manage')
  @AuditAction('revoke', 'device')
  revokeDevice(
    @CurrentUser() user: SessionUser,
    @Param('id') deviceId: string,
  ) {
    return this.devices.revokeDevice(user.restaurantId, deviceId, user.id);
  }

  @Post(':id/unlock')
  @Auth('device.unlock')
  unlockDevice(
    @CurrentUser() user: SessionUser,
    @Param('id') deviceId: string,
  ) {
    return this.devices.unlockDevice(user.restaurantId, deviceId, user.id);
  }
}
