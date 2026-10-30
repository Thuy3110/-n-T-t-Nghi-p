import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SystemSettingsService } from './system-settings.service';

@Controller('system-settings')
@UseGuards(JwtAuthGuard)
export class SystemSettingsController {
  constructor(private readonly service: SystemSettingsService) {}

  @Get()
  get() { return this.service.get(); }

  @Put()
  update(@Body() body: Record<string, unknown>) { return this.service.update(body); }
}
