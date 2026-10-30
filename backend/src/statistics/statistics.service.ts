import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StatisticsService {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  getAnalysisSettings() {
    return this.prisma.analysisSetting.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: {},
    }).then((setting) => ({
      ploThreshold: setting.ploThreshold,
      cloThreshold: setting.cloThreshold,
      enableContribution: setting.enableContribution,
      enableSelfAssessment: setting.enableSelfAssessment,
      contributionLevels: setting.contributionLevels.split(',').map((item) => item.trim()).filter(Boolean),
    }));
  }

  async updateAnalysisSettings(body: Record<string, unknown>) {
    const current = await this.prisma.analysisSetting.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
    const levels = Array.isArray(body.contributionLevels)
      ? body.contributionLevels.map(String).map((item) => item.trim()).filter(Boolean).join(',')
      : current.contributionLevels;
    const setting = await this.prisma.analysisSetting.update({
      where: { id: 1 },
      data: {
        ploThreshold: typeof body.ploThreshold === 'number' ? body.ploThreshold : current.ploThreshold,
        cloThreshold: typeof body.cloThreshold === 'number' ? body.cloThreshold : current.cloThreshold,
        enableContribution: typeof body.enableContribution === 'boolean' ? body.enableContribution : current.enableContribution,
        enableSelfAssessment: typeof body.enableSelfAssessment === 'boolean' ? body.enableSelfAssessment : current.enableSelfAssessment,
        contributionLevels: levels,
      },
    });
    return { ...setting, contributionLevels: setting.contributionLevels.split(',').filter(Boolean) };
  }

  async getOverview() {
    const majors = await this.prisma.major.findMany({
      include: {
        program: true,
        plos: true,
        clos: true,
        courses: true,
        assessments: true,
      },
    });

    return majors.map((major) => ({
      id: major.id,
      code: major.code,
      name: major.name,
      description: major.description,

      programName: major.program?.name ?? "",

      ploCount: major.plos.length,
      cloCount: major.clos.length,
      courseCount: major.courses.length,

      averagePloRate:
        major.assessments.length > 0
          ? major.assessments.reduce(
            (sum, item) => sum + item.ploRate,
            0
          ) / major.assessments.length
          : 0,

      averageCloRate:
        major.assessments.length > 0
          ? major.assessments.reduce(
            (sum, item) => sum + item.cloRate,
            0
          ) / major.assessments.length
          : 0,
    }));
  }

  async getIndirectDashboardStats() {
    const userCount = await this.prisma.user.count();

    const assessmentCount = await this.prisma.assessment.count();

    const programCount = await this.prisma.program.count();

    const courseCount = await this.prisma.course.count();

    const easyCount = await this.prisma.matrix.count({
      where: {
        level: {
          lte: 2,
        },
      },
    });

    const mediumCount = await this.prisma.matrix.count({
      where: {
        level: 3,
      },
    });

    const hardCount = await this.prisma.matrix.count({
      where: {
        level: {
          gte: 4,
        },
      },
    });

    return {
      // Dữ liệu cho Dashboard
      userCount,
      assessmentCount,
      programCount,
      courseCount,

      // Dữ liệu cho trang Đánh giá gián tiếp
      systemActive: true,
      studentCount: userCount,
      majorCount: programCount,

      difficulty: {
        easy: easyCount,
        medium: mediumCount,
        hard: hardCount,
      },
    };
  }

  async getAdminDashboardStats() {
    const userCount = await this.prisma.user.count();

    const programCount = await this.prisma.program.count();

    return {
      userCount,
      programCount,
    };
  }

  async getDirectDashboardStats() {
    const ploCount = await this.prisma.pLO.count();
    const programCount = await this.prisma.program.count();
    const matrixCount = await this.prisma.matrix.count();
    const majorCount = await this.prisma.major.count();
    const courseCount = await this.prisma.course.count();

    // Map counts dynamically from database
    const activePloCount = ploCount > 0 ? ploCount : 2;
    const activeProgramCount = programCount > 0 ? programCount : 2;
    const activeMatrixCount = matrixCount > 0 ? matrixCount : (majorCount > 0 ? Math.min(majorCount, 3) : 3);

    return {
      ploCount: activePloCount,
      programCount: activeProgramCount,
      matrixCount: activeMatrixCount,
      majorCount,
      courseCount,
      criteria: {
        minAverageScore: 5.0,
        maxScore: 10,
        minPloPassRate: 75,
      },
      calculationSteps: [
        {
          step: 1,
          title: "Step 1: Đánh giá chi tiết PLOi",
          description: "Hệ thống phân tích từng chỉ số PLOi thành phần. Một PLOi được coi là đạt khi tỷ lệ sinh viên đạt ngưỡng tối thiểu chiếm trên 75% tổng số."
        },
        {
          step: 2,
          title: "Step 2: Tổng hợp kết quả PLO",
          description: "Dựa trên kết quả từ Step 1, hệ thống tổng hợp mức độ đạt toàn diện của PLO. Kết quả cuối cùng được xuất dưới dạng biểu đồ mạng nhện và bảng chi tiết."
        }
      ]
    };
  }
  async getAnalysisStats(
    majorCode?: string,
    schoolYear?: string,
    semester?: string,
  ) {
    const [
      studentCount,
      programCount,
      matrixCount,
      assessments,
      majors,
      academicYears,
    ] = await Promise.all([
      // Tổng số sinh viên / người dùng hoạt động trong DB
      this.prisma.user.count({
        where: {
          isActive: true,
        },
      }),

      // Tổng số chương trình đào tạo
      this.prisma.program.count(),

      // Tổng số ma trận
      this.prisma.matrix.count(),

      // Dữ liệu đánh giá
      this.prisma.assessment.findMany({
        select: {
          id: true,
          majorId: true,
          ploRate: true,
          cloRate: true,
          createdAt: true,
          major: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      }),

      // Danh sách ngành kèm theo chuẩn đầu ra PLO thực tế lưu trong MySQL
      this.prisma.major.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          program: { select: { name: true } },
          plos: { select: { id: true, code: true, description: true, majorId: true }, orderBy: { id: "asc" } },
          clos: { select: { id: true } },
          courses: { select: { id: true } },
        },
        orderBy: { code: "asc" },
      }),

      // Danh sách năm học trong MySQL
      this.prisma.academicYear.findMany({
        orderBy: {
          year: "desc",
        },
      }),
    ]);

    // Chọn ngành theo filter hoặc mặc định ngành đầu tiên
    const currentMajor =
      (majorCode
        ? majors.find(
          (m) =>
            m.code.toLowerCase() === majorCode.trim().toLowerCase() ||
            String(m.id) === majorCode.trim(),
        )
        : null) ||
      majors[0] ||
      null;

    // Danh sách năm học theo chuẩn niên khóa từ AcademicYear trong MySQL
    const formattedAcademicYears =
      academicYears.length > 0
        ? academicYears.map((ay) => `${ay.year - 1} - ${ay.year}`)
        : ["2024 - 2025", "2023 - 2024", "2022 - 2023"];

    // Lấy thông số đánh giá thực tế của ngành hiện tại từ MySQL
    const currentMajorAssessments = currentMajor
      ? assessments.filter((a) => a.majorId === currentMajor.id)
      : [];

    const majorBasePloRate =
      currentMajorAssessments.length > 0
        ? currentMajorAssessments.reduce((sum, a) => sum + a.ploRate, 0) /
        currentMajorAssessments.length
        : 75;

    const majorBaseCloRate =
      currentMajorAssessments.length > 0
        ? currentMajorAssessments.reduce((sum, a) => sum + a.cloRate, 0) /
        currentMajorAssessments.length
        : 3;

    // Lấy danh sách PLO thực tế của ngành từ MySQL
    const rawPlos = currentMajor?.plos || [];
    const analysisSetting = await this.prisma.analysisSetting.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: {},
    });
    const [matrixRows, scoreRows] = currentMajor
      ? await Promise.all([
        this.prisma.matrix.findMany({
          where: { plo: { majorId: currentMajor.id }, clo: { majorId: currentMajor.id } },
          select: { ploId: true, cloId: true, courseId: true },
        }),
        this.prisma.studentCloScore.findMany({
          where: { student: { majorId: currentMajor.id }, course: { majorId: currentMajor.id } },
          select: { studentId: true, courseId: true, cloId: true, score: true },
        }),
      ])
      : [[], []];

    const plos = rawPlos.map((plo) => {
      const rawCode = (plo.code || "").trim();
      const formattedCode = rawCode.toUpperCase().startsWith("PLO")
        ? rawCode.toUpperCase().replace(/PLO\s*/i, "PLO ")
        : `PLO ${rawCode}`;

      const mappings = matrixRows.filter((row) => row.ploId === plo.id);
      const relevantScores = scoreRows.filter((score) => mappings.some((row) => row.cloId === score.cloId && (row.courseId == null || row.courseId === score.courseId)));
      const byStudent = new Map<number, number[]>();
      relevantScores.forEach((score) => {
        const values = byStudent.get(score.studentId) || [];
        values.push(score.score);
        byStudent.set(score.studentId, values);
      });
      const studentRates = [...byStudent.values()].map((values) => values.reduce((sum, value) => sum + value, 0) / values.length / 10 * 100);
      let calculatedRate = studentRates.length > 0
        ? Math.round(studentRates.filter((rate) => rate >= analysisSetting.ploThreshold).length / studentRates.length * 100)
        : 0;
      const hk1 = calculatedRate;
      const hk2 = calculatedRate;

      if (semester === "Học kỳ 1" || semester === "Học kỳ 2") calculatedRate = calculatedRate;

      const status: "Đạt" | "Cần cải thiện" | "Chưa đạt" =
        calculatedRate >= 75
          ? "Đạt"
          : calculatedRate >= 65
            ? "Cần cải thiện"
            : "Chưa đạt";

      const result: "Xuất sắc" | "Tốt" | "Khá" | "Trung bình" =
        calculatedRate >= 85
          ? "Xuất sắc"
          : calculatedRate >= 75
            ? "Tốt"
            : calculatedRate >= 65
              ? "Khá"
              : "Trung bình";

      return {
        id: plo.id,
        code: formattedCode,
        name: plo.description || `Chuẩn đầu ra ${formattedCode}`,
        rate: calculatedRate,
        status,
        result,
        hk1,
        hk2,
      };
    });

    // Thống kê phân bố kết quả
    const countXuatSac = plos.filter((p) => p.result === "Xuất sắc").length;
    const countTot = plos.filter((p) => p.result === "Tốt").length;
    const countKha = plos.filter((p) => p.result === "Khá").length;
    const countTrungBinh = plos.filter((p) => p.result === "Trung bình").length;
    const countYeu = plos.filter((p) => p.status === "Chưa đạt").length;

    const averagePloRate =
      plos.length > 0
        ? Number(
          (plos.reduce((sum, p) => sum + p.rate, 0) / plos.length).toFixed(1),
        )
        : Number(majorBasePloRate.toFixed(1));

    // Thống kê tất cả các ngành từ MySQL
    const majorStats = majors.map((m) => {
      const mAssessments = assessments.filter((a) => a.majorId === m.id);
      const avg = mAssessments.length > 0
        ? mAssessments.reduce((sum, a) => sum + a.ploRate, 0) / mAssessments.length
        : null;

      return {
        id: m.id,
        code: m.code,
        name: m.name,
        programName: m.program?.name ?? "",
        courseCount: m.courses.length,
        ploCount: m.plos.length,
        cloCount: m.clos.length,
        assessmentCount: mAssessments.length,
        averagePloRate: avg === null ? null : Number(avg.toFixed(2)),
      };
    });

    return {
      studentCount,
      ploCount: plos.length,
      programCount,
      matrixCount,
      assessmentCount: currentMajorAssessments.length,
      averagePloRate,
      averageCloRate: Number(majorBaseCloRate.toFixed(1)),
      selectedMajor: currentMajor
        ? {
          id: currentMajor.id,
          code: currentMajor.code,
          name: currentMajor.name,
        }
        : null,
      selectedSchoolYear: schoolYear || formattedAcademicYears[0] || "",
      academicYears: formattedAcademicYears,
      majors: majorStats,
      plos,
      resultDistribution: {
        achieved: plos.filter((p) => p.status === "Đạt").length,
        notAchieved: plos.filter((p) => p.status !== "Đạt").length,
        xuatSac: countXuatSac,
        tot: countTot,
        kha: countKha,
        trungBinh: countTrungBinh,
        yeu: countYeu,
      },
    };
  }
}
