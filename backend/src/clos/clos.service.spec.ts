import { Test, TestingModule } from '@nestjs/testing';
import { ClosService } from './clos.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClosService', () => {
  let service: ClosService;
  const prisma = {
    cLO: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ClosService>(ClosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('updates the CLO description in the database', async () => {
    prisma.cLO.findUnique.mockResolvedValue({ id: 1 });
    prisma.cLO.update.mockResolvedValue({
      id: 1,
      code: 'CLO1',
      description: 'Mô tả đã sửa',
      majorId: 7,
    });

    await expect(
      service.updateDescription(1, '  Mô tả đã sửa  '),
    ).resolves.toEqual({
      id: 1,
      code: 'CLO1',
      description: 'Mô tả đã sửa',
      majorId: 7,
    });
    expect(prisma.cLO.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { description: 'Mô tả đã sửa' },
      select: {
        id: true,
        code: true,
        description: true,
        majorId: true,
      },
    });
  });

  it('reports a missing CLO instead of returning a success-shaped response', async () => {
    prisma.cLO.findUnique.mockResolvedValue(null);

    await expect(
      service.updateDescription(999, 'Mô tả'),
    ).rejects.toThrow('Không tìm thấy CLO có ID 999');
    expect(prisma.cLO.update).not.toHaveBeenCalled();
  });
});
