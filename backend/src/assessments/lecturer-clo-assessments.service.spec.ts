import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LecturerCloAssessmentsService } from './lecturer-clo-assessments.service';

describe('LecturerCloAssessmentsService', () => {
  it('averages lecturer rates while retaining the current lecturer rate', async () => {
    const prisma = {
      major: {
        findUnique: jest.fn().mockResolvedValue({
          id: 4,
          code: 'CNTT',
          name: 'Công nghệ thông tin',
          courses: [
            {
              id: 8,
              code: 'MH01',
              name: 'Cơ sở dữ liệu',
              semester: 1,
              cloMappings: [
                {
                  clo: {
                    id: 12,
                    code: 'CLO1',
                    description: 'Phân tích dữ liệu',
                  },
                },
              ],
            },
          ],
        }),
      },
      lecturerCloAssessment: {
        findMany: jest.fn().mockResolvedValue([
          {
            userId: 20,
            courseId: 8,
            cloId: 12,
            attainmentRate: 60,
            updatedAt: new Date('2026-10-01T00:00:00.000Z'),
            user: { id: 20, fullName: 'Giảng viên A' },
          },
          {
            userId: 21,
            courseId: 8,
            cloId: 12,
            attainmentRate: 90,
            updatedAt: new Date('2026-10-02T00:00:00.000Z'),
            user: { id: 21, fullName: 'Giảng viên B' },
          },
        ]),
      },
      matrix: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new LecturerCloAssessmentsService(
      prisma as unknown as PrismaService,
    );

    const result = await service.getMajorAssessments(4, 2026, 20);

    expect(result.courses[0].clos[0]).toMatchObject({
      myRate: 60,
      averageRate: 75,
      lecturerCount: 2,
      lecturerAssessments: [
        { lecturerName: 'Giảng viên A', attainmentRate: 60 },
        { lecturerName: 'Giảng viên B', attainmentRate: 90 },
      ],
    });
  });

  it('rejects rates outside the 0–100 percent range before writing', async () => {
    const prisma = {
      matrix: { findMany: jest.fn().mockResolvedValue([]) },
      major: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    };
    const service = new LecturerCloAssessmentsService(
      prisma as unknown as PrismaService,
    );

    await expect(
      service.saveAssessments(20, {
        majorId: 4,
        academicYear: 2026,
        assessments: [{ courseId: 8, cloId: 12, attainmentRate: 101 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.major.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('saves each lecturer assessment under the selected academic year', async () => {
    const transaction = {
      academicYear: {
        upsert: jest.fn().mockResolvedValue({ id: 6 }),
      },
      lecturerCloAssessment: {
        upsert: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const prisma = {
      matrix: { findMany: jest.fn().mockResolvedValue([]) },
      major: {
        findUnique: jest.fn().mockResolvedValue({
          id: 4,
          courses: [{ id: 8, cloMappings: [{ cloId: 12 }] }],
        }),
      },
      $transaction: jest.fn(
        (callback: (tx: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };
    const service = new LecturerCloAssessmentsService(
      prisma as unknown as PrismaService,
    );

    const result = await service.saveAssessments(20, {
      majorId: 4,
      academicYear: 2026,
      assessments: [{ courseId: 8, cloId: 12, attainmentRate: 84.5 }],
    });

    expect(transaction.academicYear.upsert).toHaveBeenCalledWith({
      where: { year: 2026 },
      create: { year: 2026 },
      update: {},
      select: { id: true },
    });
    expect(transaction.lecturerCloAssessment.upsert).toHaveBeenCalledWith({
      where: {
        userId_courseId_cloId_academicYearId: {
          userId: 20,
          courseId: 8,
          cloId: 12,
          academicYearId: 6,
        },
      },
      create: {
        userId: 20,
        courseId: 8,
        cloId: 12,
        academicYearId: 6,
        attainmentRate: 84.5,
      },
      update: { attainmentRate: 84.5 },
    });
    expect(result.savedCount).toBe(1);
  });

  it('calculates major and program results from averaged CLO rates and matrix weights', async () => {
    const prisma = {
      program: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 2,
            code: 'CTDT-CNTT',
            name: 'Chương trình Công nghệ thông tin',
            description: null,
            majors: [
              {
                id: 4,
                code: 'CNTT',
                name: 'Công nghệ thông tin',
                courses: [
                  {
                    id: 8,
                    code: 'MH01',
                    name: 'Cơ sở dữ liệu',
                    cloMappings: [
                      {
                        clo: {
                          id: 12,
                          code: 'CLO1',
                          description: 'Phân tích dữ liệu',
                        },
                      },
                    ],
                  },
                ],
                plos: [
                  {
                    id: 15,
                    code: 'PLO1',
                    description: 'Năng lực dữ liệu',
                    parentId: null,
                    isGroupHeader: false,
                  },
                ],
              },
            ],
          },
        ]),
      },
      matrix: {
        findMany: jest.fn().mockResolvedValue([
          {
            courseId: 8,
            cloId: 12,
            ploId: 15,
            level: 2,
            clo: { majorId: 4 },
            plo: { majorId: 4 },
          },
        ]),
      },
      lecturerCloAssessment: {
        findMany: jest.fn().mockResolvedValue([
          {
            courseId: 8,
            cloId: 12,
            attainmentRate: 60,
            user: { fullName: 'Giảng viên A' },
            course: { id: 8, majorId: 4 },
            clo: { id: 12, code: 'CLO1', description: 'Phân tích dữ liệu' },
          },
          {
            courseId: 8,
            cloId: 12,
            attainmentRate: 80,
            user: { fullName: 'Giảng viên B' },
            course: { id: 8, majorId: 4 },
            clo: { id: 12, code: 'CLO1', description: 'Phân tích dữ liệu' },
          },
        ]),
      },
      analysisSetting: {
        findUnique: jest.fn().mockResolvedValue({ ploThreshold: 70 }),
      },
    };
    const service = new LecturerCloAssessmentsService(
      prisma as unknown as PrismaService,
    );

    const result = await service.getProgramReport(2026);

    expect(result.programs[0].evaluation).toEqual({
      threshold: 70,
      status: 'Đạt',
    });

    expect(result.programs[0].majors[0].evaluation).toEqual({
      averagePloRate: 70,
      threshold: 70,
      status: 'Đạt',
    });
    expect(result.programs[0].majors[0].cloPloAssessments[0]).toMatchObject({
      averageRate: 70,
      lecturerCount: 2,
      ploCode: 'PLO1',
      ploAttainmentRate: 70,
      ploStatus: 'Đạt',
    });
  });

  it('lists CLOs mapped through a course-specific matrix even without a CourseCLO link', async () => {
    const prisma = {
      major: {
        findUnique: jest.fn().mockResolvedValue({
          id: 4,
          code: 'KTPM',
          name: 'Kỹ thuật phần mềm',
          courses: [
            {
              id: 8,
              code: 'KTPM101',
              name: 'Nhập môn Kỹ thuật phần mềm',
              semester: 2,
              cloMappings: [],
            },
          ],
        }),
      },
      matrix: {
        findMany: jest.fn().mockResolvedValue([
          {
            courseId: 8,
            clo: {
              id: 12,
              code: 'CLO1',
              description: 'Vận dụng kiến thức cơ bản',
            },
          },
        ]),
      },
      lecturerCloAssessment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = new LecturerCloAssessmentsService(
      prisma as unknown as PrismaService,
    );

    const result = await service.getMajorAssessments(4, 2025, 20);

    expect(result.courses[0].clos).toMatchObject([
      {
        id: 12,
        code: 'CLO1',
        description: 'Vận dụng kiến thức cơ bản',
        myRate: null,
        averageRate: null,
      },
    ]);
  });

  it('does not mark a major as passed when any PLO has no assessment data', async () => {
    const prisma = {
      program: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 2,
            code: 'CTDT-CNTT',
            name: 'Chương trình Công nghệ thông tin',
            description: null,
            majors: [
              {
                id: 4,
                code: 'CNTT',
                name: 'Công nghệ thông tin',
                courses: [
                  {
                    id: 8,
                    code: 'MH01',
                    name: 'Cơ sở dữ liệu',
                    cloMappings: [
                      {
                        clo: {
                          id: 12,
                          code: 'CLO1',
                          description: 'Phân tích dữ liệu',
                        },
                      },
                    ],
                  },
                ],
                plos: [
                  {
                    id: 15,
                    code: 'PLO1',
                    description: 'Năng lực dữ liệu',
                    parentId: null,
                    isGroupHeader: false,
                  },
                  {
                    id: 16,
                    code: 'PLO2',
                    description: 'Năng lực phân tích',
                    parentId: null,
                    isGroupHeader: false,
                  },
                ],
              },
            ],
          },
        ]),
      },
      matrix: {
        findMany: jest.fn().mockResolvedValue([
          {
            courseId: 8,
            cloId: 12,
            ploId: 15,
            level: 2,
            clo: { majorId: 4 },
            plo: { majorId: 4 },
          },
        ]),
      },
      lecturerCloAssessment: {
        findMany: jest.fn().mockResolvedValue([
          {
            courseId: 8,
            cloId: 12,
            attainmentRate: 90,
            user: { fullName: 'Giảng viên A' },
            course: { id: 8, majorId: 4 },
            clo: { id: 12, code: 'CLO1', description: 'Phân tích dữ liệu' },
          },
        ]),
      },
      analysisSetting: {
        findUnique: jest.fn().mockResolvedValue({ ploThreshold: 70 }),
      },
    };
    const service = new LecturerCloAssessmentsService(
      prisma as unknown as PrismaService,
    );

    const result = await service.getProgramReport(2026);

    expect(result.programs[0].majors[0].plos[0].status).toBe('Đạt');
    expect(result.programs[0].majors[0].plos[1].status).toBe(
      'Chưa có dữ liệu',
    );
    expect(result.programs[0].majors[0].evaluation).toEqual({
      averagePloRate: null,
      threshold: 70,
      status: 'Chưa có dữ liệu',
    });
    expect(result.programs[0].evaluation.status).toBe('Chưa có dữ liệu');
  });
});
