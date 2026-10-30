import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClosService {
  constructor(private readonly prisma: PrismaService) {}

  async updateDescription(id: number, description: string) {
    const clo = await this.prisma.cLO.findUnique({ where: { id } });
    if (!clo) {
      throw new NotFoundException(`Không tìm thấy CLO có ID ${id}`);
    }

    return this.prisma.cLO.update({
      where: { id },
      data: { description: description.trim() },
      select: {
        id: true,
        code: true,
        description: true,
        majorId: true,
      },
    });
  }
}
