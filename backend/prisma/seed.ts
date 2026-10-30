import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findOrCreatePlo(majorId: number, code: string, description: string) {
  const existing = await prisma.pLO.findFirst({ where: { majorId, code } });
  return existing ?? prisma.pLO.create({
    data: { majorId, code, description, targetPercent: 75, directTargetPercent: 75 },
  });
}

async function findOrCreateClo(majorId: number, code: string, description: string) {
  const existing = await prisma.cLO.findFirst({ where: { majorId, code } });
  return existing ?? prisma.cLO.create({ data: { majorId, code, description } });
}

async function main() {
  const program = await prisma.program.upsert({
    where: { code: 'DEMO-CTDT' },
    update: { name: 'Chương trình đào tạo mẫu SMART-EDU' },
    create: {
      code: 'DEMO-CTDT',
      name: 'Chương trình đào tạo mẫu SMART-EDU',
      description: 'Dữ liệu minh họa phục vụ kiểm thử hệ thống, không phải dữ liệu chính thức của nhà trường.',
    },
  });

  const major = await prisma.major.upsert({
    where: { code: 'DEMO-CNTT' },
    update: { name: 'Ngành mẫu Công nghệ thông tin', programId: program.id },
    create: {
      code: 'DEMO-CNTT',
      name: 'Ngành mẫu Công nghệ thông tin',
      description: 'Ngành mẫu dùng để kiểm thử chuỗi dữ liệu giáo dục.',
      programId: program.id,
    },
  });

  const academicYear = await prisma.academicYear.upsert({
    where: { year: 2025 },
    update: {},
    create: { year: 2025 },
  });
  await prisma.majorYear.upsert({
    where: { majorId_academicYearId: { majorId: major.id, academicYearId: academicYear.id } },
    update: {},
    create: { majorId: major.id, academicYearId: academicYear.id },
  });

  const courses = await Promise.all([
    prisma.course.upsert({
      where: { code: 'DEMO-MH01' },
      update: { name: 'Lập trình cơ bản', majorId: major.id, credits: 3, semester: 1 },
      create: { code: 'DEMO-MH01', name: 'Lập trình cơ bản', credits: 3, semester: 1, majorId: major.id },
    }),
    prisma.course.upsert({
      where: { code: 'DEMO-MH02' },
      update: { name: 'Cơ sở dữ liệu', majorId: major.id, credits: 3, semester: 2 },
      create: { code: 'DEMO-MH02', name: 'Cơ sở dữ liệu', credits: 3, semester: 2, majorId: major.id },
    }),
    prisma.course.upsert({
      where: { code: 'DEMO-MH03' },
      update: { name: 'Phân tích hệ thống', majorId: major.id, credits: 3, semester: 2 },
      create: { code: 'DEMO-MH03', name: 'Phân tích hệ thống', credits: 3, semester: 2, majorId: major.id },
    }),
  ]);

  const plos = await Promise.all([
    findOrCreatePlo(major.id, 'PLO1', 'Có kiến thức nền tảng về công nghệ thông tin.'),
    findOrCreatePlo(major.id, 'PLO2', 'Có khả năng phân tích và giải quyết vấn đề.'),
    findOrCreatePlo(major.id, 'PLO3', 'Có khả năng sử dụng công cụ và phát triển hệ thống.'),
  ]);
  const clos = await Promise.all([
    findOrCreateClo(major.id, 'CLO1', 'Trình bày được kiến thức nền tảng của học phần.'),
    findOrCreateClo(major.id, 'CLO2', 'Vận dụng kiến thức để giải quyết bài toán.'),
    findOrCreateClo(major.id, 'CLO3', 'Xây dựng được sản phẩm hoặc mô hình minh họa.'),
  ]);

  const cohort = await prisma.cohort.upsert({ where: { year: 2025 }, update: {}, create: { year: 2025 } });
  for (const course of courses) {
    await prisma.courseYear.upsert({
      where: { courseId_academicYearId: { courseId: course.id, academicYearId: academicYear.id } },
      update: {},
      create: { courseId: course.id, academicYearId: academicYear.id },
    });
    await prisma.courseCohort.upsert({
      where: { courseId_cohortId: { courseId: course.id, cohortId: cohort.id } },
      update: {},
      create: { courseId: course.id, cohortId: cohort.id },
    });
  }

  const mapping = [
    [courses[0], clos[0], plos[0], 1], [courses[0], clos[1], plos[1], 2],
    [courses[1], clos[0], plos[0], 2], [courses[1], clos[1], plos[1], 3], [courses[1], clos[2], plos[2], 2],
    [courses[2], clos[1], plos[1], 2], [courses[2], clos[2], plos[2], 3],
  ] as const;
  for (const [course, clo, plo, level] of mapping) {
    await prisma.courseCLO.upsert({
      where: { courseId_cloId: { courseId: course.id, cloId: clo.id } },
      update: {},
      create: { courseId: course.id, cloId: clo.id },
    });
    const matrix = await prisma.matrix.findFirst({ where: { courseId: course.id, cloId: clo.id, ploId: plo.id } });
    if (matrix) await prisma.matrix.update({ where: { id: matrix.id }, data: { level, method: 'TT' } });
    else await prisma.matrix.create({ data: { courseId: course.id, cloId: clo.id, ploId: plo.id, level, method: 'TT' } });
  }

  const students = await Promise.all([
    prisma.student.upsert({ where: { studentCode: 'DEMO2025001' }, update: { fullName: 'Nguyễn Minh An', majorId: major.id, cohortYear: 2025 }, create: { studentCode: 'DEMO2025001', fullName: 'Nguyễn Minh An', majorId: major.id, cohortYear: 2025 } }),
    prisma.student.upsert({ where: { studentCode: 'DEMO2025002' }, update: { fullName: 'Trần Hoàng Bình', majorId: major.id, cohortYear: 2025 }, create: { studentCode: 'DEMO2025002', fullName: 'Trần Hoàng Bình', majorId: major.id, cohortYear: 2025 } }),
    prisma.student.upsert({ where: { studentCode: 'DEMO2025003' }, update: { fullName: 'Lê Phương Chi', majorId: major.id, cohortYear: 2025 }, create: { studentCode: 'DEMO2025003', fullName: 'Lê Phương Chi', majorId: major.id, cohortYear: 2025 } }),
  ]);
  const scoreValues = [8.5, 7.0, 9.0];
  for (const [studentIndex, student] of students.entries()) {
    for (const [courseIndex, course] of courses.entries()) {
      const applicableClos = clos.filter((clo) => mapping.some(([mappedCourse, mappedClo]) => mappedCourse.id === course.id && mappedClo.id === clo.id));
      for (const [cloIndex, clo] of applicableClos.entries()) {
        await prisma.studentCloScore.upsert({
          where: { studentId_courseId_cloId: { studentId: student.id, courseId: course.id, cloId: clo.id } },
          update: { score: Math.min(10, Math.max(0, scoreValues[(studentIndex + courseIndex + cloIndex) % scoreValues.length])) },
          create: { studentId: student.id, courseId: course.id, cloId: clo.id, score: Math.min(10, Math.max(0, scoreValues[(studentIndex + courseIndex + cloIndex) % scoreValues.length])) },
        });
      }
    }
  }

  const assessment = await prisma.assessment.findFirst({ where: { majorId: major.id } });
  if (assessment) await prisma.assessment.update({ where: { id: assessment.id }, data: { ploRate: 86.7, cloRate: 8.2 } });
  else await prisma.assessment.create({ data: { majorId: major.id, ploRate: 86.7, cloRate: 8.2 } });
  console.log('Đã nạp dữ liệu mẫu DEMO vào MySQL:', { major: major.code, courses: courses.length, plos: plos.length, clos: clos.length, students: students.length });
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
