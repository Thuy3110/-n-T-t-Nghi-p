import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveCloPloMatrixDto } from './dto/save-clo-plo-matrix.dto';

@Injectable()
export class MatricesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCloPloMatrix(majorId: number) {
    const major = await this.prisma.major.findUnique({
      where: { id: majorId },
      select: { id: true, code: true, name: true },
    });
    if (!major) {
      throw new NotFoundException(`Không tìm thấy ngành có ID ${majorId}`);
    }

    const [courses, clos, plos, matrix] = await Promise.all([
      this.prisma.course.findMany({
        where: { majorId },
        select: { id: true, code: true, name: true },
        orderBy: { code: 'asc' },
      }),
      this.prisma.cLO.findMany({
        where: { majorId },
        select: { id: true, code: true, description: true },
        orderBy: { id: 'asc' },
      }),
      this.prisma.pLO.findMany({
        where: { majorId },
        select: { id: true, code: true, description: true },
        orderBy: { id: 'asc' },
      }),
      this.prisma.matrix.findMany({
        where: { clo: { majorId }, plo: { majorId } },
        include: {
          clo: { select: { id: true, code: true, description: true } },
          plo: { select: { id: true, code: true, description: true } },
          course: { select: { id: true, code: true, name: true } },
        },
        orderBy: [{ id: 'asc' }],
      }),
    ]);

    return {
      major,
      courses,
      clos,
      plos,
      rows: matrix.map((row) => ({
        id: row.id,
        courseId: row.courseId,
        course: row.course,
        cloId: row.cloId,
        clo: row.clo,
        ploId: row.ploId,
        plo: row.plo,
        level: row.level,
        method: row.method,
      })),
    };
  }

  async saveCloPloMatrix(majorId: number, dto: SaveCloPloMatrixDto) {
    const major = await this.prisma.major.findUnique({
      where: { id: majorId },
      select: { id: true },
    });
    if (!major) {
      throw new NotFoundException(`Không tìm thấy ngành có ID ${majorId}`);
    }

    const [cloIds, ploIds, courseIds] = await Promise.all([
      this.prisma.cLO.findMany({
        where: { majorId },
        select: { id: true },
      }),
      this.prisma.pLO.findMany({
        where: { majorId },
        select: { id: true },
      }),
      this.prisma.course.findMany({
        where: { majorId },
        select: { id: true },
      }),
    ]);
    const validCloIds = new Set(cloIds.map(({ id }) => id));
    const validPloIds = new Set(ploIds.map(({ id }) => id));
    const validCourseIds = new Set(courseIds.map(({ id }) => id));

    for (const [index, row] of dto.rows.entries()) {
      if (!validCloIds.has(row.cloId) || !validPloIds.has(row.ploId)) {
        throw new BadRequestException(
          `Dòng ${index + 1}: CLO và PLO phải thuộc ngành đang chọn.`,
        );
      }
      if (row.courseId !== undefined && !validCourseIds.has(row.courseId)) {
        throw new BadRequestException(
          `Dòng ${index + 1}: học phần không thuộc ngành đang chọn.`,
        );
      }
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.matrix.deleteMany({
        where: { clo: { majorId } },
      });
      if (dto.rows.length > 0) {
        await transaction.matrix.createMany({
          data: dto.rows.map((row) => ({
            courseId: row.courseId,
            cloId: row.cloId,
            ploId: row.ploId,
            level: row.level,
            method: row.method,
          })),
        });
      }
    });

    return this.getCloPloMatrix(majorId);
  }
}
