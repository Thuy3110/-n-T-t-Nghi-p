import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  get() {
    return this.prisma.systemSetting.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
  }

  update(body: Record<string, unknown>) {
    return this.prisma.systemSetting.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        ...(typeof body.systemName === 'string' && { systemName: body.systemName.trim() }),
        ...(typeof body.institutionName === 'string' && { institutionName: body.institutionName.trim() }),
        ...(typeof body.supportEmail === 'string' && { supportEmail: body.supportEmail.trim() }),
        ...(typeof body.supportPhone === 'string' && { supportPhone: body.supportPhone.trim() }),
        ...(typeof body.defaultLanguage === 'string' && { defaultLanguage: body.defaultLanguage }),
        ...(typeof body.maintenanceMode === 'boolean' && { maintenanceMode: body.maintenanceMode }),
      },
      update: {
        ...(typeof body.systemName === 'string' && { systemName: body.systemName.trim() }),
        ...(typeof body.institutionName === 'string' && { institutionName: body.institutionName.trim() }),
        ...(typeof body.supportEmail === 'string' && { supportEmail: body.supportEmail.trim() }),
        ...(typeof body.supportPhone === 'string' && { supportPhone: body.supportPhone.trim() }),
        ...(typeof body.defaultLanguage === 'string' && { defaultLanguage: body.defaultLanguage }),
        ...(typeof body.maintenanceMode === 'boolean' && { maintenanceMode: body.maintenanceMode }),
      },
    });
  }
}
