import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CloScoreImportRow {
  studentCode: string;
  studentName: string;
  majorCode: string;
  cohortYear: number;
  courseCode: string;
  cloCode: string;
  score: number;
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
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async importCloScores(rows: CloScoreImportRow[]) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('File không có dòng điểm CLO để nhập.');
    }

    const normalized = rows.map((row, index) => {
      const line = index + 2;
      const studentCode = String(row?.studentCode ?? '').trim();
      const studentName = String(row?.studentName ?? '').trim();
      const majorCode = String(row?.majorCode ?? '').trim();
      const courseCode = String(row?.courseCode ?? '').trim();
      const cloCode = String(row?.cloCode ?? '').trim();
      const cohortYear = Number(row?.cohortYear);
      const rawScore = String(row?.score ?? '').trim();
      const score = Number(rawScore);

      if (!studentCode || !studentName || !majorCode || !courseCode || !cloCode) {
        throw new BadRequestException(`Dòng ${line}: thiếu mã/tên sinh viên, mã ngành, mã học phần hoặc mã CLO.`);
      }
      if (!Number.isInteger(cohortYear) || cohortYear < 1900 || cohortYear > 2200) {
        throw new BadRequestException(`Dòng ${line}: năm khóa không hợp lệ.`);
      }
      if (!rawScore || !Number.isFinite(score) || score < 0 || score > 10) {
        throw new BadRequestException(`Dòng ${line}: điểm CLO phải nằm trong thang 0–10.`);
      }

      return {
        studentCode,
        studentName,
        majorCode,
        cohortYear,
        courseCode,
        cloCode,
        score,
      };
    });

    const majorCode = normalized[0].majorCode;
    const cohortYear = normalized[0].cohortYear;
    if (normalized.some((row) => row.majorCode.toUpperCase() !== majorCode.toUpperCase())) {
      throw new BadRequestException('Mỗi lần nhập chỉ được chứa một ngành.');
    }
    if (normalized.some((row) => row.cohortYear !== cohortYear)) {
      throw new BadRequestException('Mỗi lần nhập chỉ được chứa một khóa.');
    }

    const major = await this.prisma.major.findUnique({
      where: { code: majorCode },
      select: {
        id: true,
        code: true,
        courses: { select: { id: true, code: true } },
        clos: { select: { id: true, code: true } },
      },
    });
    if (!major) {
      throw new NotFoundException(`Không tìm thấy ngành ${majorCode}.`);
    }

    const coursesByCode = new Map(major.courses.map((course) => [normalizeCourseCode(course.code), course]));
    const closByCode = new Map<string, { id: number; code: string }>();
    for (const clo of major.clos) {
      const normalizedCode = clo.code.toUpperCase();
      if (closByCode.has(normalizedCode)) {
        throw new BadRequestException(`Mã CLO "${clo.code}" bị trùng trong ngành ${major.code}; không thể xác định điểm thuộc CLO nào.`);
      }
      closByCode.set(normalizedCode, clo);
    }

    const prepared = normalized.map((row, index) => {
      const course = coursesByCode.get(normalizeCourseCode(row.courseCode));
      const clo = closByCode.get(row.cloCode.toUpperCase());
      if (!course) {
        throw new BadRequestException(`Dòng ${index + 2}: học phần ${row.courseCode} không thuộc ngành ${major.code}.`);
      }
      if (!clo) {
        throw new BadRequestException(`Dòng ${index + 2}: không tìm thấy CLO ${row.cloCode} trong ngành ${major.code}.`);
      }
      return { ...row, courseId: course.id, cloId: clo.id };
    });

    const studentIds = new Map<string, number>();
    await this.prisma.$transaction(async (transaction) => {
      const existingStudents = await transaction.student.findMany({
        where: { studentCode: { in: [...new Set(prepared.map((row) => row.studentCode))] } },
        select: { studentCode: true, majorId: true, cohortYear: true },
      });
      const conflictingStudent = existingStudents.find(
        (student) => student.majorId !== major.id || student.cohortYear !== cohortYear,
      );
      if (conflictingStudent) {
        throw new BadRequestException(
          `Sinh viên ${conflictingStudent.studentCode} đã được ghi nhận thuộc ngành/khóa khác; không thể chuyển ngành hoặc khóa khi nhập điểm.`,
        );
      }

      for (const row of prepared) {
        const studentKey = row.studentCode.toUpperCase();
        let studentId = studentIds.get(studentKey);
        if (studentId === undefined) {
          const student = await transaction.student.upsert({
            where: { studentCode: row.studentCode },
            create: {
              studentCode: row.studentCode,
              fullName: row.studentName,
              majorId: major.id,
              cohortYear,
            },
            update: {
              fullName: row.studentName,
            },
            select: { id: true },
          });
          studentId = student.id;
          studentIds.set(studentKey, studentId);
        }

        await transaction.studentCloScore.upsert({
          where: {
            studentId_courseId_cloId: {
              studentId,
              courseId: row.courseId,
              cloId: row.cloId,
            },
          },
          create: {
            studentId,
            courseId: row.courseId,
            cloId: row.cloId,
            score: row.score,
          },
          update: { score: row.score },
        });
      }
    }, { maxWait: 10_000, timeout: 30_000 });

    return {
      importedRows: prepared.length,
      studentCount: studentIds.size,
      majorCode: major.code,
      cohortYear,
    };
  }

  async getPloResults(majorId: number, cohortYear: number) {
    if (!Number.isInteger(majorId) || majorId <= 0) {
      throw new BadRequestException('majorId không hợp lệ.');
    }
    if (!Number.isInteger(cohortYear) || cohortYear < 1900 || cohortYear > 2200) {
      throw new BadRequestException('cohortYear không hợp lệ.');
    }

    const [major, students, analysisSetting] = await Promise.all([
      this.prisma.major.findUnique({
        where: { id: majorId },
        select: {
          id: true,
          code: true,
          name: true,
          assessments: { select: { ploRate: true } },
          plos: {
            orderBy: { id: 'asc' },
            select: {
              id: true,
              code: true,
              description: true,
              parentId: true,
              isGroupHeader: true,
              matrices: {
                where: { clo: { majorId } },
                select: { cloId: true, level: true },
              },
            },
          },
        },
      }),
      this.prisma.student.findMany({
        where: { majorId, cohortYear },
        orderBy: { studentCode: 'asc' },
        select: {
          id: true,
          studentCode: true,
          fullName: true,
          cloScores: {
            where: { course: { majorId } },
            select: { cloId: true, score: true, courseId: true },
          },
        },
      }),
      this.prisma.analysisSetting.upsert({
        where: { id: 1 },
        create: { id: 1 },
        update: {},
        select: { ploThreshold: true },
      }),
    ]);

    if (!major) {
      throw new NotFoundException(`Không tìm thấy ngành có ID ${majorId}.`);
    }

    const configuredThreshold = analysisSetting.ploThreshold;
    const attainmentThresholdPercent = configuredThreshold > 0 && configuredThreshold <= 100
      ? Number(configuredThreshold.toFixed(2))
      : 75;

    major.plos.sort((left, right) => {
      const leftNumber = Number(left.code.match(/\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER);
      const rightNumber = Number(right.code.match(/\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER);
      return leftNumber - rightNumber || left.code.localeCompare(right.code);
    });

    // Phân loại PLO cha / con
    const childPlos = major.plos.filter((p) => p.parentId !== null);
    const parentPlos = major.plos.filter((p) => p.parentId === null && !p.isGroupHeader);
    const hasHierarchy = childPlos.length > 0;

    let evaluatedCount = 0;
    let achievedCount = 0;

    const resultStudents = students.map((student) => {
      // Map điểm CLO
      const scoresByClo = new Map<number, number[]>();
      for (const item of student.cloScores) {
        const values = scoresByClo.get(item.cloId) ?? [];
        values.push(item.score);
        scoresByClo.set(item.cloId, values);
      }

      // Số lượng môn học (SLMH)
      const slmh = new Set(student.cloScores.map((s) => s.courseId)).size;

      // Tính điểm từng PLO
      const ploScoreMap = new Map<number, { scorePercent: number | null; achieved: boolean | null }>();

      for (const plo of major.plos) {
        let weightedScore = 0;
        let totalWeight = 0;
        for (const matrix of plo.matrices) {
          const values = scoresByClo.get(matrix.cloId);
          const weight = matrix.level;
          if (!values?.length || weight <= 0) continue;
          const avg = values.reduce((sum, score) => sum + score, 0) / values.length;
          weightedScore += avg * weight;
          totalWeight += weight;
        }
        if (totalWeight === 0) {
          ploScoreMap.set(plo.id, { scorePercent: null, achieved: null });
        } else {
          const scorePercent = Number(((weightedScore / totalWeight) * 10).toFixed(2));
          ploScoreMap.set(plo.id, { scorePercent, achieved: scorePercent >= attainmentThresholdPercent });
        }
      }

      // Nếu có cấu trúc cha-con: tính điểm PLO cha = trung bình điểm PLO con
      if (hasHierarchy) {
        for (const parent of parentPlos) {
          const children = major.plos.filter((p) => p.parentId === parent.id);
          const validChildren = children
            .map((c) => ploScoreMap.get(c.id)!)
            .filter((r) => r?.scorePercent !== null && r?.scorePercent !== undefined);
          if (validChildren.length === 0) {
            ploScoreMap.set(parent.id, { scorePercent: null, achieved: null });
          } else {
            const avg = validChildren.reduce((s, r) => s + r.scorePercent!, 0) / validChildren.length;
            const scorePercent = Number(avg.toFixed(2));
            ploScoreMap.set(parent.id, { scorePercent, achieved: scorePercent >= attainmentThresholdPercent });
          }
        }
      }

      // Đếm đạt/không đạt theo PLO tổng hợp
      const summaryPlos = hasHierarchy ? parentPlos : major.plos;
      for (const plo of summaryPlos) {
        const r = ploScoreMap.get(plo.id);
        if (r?.achieved !== null && r?.achieved !== undefined) {
          evaluatedCount += 1;
          if (r.achieved) achievedCount += 1;
        }
      }

      // Kết quả từng PLO
      const ploResults = major.plos.map((plo) => {
        const r = ploScoreMap.get(plo.id) ?? { scorePercent: null, achieved: null };
        return {
          ploId: plo.id,
          code: plo.code,
          description: plo.description,
          parentId: plo.parentId,
          scorePercent: r.scorePercent,
          achieved: r.achieved,
        };
      });

      const summaryResults = summaryPlos
        .map((plo) => ploScoreMap.get(plo.id))
        .filter((result): result is { scorePercent: number; achieved: boolean } => result?.scorePercent !== null && result?.scorePercent !== undefined && result?.achieved !== null && result?.achieved !== undefined);
      const totalPloScorePercent = summaryResults.length > 0
        ? Number((summaryResults.reduce((sum, result) => sum + result.scorePercent, 0) / summaryResults.length).toFixed(2))
        : null;
      const totalPloAchieved = summaryResults.length === summaryPlos.length && summaryResults.length > 0 && summaryResults.every((result) => result.achieved);

      return {
        id: student.id,
        studentCode: student.studentCode,
        fullName: student.fullName,
        slmh,
        totalPloScorePercent,
        totalPloAchieved: totalPloScorePercent === null ? null : totalPloAchieved,
        ploResults,
      };
    });

    return {
      major: { id: major.id, code: major.code, name: major.name },
      cohortYear,
      hasHierarchy,
      mappedPloCount: major.plos.filter((plo) => plo.matrices.length > 0).length,
      attainmentThresholdPercent,
      studentCount: students.length,
      evaluatedCount,
      achievedCount,
      attainmentRate: evaluatedCount > 0
        ? Number(((achievedCount / evaluatedCount) * 100).toFixed(2))
        : null,
      plos: major.plos.map(({ matrices: _matrices, ...plo }) => plo),
      students: resultStudents,
    };
  }
}
