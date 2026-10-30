import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentsService } from './assessments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AssessmentsService', () => {
  let service: AssessmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentsService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<AssessmentsService>(AssessmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('calculates each PLO from weighted CLO scores and reports missing evidence', async () => {
    const prisma = {
      major: {
        findUnique: jest.fn().mockResolvedValue({
          id: 4,
          code: 'SPTH',
          name: 'Sư phạm Tin học',
          assessments: [],
          plos: [
            {
              id: 11,
              code: 'PLO1',
              description: 'Kiến thức chuyên môn',
              matrices: [
                { cloId: 21, level: 1 },
                { cloId: 22, level: 3 },
              ],
            },
            {
              id: 12,
              code: 'PLO2',
              description: 'Kỹ năng nghề nghiệp',
              matrices: [{ cloId: 23, level: 2 }],
            },
          ],
        }),
      },
      student: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 31,
            studentCode: 'SV001',
            fullName: 'Nguyễn Văn An',
            cloScores: [
              { cloId: 21, score: 8 },
              { cloId: 22, score: 6 },
            ],
          },
        ]),
      },
    };
    const service = new AssessmentsService(prisma as unknown as PrismaService);

    const result = await service.getPloResults(4, 2025);

    expect(result.students[0].ploResults).toEqual([
      expect.objectContaining({ code: 'PLO1', scorePercent: 65, achieved: false }),
      expect.objectContaining({ code: 'PLO2', scorePercent: null, achieved: null }),
    ]);
    expect(result.evaluatedCount).toBe(1);
    expect(result.attainmentRate).toBe(0);
  });
});
