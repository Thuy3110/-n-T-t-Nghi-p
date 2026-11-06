import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProgramsService } from './programs.service';

describe('ProgramsService', () => {
  it('should be defined', () => {
    expect(new ProgramsService({} as PrismaService)).toBeDefined();
  });

  it('exports CLO-to-course links from course-specific matrices', async () => {
    const prisma = {
      program: {
        findUnique: jest.fn().mockResolvedValue({
          id: 2,
          code: 'CTDT',
          name: 'Chương trình',
          description: null,
        }),
      },
      major: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 7,
            code: 'KTPM',
            name: 'Kỹ thuật phần mềm',
            description: null,
            courses: [{ id: 27, code: 'KTPM101' }],
            plos: [],
            clos: [
              {
                id: 5,
                code: 'CLO1',
                description: 'Mô tả CLO',
                courseMappings: [],
                assessments: [],
              },
            ],
            assessments: [],
          },
        ]),
      },
      analysisSetting: {
        findUnique: jest.fn().mockResolvedValue({ ploThreshold: 75 }),
      },
      matrix: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            courseId: 27,
            level: 2,
            method: 'TT',
            clo: {
              id: 5,
              code: 'CLO1',
              majorId: 7,
              courseMappings: [],
            },
            plo: { code: 'PLO1', majorId: 7 },
            course: { id: 27, code: 'KTPM101', majorId: 7 },
          },
        ]),
      },
    };
    const programsService = new ProgramsService(
      prisma as unknown as PrismaService,
    );

    const result = await programsService.getExportData(2);

    expect(result.majors[0].clos).toEqual([
      {
        code: 'CLO1',
        description: 'Mô tả CLO',
        courseCode: 'KTPM101',
      },
    ]);
  });

  it('rejects a cyclic PLO hierarchy before importing', async () => {
    const prisma = {
      $transaction: jest.fn(),
    };
    const programsService = new ProgramsService(
      prisma as unknown as PrismaService,
    );

    await expect(
      programsService.import({
        ctdt: { MaCTDT: 'CTDT', TenCTDT: 'Chương trình' },
        nganh: [
          { MaNganh: 'KTPM', TenNganh: 'Kỹ thuật phần mềm', MaCTDT: 'CTDT' },
        ],
        hocphan: [
          {
            MaNganh: 'KTPM',
            MaHocPhan: 'KTPM101',
            TenHocPhan: 'Nhập môn',
            SoTinChi: 3,
          },
        ],
        plo: [
          {
            MaNganh: 'KTPM',
            MaPLO: 'PLO1',
            MoTaPLO: 'Chuẩn đầu ra 1',
            MaPLOCha: 'PLO2',
          },
          {
            MaNganh: 'KTPM',
            MaPLO: 'PLO2',
            MoTaPLO: 'Chuẩn đầu ra 2',
            MaPLOCha: 'PLO1',
          },
        ],
        clo: [
          {
            MaNganh: 'KTPM',
            MaHocPhan: 'KTPM101',
            MaCLO: 'CLO1',
            MoTaCLO: 'Chuẩn đầu ra học phần',
          },
        ],
        matrix: [
          {
            MaNganh: 'KTPM',
            MaHocPhan: 'KTPM101',
            MaCLO: 'CLO1',
            MaPLO: 'PLO1',
            MucDongGop: 'R',
            PhuongPhap: 'TT',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
