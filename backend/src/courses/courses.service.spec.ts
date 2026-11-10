import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CoursesService', () => {
  let service: CoursesService;
  const prisma = {
    course: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('allows semesters through the eighth term', async () => {
    prisma.course.findUnique.mockResolvedValue({ id: 1 });
    prisma.course.update.mockResolvedValue({ id: 1, semester: 8 });

    await expect(service.updateSemester(1, 8)).resolves.toEqual({
      id: 1,
      semester: 8,
    });
  });

  it('rejects semesters outside the four-year curriculum', async () => {
    await expect(service.updateSemester(1, 9)).rejects.toThrow(
      'Học kỳ phải là số nguyên từ 1 đến 8.',
    );
    expect(prisma.course.findUnique).not.toHaveBeenCalled();
  });
});
