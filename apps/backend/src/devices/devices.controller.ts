import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import type {
  CreatePairingCodeDto,
  PairDeviceDto,
  SessionUser,
} from '@futora/types';
import { Auth } from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DevicesService } from './devices.service';

@ApiTags('Devices')
@Controller('v1/devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Post('pairing-code')
  @Auth('settings.manage')
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
  pairDevice(@Body() dto: PairDeviceDto, @Ip() ip: string) {
    return this.devices.pairDevice(dto, ip);
  }

  @Get()
  @Auth('settings.manage')
  listDevices(@CurrentUser() user: SessionUser) {
    return this.devices.listDevices(user.restaurantId);
  }

  @Post(':id/approve')
  @Auth('settings.manage')
  approveDevice(
    @CurrentUser() user: SessionUser,
    @Param('id') deviceId: string,
  ) {
    return this.devices.approveDevice(user.restaurantId, deviceId, user.id);
  }

  @Post(':id/revoke')
  @Auth('settings.manage')
  revokeDevice(
    @CurrentUser() user: SessionUser,
    @Param('id') deviceId: string,
  ) {
    return this.devices.revokeDevice(user.restaurantId, deviceId, user.id);
  }
}
