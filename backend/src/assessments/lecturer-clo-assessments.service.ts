import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveLecturerCloAssessmentsDto } from './lecturer-clo-assessment.dto';

@Injectable()
export class LecturerCloAssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listYears() {
    const years = await this.prisma.academicYear.findMany({
      where: { lecturerCloAssessments: { some: {} } },
      select: { year: true },
      orderBy: { year: 'desc' },
    });

    return years.map(({ year }) => year);
  }

  async getMajorAssessments(
    majorId: number,
    academicYear: number,
    userId: number,
  ) {
    this.validateQuery(majorId, academicYear);

    const major = await this.prisma.major.findUnique({
      where: { id: majorId },
      select: {
        id: true,
        code: true,
        name: true,
        courses: {
          orderBy: { code: 'asc' },
          select: {
            id: true,
            code: true,
            name: true,
            semester: true,
            cloMappings: {
              orderBy: { clo: { code: 'asc' } },
              select: {
                clo: { select: { id: true, code: true, description: true } },
              },
            },
          },
        },
      },
    });
    if (!major) {
      throw new NotFoundException(`Không tìm thấy ngành có ID ${majorId}.`);
    }

    const courseIds = major.courses.map((course) => course.id);
    const [assessments, matrixLinks] = await Promise.all([
      this.prisma.lecturerCloAssessment.findMany({
        where: {
          course: { majorId },
          academicYear: { year: academicYear },
        },
        include: {
          user: { select: { id: true, fullName: true } },
        },
        orderBy: [{ user: { fullName: 'asc' } }, { cloId: 'asc' }],
      }),
      courseIds.length
        ? this.prisma.matrix.findMany({
            where: {
              courseId: { in: courseIds },
              clo: { majorId },
            },
            select: {
              courseId: true,
              clo: {
                select: { id: true, code: true, description: true },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const cloByCourse = new Map(
      major.courses.map((course) => [
        course.id,
        new Map(
          course.cloMappings.map(({ clo }) => [clo.id, clo]),
        ),
      ]),
    );
    for (const matrix of matrixLinks) {
      if (matrix.courseId === null) continue;
      cloByCourse.get(matrix.courseId)?.set(matrix.clo.id, matrix.clo);
    }

    const assessmentsByPair = new Map<string, typeof assessments>();
    for (const assessment of assessments) {
      const key = `${assessment.courseId}:${assessment.cloId}`;
      const values = assessmentsByPair.get(key) ?? [];
      values.push(assessment);
      assessmentsByPair.set(key, values);
    }

    return {
      major: { id: major.id, code: major.code, name: major.name },
      academicYear,
      courses: major.courses.map((course) => ({
        id: course.id,
        code: course.code,
        name: course.name,
        semester: course.semester,
        clos: [...(cloByCourse.get(course.id)?.values() ?? [])]
          .sort((left, right) => left.code.localeCompare(right.code))
          .map((clo) => {
          const entries = assessmentsByPair.get(`${course.id}:${clo.id}`) ?? [];
          const averageRate = entries.length
            ? Number(
                (
                  entries.reduce(
                    (total, entry) => total + entry.attainmentRate,
                    0,
                  ) / entries.length
                ).toFixed(2),
              )
            : null;

          return {
            id: clo.id,
            code: clo.code,
            description: clo.description,
            myRate:
              entries.find((entry) => entry.userId === userId)
                ?.attainmentRate ?? null,
            averageRate,
            lecturerCount: entries.length,
            lecturerAssessments: entries.map((entry) => ({
              lecturerName: entry.user.fullName,
              attainmentRate: entry.attainmentRate,
              updatedAt: entry.updatedAt,
            })),
          };
          }),
      })),
    };
  }

  async getProgramReport(academicYear: number) {
    if (
      !Number.isInteger(academicYear) ||
      academicYear < 1900 ||
      academicYear > 2200
    ) {
      throw new BadRequestException('Năm học không hợp lệ.');
    }

    const programs = await this.prisma.program.findMany({
      orderBy: { code: 'asc' },
      include: {
        majors: {
          orderBy: { code: 'asc' },
          include: {
            courses: {
              orderBy: { code: 'asc' },
              include: { cloMappings: { include: { clo: true } } },
            },
            plos: {
              orderBy: { id: 'asc' },
              select: {
                id: true,
                code: true,
                description: true,
                parentId: true,
                isGroupHeader: true,
              },
            },
          },
        },
      },
    });
    const majorIds = programs.flatMap((program) =>
      program.majors.map((major) => major.id),
    );
    const [matrices, lecturerAssessments, analysisSetting] = await Promise.all([
      this.prisma.matrix.findMany({
        where: { clo: { majorId: { in: majorIds } } },
        select: {
          courseId: true,
          cloId: true,
          ploId: true,
          level: true,
          course: { select: { id: true, code: true, name: true, majorId: true } },
          clo: {
            select: { id: true, majorId: true, code: true, description: true },
          },
          plo: { select: { id: true, majorId: true, code: true } },
        },
      }),
      this.prisma.lecturerCloAssessment.findMany({
        where: {
          course: { majorId: { in: majorIds } },
          academicYear: { year: academicYear },
        },
        include: {
          user: { select: { fullName: true } },
          course: { select: { id: true, majorId: true } },
          clo: { select: { id: true, code: true, description: true } },
        },
      }),
      this.prisma.analysisSetting.findUnique({
        where: { id: 1 },
        select: { ploThreshold: true },
      }),
    ]);

    const configuredThreshold = analysisSetting?.ploThreshold ?? 75;
    const threshold =
      configuredThreshold > 0 && configuredThreshold <= 100
        ? configuredThreshold
        : 75;

    const reportPrograms = programs.map((program) => {
      const reportMajors = program.majors.map((major) => {
        const coursesById = new Map(
          major.courses.map((course) => [course.id, course]),
        );
        const plosById = new Map(major.plos.map((plo) => [plo.id, plo]));
        const courseCloPairs = major.courses.flatMap((course) =>
          course.cloMappings.map(({ clo }) => ({
            courseId: course.id,
            cloId: clo.id,
          })),
        );
        const lecturerEntries = lecturerAssessments.filter(
          (entry) => entry.course.majorId === major.id,
        );
        const entriesByPair = new Map<string, typeof lecturerAssessments>();
        for (const entry of lecturerEntries) {
          const key = `${entry.courseId}:${entry.cloId}`;
          const entries = entriesByPair.get(key) ?? [];
          entries.push(entry);
          entriesByPair.set(key, entries);
        }

        const cloAssessments = courseCloPairs.map(({ courseId, cloId }) => {
          const course = coursesById.get(courseId)!;
          const clo = course.cloMappings.find(
            (mapping) => mapping.clo.id === cloId,
          )!.clo;
          const entries = entriesByPair.get(`${courseId}:${cloId}`) ?? [];

          return {
            courseId,
            courseCode: course.code,
            courseName: course.name,
            cloId,
            cloCode: clo.code,
            cloDescription: clo.description,
            averageRate: entries.length
              ? Number(
                  (
                    entries.reduce(
                      (sum, entry) => sum + entry.attainmentRate,
                      0,
                    ) / entries.length
                  ).toFixed(2),
                )
              : null,
            lecturerCount: entries.length,
            lecturerAssessments: entries.map((entry) => ({
              lecturerName: entry.user.fullName,
              attainmentRate: entry.attainmentRate,
              updatedAt: entry.updatedAt,
            })),
          };
        });
        const averageRateByPair = new Map(
          cloAssessments.map((assessment) => [
            `${assessment.courseId}:${assessment.cloId}`,
            assessment.averageRate,
          ]),
        );

        const weightedPloTotals = new Map<
          number,
          { weightedTotal: number; totalWeight: number }
        >();
        const expandedMatrixKeys = new Set<string>();
        for (const matrix of matrices) {
          if (
            matrix.clo.majorId !== major.id ||
            matrix.plo.majorId !== major.id
          ) {
            continue;
          }

          const mappedCourseIds =
            matrix.courseId === null
              ? courseCloPairs
                  .filter((pair) => pair.cloId === matrix.cloId)
                  .map((pair) => pair.courseId)
              : [matrix.courseId];
          for (const courseId of mappedCourseIds) {
            const matrixKey = `${courseId}:${matrix.cloId}:${matrix.ploId}`;
            if (expandedMatrixKeys.has(matrixKey)) continue;
            expandedMatrixKeys.add(matrixKey);

            const rate = averageRateByPair.get(`${courseId}:${matrix.cloId}`);
            if (rate === null || rate === undefined || matrix.level <= 0) {
              continue;
            }
            const total = weightedPloTotals.get(matrix.ploId) ?? {
              weightedTotal: 0,
              totalWeight: 0,
            };
            total.weightedTotal += rate * matrix.level;
            total.totalWeight += matrix.level;
            weightedPloTotals.set(matrix.ploId, total);
          }
        }

        const ploRates = new Map<number, number | null>();
        for (const plo of major.plos) {
          const total = weightedPloTotals.get(plo.id);
          ploRates.set(
            plo.id,
            total && total.totalWeight > 0
              ? Number((total.weightedTotal / total.totalWeight).toFixed(2))
              : null,
          );
        }

        const hasHierarchy = major.plos.some((plo) => plo.parentId !== null);
        const parentPlos = major.plos.filter(
          (plo) => plo.parentId === null && !plo.isGroupHeader,
        );
        if (hasHierarchy) {
          for (const parent of parentPlos) {
            const childRates = major.plos
              .filter((plo) => plo.parentId === parent.id)
              .map((plo) => ploRates.get(plo.id) ?? null);
            ploRates.set(
              parent.id,
              childRates.length && childRates.every((rate) => rate !== null)
                ? Number(
                    (
                      childRates.reduce(
                        (sum, rate) => sum + (rate ?? 0),
                        0,
                      ) / childRates.length
                    ).toFixed(2),
                  )
                : null,
            );
          }
        }

        const summaryPlos = hasHierarchy
          ? parentPlos
          : major.plos.filter((plo) => !plo.isGroupHeader);
        const summaryRates = summaryPlos.map(
          (plo) => ploRates.get(plo.id) ?? null,
        );
        const hasCompletePloResults =
          summaryRates.length > 0 &&
          summaryRates.every((rate) => rate !== null);
        const averagePloRate = hasCompletePloResults
          ? Number(
              (
                summaryRates.reduce((sum, rate) => sum + (rate ?? 0), 0) /
                summaryRates.length
              ).toFixed(2),
            )
          : null;
        const status =
          averagePloRate === null
            ? 'Chưa có dữ liệu'
            : averagePloRate >= threshold
              ? 'Đạt'
              : 'Chưa đạt';
        const ploResults = major.plos
          .filter((plo) => !plo.isGroupHeader)
          .map((plo) => {
            const rate = ploRates.get(plo.id) ?? null;
            return {
              id: plo.id,
              code: plo.code,
              description: plo.description,
              parentId: plo.parentId,
              attainmentRate: rate,
              status:
                rate === null
                  ? 'Chưa có dữ liệu'
                  : rate >= threshold
                    ? 'Đạt'
                    : 'Chưa đạt',
            };
          });
        const reportMatrixKeys = new Set<string>();
        const cloPloAssessments = matrices
          .filter(
            (matrix) =>
              matrix.clo.majorId === major.id &&
              matrix.plo.majorId === major.id,
          )
          .flatMap((matrix) => {
            const mappedCourseIds =
              matrix.courseId === null
                ? courseCloPairs
                    .filter((pair) => pair.cloId === matrix.cloId)
                    .map((pair) => pair.courseId)
                : [matrix.courseId];
            return [...new Set(mappedCourseIds)].flatMap((courseId) => {
              const matrixKey = `${courseId}:${matrix.cloId}:${matrix.ploId}`;
              if (reportMatrixKeys.has(matrixKey)) return [];
              reportMatrixKeys.add(matrixKey);

              const assessment = cloAssessments.find(
                (item) =>
                  item.courseId === courseId && item.cloId === matrix.cloId,
              );
              const course = coursesById.get(courseId);
              const clo = course?.cloMappings.find(
                (mapping) => mapping.clo.id === matrix.cloId,
              )?.clo ?? matrix.clo;
              const plo = plosById.get(matrix.ploId);
              if (!course || !plo) return [];
              const ploRate = ploRates.get(matrix.ploId) ?? null;
              return [
                {
                  courseId,
                  courseCode: course.code,
                  courseName: course.name,
                  cloId: matrix.cloId,
                  cloCode: clo.code,
                  cloDescription: clo.description,
                  averageRate: assessment?.averageRate ?? null,
                  lecturerCount: assessment?.lecturerCount ?? 0,
                  lecturerAssessments: assessment?.lecturerAssessments ?? [],
                  ploCode: plo.code,
                  ploAttainmentRate: ploRate,
                  ploStatus:
                    ploRate === null
                      ? 'Chưa có dữ liệu'
                      : ploRate >= threshold
                        ? 'Đạt'
                        : 'Chưa đạt',
                  contributionLevel: matrix.level,
                },
              ];
            });
          });

        return {
          id: major.id,
          code: major.code,
          name: major.name,
          evaluation: {
            averagePloRate,
            threshold,
            status,
          },
          plos: ploResults,
          cloAssessments,
          cloPloAssessments,
        };
      });

      const programStatus =
        reportMajors.length === 0 ||
        reportMajors.some(
          (major) => major.evaluation.status === 'Chưa có dữ liệu',
        )
          ? 'Chưa có dữ liệu'
          : reportMajors.every((major) => major.evaluation.status === 'Đạt')
            ? 'Đạt'
            : 'Chưa đạt';

      return {
        program: {
          id: program.id,
          code: program.code,
          name: program.name,
          description: program.description,
        },
        academicYear,
        evaluation: { threshold, status: programStatus },
        majors: reportMajors,
      };
    });

    return { academicYear, threshold, programs: reportPrograms };
  }

  async saveAssessments(userId: number, data: SaveLecturerCloAssessmentsDto) {
    this.validateQuery(data.majorId, data.academicYear);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('Tài khoản giảng viên không hợp lệ.');
    }

    for (const [index, assessment] of data.assessments.entries()) {
      if (
        assessment.attainmentRate !== null &&
        (!Number.isFinite(assessment.attainmentRate) ||
          assessment.attainmentRate < 0 ||
          assessment.attainmentRate > 100)
      ) {
        throw new BadRequestException(
          `Đánh giá dòng ${index + 1}: tỷ lệ đạt CLO phải từ 0 đến 100%.`,
        );
      }
    }

    const major = await this.prisma.major.findUnique({
      where: { id: data.majorId },
      select: {
        id: true,
        courses: {
          select: {
            id: true,
            cloMappings: { select: { cloId: true } },
          },
        },
      },
    });
    if (!major) {
      throw new NotFoundException(
        `Không tìm thấy ngành có ID ${data.majorId}.`,
      );
    }

    const validPairs = new Set(
      major.courses.flatMap((course) =>
        course.cloMappings.map(({ cloId }) => `${course.id}:${cloId}`),
      ),
    );
    const courseIds = major.courses.map((course) => course.id);
    if (courseIds.length) {
      const matrixLinks = await this.prisma.matrix.findMany({
        where: {
          courseId: { in: courseIds },
          clo: { majorId: major.id },
        },
        select: { courseId: true, cloId: true },
      });
      for (const matrix of matrixLinks) {
        if (matrix.courseId !== null) {
          validPairs.add(`${matrix.courseId}:${matrix.cloId}`);
        }
      }
    }
    for (const assessment of data.assessments) {
      if (!validPairs.has(`${assessment.courseId}:${assessment.cloId}`)) {
        throw new BadRequestException(
          `CLO ${assessment.cloId} không được liên kết với học phần ${assessment.courseId} thuộc ngành này.`,
        );
      }
    }

    const savedCount = data.assessments.filter(
      ({ attainmentRate }) => attainmentRate !== null,
    ).length;

    await this.prisma.$transaction(async (transaction) => {
      const year = await transaction.academicYear.upsert({
        where: { year: data.academicYear },
        create: { year: data.academicYear },
        update: {},
        select: { id: true },
      });

      for (const assessment of data.assessments) {
        const key = {
          userId_courseId_cloId_academicYearId: {
            userId,
            courseId: assessment.courseId,
            cloId: assessment.cloId,
            academicYearId: year.id,
          },
        };

        if (assessment.attainmentRate === null) {
          await transaction.lecturerCloAssessment.deleteMany({
            where: key.userId_courseId_cloId_academicYearId,
          });
          continue;
        }

        await transaction.lecturerCloAssessment.upsert({
          where: key,
          create: {
            ...key.userId_courseId_cloId_academicYearId,
            attainmentRate: assessment.attainmentRate,
          },
          update: { attainmentRate: assessment.attainmentRate },
        });
      }
    });

    return {
      message: 'Đã lưu đánh giá CLO của giảng viên.',
      academicYear: data.academicYear,
      savedCount,
    };
  }

  private validateQuery(majorId: number, academicYear: number) {
    if (!Number.isInteger(majorId) || majorId <= 0) {
      throw new BadRequestException('majorId không hợp lệ.');
    }
    if (
      !Number.isInteger(academicYear) ||
      academicYear < 1900 ||
      academicYear > 2200
    ) {
      throw new BadRequestException('Năm học không hợp lệ.');
    }
  }
}
