import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlosService {
  constructor(private readonly prisma: PrismaService) {}

  async findByMajor(majorId: number) {
    const major = await this.prisma.major.findUnique({
      where: { id: majorId },
      select: { id: true, code: true, name: true },
    });
    if (!major) {
      throw new NotFoundException(`Không tìm thấy ngành có ID ${majorId}`);
    }

    const plos = await this.prisma.pLO.findMany({
      where: { majorId },
      select: {
        id: true,
        code: true,
        description: true,
        targetPercent: true,
        directTargetPercent: true,
        isGroupHeader: true,
        parentId: true,
        parent: { select: { code: true } },
      },
      orderBy: { id: 'asc' },
    });

    return { major, plos };
  }

  async saveFramework(
    majorId: number,
    entries: {
      id?: number;
      code: string;
      description: string;
      targetPercent: number | null;
      isGroupHeader: boolean;
      parentCode?: string | null;
    }[],
    assessmentType: 'direct' | 'indirect' = 'indirect',
  ) {
    const targetField =
      assessmentType === 'direct' ? 'directTargetPercent' : 'targetPercent';

    const major = await this.prisma.major.findUnique({
      where: { id: majorId },
      select: { id: true },
    });
    if (!major) {
      throw new NotFoundException(`Không tìm thấy ngành có ID ${majorId}`);
    }

    const current = await this.prisma.pLO.findMany({
      where: { majorId },
      select: { id: true, code: true },
    });
    const currentIds = new Set(current.map(({ id }) => id));
    const submittedIds = new Set<number>();
    const codeMap = new Map<string, (typeof entries)[number]>();

    for (const entry of entries) {
      const code = entry.code.trim();
      if (!code) {
        throw new BadRequestException('Mã chuẩn đầu ra không được để trống.');
      }
      if (codeMap.has(code)) {
        throw new BadRequestException(`Mã chuẩn đầu ra ${code} bị trùng.`);
      }
      if (entry.id !== undefined) {
        if (!currentIds.has(entry.id)) {
          throw new BadRequestException(
            `Chuẩn đầu ra có ID ${entry.id} không thuộc ngành đang chọn.`,
          );
        }
        if (submittedIds.has(entry.id)) {
          throw new BadRequestException(
            `Chuẩn đầu ra có ID ${entry.id} bị lặp.`,
          );
        }
        submittedIds.add(entry.id);
      }
      if (entry.isGroupHeader && entry.parentCode) {
        throw new BadRequestException(
          `Nhóm ${code} không thể nằm trong một nhóm khác.`,
        );
      }
      if (entry.isGroupHeader && entry.targetPercent !== null) {
        throw new BadRequestException(
          `Nhóm ${code} không có mục tiêu phần trăm.`,
        );
      }
      codeMap.set(code, entry);
    }

    for (const entry of entries) {
      if (!entry.parentCode) continue;
      const parent = codeMap.get(entry.parentCode.trim());
      if (!parent || !parent.isGroupHeader) {
        throw new BadRequestException(
          `Nhóm cha ${entry.parentCode} không hợp lệ.`,
        );
      }
      if (parent.code.trim() === entry.code.trim()) {
        throw new BadRequestException(
          'Chuẩn đầu ra không thể là nhóm cha của chính nó.',
        );
      }
    }

    const removedIds = [...currentIds].filter((id) => !submittedIds.has(id));
    if (removedIds.length > 0) {
      const linkedRows = await this.prisma.matrix.count({
        where: { ploId: { in: removedIds } },
      });
      if (linkedRows > 0) {
        throw new BadRequestException(
          'Không thể xóa PLO đang được liên kết trong ma trận CLO–PLO. Hãy gỡ liên kết trước.',
        );
      }
    }

    await this.prisma.$transaction(async (transaction) => {
      const idsByCode = new Map<string, number>();
      const groups = entries.filter((entry) => entry.isGroupHeader);
      const children = entries.filter((entry) => !entry.isGroupHeader);

      for (const entry of groups) {
        const saved = entry.id
          ? await transaction.pLO.update({
              where: { id: entry.id },
              data: {
                code: entry.code.trim(),
                description: entry.description.trim(),
                [targetField]: null,
                isGroupHeader: true,
                parentId: null,
              },
              select: { id: true, code: true },
            })
          : await transaction.pLO.create({
              data: {
                majorId,
                code: entry.code.trim(),
                description: entry.description.trim(),
                [targetField]: null,
                isGroupHeader: true,
              },
              select: { id: true, code: true },
            });
        idsByCode.set(saved.code, saved.id);
      }

      for (const entry of children) {
        const parentId = entry.parentCode
          ? idsByCode.get(entry.parentCode.trim())
          : null;
        const saved = entry.id
          ? await transaction.pLO.update({
              where: { id: entry.id },
              data: {
                code: entry.code.trim(),
                description: entry.description.trim(),
                [targetField]: entry.targetPercent,
                isGroupHeader: false,
                parentId,
              },
              select: { id: true, code: true },
            })
          : await transaction.pLO.create({
              data: {
                majorId,
                code: entry.code.trim(),
                description: entry.description.trim(),
                [targetField]: entry.targetPercent,
                isGroupHeader: false,
                parentId,
              },
              select: { id: true, code: true },
            });
        idsByCode.set(saved.code, saved.id);
      }

      if (removedIds.length > 0) {
        await transaction.pLO.deleteMany({
          where: { id: { in: removedIds }, majorId },
        });
      }
    });

    return this.findByMajor(majorId);
  }

  async updateTargets(
    majorId: number,
    targets: { id: number; targetPercent: number | null }[],
  ) {
    const major = await this.prisma.major.findUnique({
      where: { id: majorId },
      select: { id: true },
    });
    if (!major) {
      throw new NotFoundException(`Không tìm thấy ngành có ID ${majorId}`);
    }

    const existingPlos = await this.prisma.pLO.findMany({
      where: { majorId },
      select: { id: true },
    });
    const validIds = new Set(existingPlos.map(({ id }) => id));
    const submittedIds = new Set<number>();

    for (const target of targets) {
      if (!validIds.has(target.id)) {
        throw new BadRequestException(
          `PLO có ID ${target.id} không thuộc ngành đang chọn.`,
        );
      }
      if (submittedIds.has(target.id)) {
        throw new BadRequestException(`PLO có ID ${target.id} bị lặp.`);
      }
      submittedIds.add(target.id);
    }

    await this.prisma.$transaction(
      targets.map(({ id, targetPercent }) =>
        this.prisma.pLO.update({
          where: { id },
          data: { targetPercent },
        }),
      ),
    );

    return this.findByMajor(majorId);
  }
}
