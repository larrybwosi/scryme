import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { AllowPublic } from '../../common/decorators/auth.decorator';
import { v2Context } from '../../common/decorators/v2-context.decorator';
import type { V2ApiContext } from '@repo/shared/server';

@ApiTags('Devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @AllowPublic()
  @Post('provision')
  @ApiOperation({ summary: 'Provision a new device using a setup token' })
  async provision(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.devicesService.provision(ctx, body);
  }
}
