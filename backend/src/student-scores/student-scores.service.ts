
import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ImportScoreRow {
  MaSV: string;
  MaMH: string;
  MaCLO: string;
  Diem: number | string;
  GhiChu?: string;
  excelRow?: number;
}

function normalizeCourseCode(value: string): string {
  const compact = value
    .trim()
    .toUpperCase()
    .replace(/O/g, '0')
    .replace(/[^A-Z0-9]/g, '');
  const match = compact.match(/^([A-Z]+)(\d+)$/);
  return match ? `${match[1]}${Number(match[2])}` : compact;
}

@Injectable()
export class StudentScoresService {
  constructor(private readonly prisma: PrismaService) {}

  async importScores(rows: ImportScoreRow[]) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('File không có dữ liệu điểm.');
    }

    const errors: { row: number; message: string }[] = [];
    let successCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const excelRow = row.excelRow ?? i + 2;

      const studentCode = String(row.MaSV ?? '').trim();
      const courseCode = String(row.MaMH ?? '').trim();
      const cloCode = String(row.MaCLO ?? '').trim();
      const rawScore = String(row.Diem ?? '').trim();

      if (
        !studentCode ||
        !courseCode ||
        !cloCode ||
        rawScore === ''
      ) {
        errors.push({
          row: excelRow,
          message: 'Thiếu MaSV, MaMH, MaCLO hoặc Diem.',
        });
        continue;
      }

      const score = Number(rawScore);

      if (!Number.isFinite(score) || score < 0 || score > 10) {
        errors.push({
          row: excelRow,
          message: 'Điểm phải là số từ 0 đến 10.',
        });
        continue;
      }

      try {
        const student = await this.prisma.student.findUnique({
          where: { studentCode },
        });

        if (!student) {
          errors.push({
            row: excelRow,
            message: `Không tìm thấy sinh viên ${studentCode}.`,
          });
          continue;
        }

        let course = await this.prisma.course.findFirst({
          where: { code: courseCode, majorId: student.majorId },
        });

        if (!course) {
          const courses = await this.prisma.course.findMany({
            where: { majorId: student.majorId },
          });
          const normalizedCourseCode = normalizeCourseCode(courseCode);
          course = courses.find((item) => normalizeCourseCode(item.code) === normalizedCourseCode) ?? null;
        }

        if (!course) {
          errors.push({
            row: excelRow,
            message: `Không tìm thấy học phần ${courseCode}.`,
          });
          continue;
        }

        if (student.majorId !== course.majorId) {
          errors.push({
            row: excelRow,
            message: 'Sinh viên và học phần không thuộc cùng ngành.',
          });
          continue;
        }

        const clo = await this.prisma.cLO.findFirst({
          where: {
            code: cloCode,
            majorId: course.majorId,
          },
        });

        if (!clo) {
          errors.push({
            row: excelRow,
            message: `Không tìm thấy CLO ${cloCode} thuộc ngành của học phần.`,
          });
          continue;
        }

        const mapping = await this.prisma.courseCLO.findUnique({
          where: {
            courseId_cloId: {
              courseId: course.id,
              cloId: clo.id,
            },
          },
        });

        if (!mapping) {
          errors.push({
            row: excelRow,
            message: `CLO ${cloCode} chưa được liên kết với học phần ${courseCode}.`,
          });
          continue;
        }

        const existing =
          await this.prisma.studentCloScore.findUnique({
            where: {
              studentId_courseId_cloId: {
                studentId: student.id,
                courseId: course.id,
                cloId: clo.id,
              },
            },
          });

        await this.prisma.studentCloScore.upsert({
          where: {
            studentId_courseId_cloId: {
              studentId: student.id,
              courseId: course.id,
              cloId: clo.id,
            },
          },
          create: {
            studentId: student.id,
            courseId: course.id,
            cloId: clo.id,
            score,
          },
          update: {
            score,
          },
        });

        if (existing) {
          updatedCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        errors.push({
          row: excelRow,
          message:
            error instanceof Error
              ? error.message
              : 'Lỗi không xác định khi lưu điểm.',
        });
      }
    }

    return {
      message: 'Đã xử lý file điểm CLO.',
      totalRows: rows.length,
      successCount,
      updatedCount,
      errorCount: errors.length,
      errors,
    };
  }
}
