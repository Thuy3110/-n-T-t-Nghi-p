import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PlosService } from './plos.service';

describe('PlosService', () => {
  let service: PlosService;
  let prisma: {
    major: { findUnique: jest.Mock };
    pLO: {
      findMany: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
      deleteMany: jest.Mock;
    };
    matrix: { count: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      major: { findUnique: jest.fn() },
      pLO: {
        findMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      matrix: { count: jest.fn() },
      $transaction: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<PlosService>(PlosService);
  });

  it('returns the actual PLOs for the selected major', async () => {
    prisma.major.findUnique.mockResolvedValue({
      id: 7,
      code: 'KTPM',
      name: 'Kỹ thuật phần mềm',
    });
    prisma.pLO.findMany.mockResolvedValue([
      {
        id: 1,
        code: 'PLO1',
        description: 'Mô tả PLO 1',
        targetPercent: null,
        directTargetPercent: null,
        isGroupHeader: false,
        parentId: null,
        parent: null,
      },
    ]);

    await expect(service.findByMajor(7)).resolves.toEqual({
      major: { id: 7, code: 'KTPM', name: 'Kỹ thuật phần mềm' },
      plos: [
        {
          id: 1,
          code: 'PLO1',
          description: 'Mô tả PLO 1',
          targetPercent: null,
          directTargetPercent: null,
          isGroupHeader: false,
          parentId: null,
          parent: null,
        },
      ],
    });
  });

  it('rejects target updates for a PLO outside the selected major', async () => {
    prisma.major.findUnique.mockResolvedValue({ id: 7 });
    prisma.pLO.findMany.mockResolvedValue([{ id: 1 }]);

    await expect(
      service.updateTargets(7, [{ id: 2, targetPercent: 80 }]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('saves target percentages transactionally and returns the updated PLO list', async () => {
    prisma.major.findUnique
      .mockResolvedValueOnce({ id: 7 })
      .mockResolvedValueOnce({
        id: 7,
        code: 'KTPM',
        name: 'Kỹ thuật phần mềm',
      });
    prisma.pLO.findMany
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([
        {
          id: 1,
          code: 'PLO1',
          description: 'Mô tả PLO 1',
          targetPercent: 80,
          directTargetPercent: null,
          isGroupHeader: false,
          parentId: null,
          parent: null,
        },
      ]);
    prisma.pLO.update.mockResolvedValue({});
    prisma.$transaction.mockResolvedValue([]);

    const result = await service.updateTargets(7, [
      { id: 1, targetPercent: 80 },
    ]);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.pLO.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { targetPercent: 80 },
    });
    expect(result.plos[0].targetPercent).toBe(80);
  });

  it('saves grouped framework entries and links child indicators to their group', async () => {
    const transaction = {
      pLO: {
        create: jest
          .fn()
          .mockResolvedValueOnce({ id: 10, code: 'PLO1' })
          .mockResolvedValueOnce({ id: 11, code: 'PLO1.1' }),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
    };
    prisma.major.findUnique
      .mockResolvedValueOnce({ id: 7 })
      .mockResolvedValueOnce({
        id: 7,
        code: 'KTPM',
        name: 'Kỹ thuật phần mềm',
      });
    prisma.pLO.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 10,
          code: 'PLO1',
          description: 'Phẩm chất nghề nghiệp',
          targetPercent: null,
          directTargetPercent: null,
          isGroupHeader: true,
          parentId: null,
          parent: null,
        },
        {
          id: 11,
          code: 'PLO1.1',
          description: 'Năng lực chuyên môn',
          targetPercent: 75,
          directTargetPercent: null,
          isGroupHeader: false,
          parentId: 10,
          parent: { code: 'PLO1' },
        },
      ]);
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    const result = await service.saveFramework(7, [
      {
        code: 'PLO1',
        description: 'Phẩm chất nghề nghiệp',
        targetPercent: null,
        isGroupHeader: true,
      },
      {
        code: 'PLO1.1',
        description: 'Năng lực chuyên môn',
        targetPercent: 75,
        isGroupHeader: false,
        parentCode: 'PLO1',
      },
    ]);

    expect(transaction.pLO.create).toHaveBeenNthCalledWith(2, {
      data: {
        majorId: 7,
        code: 'PLO1.1',
        description: 'Năng lực chuyên môn',
        targetPercent: 75,
        isGroupHeader: false,
        parentId: 10,
      },
      select: { id: true, code: true },
    });
    expect(result.plos).toHaveLength(2);
  });

  it('saves TT targets separately from GT targets', async () => {
    const transaction = {
      pLO: {
        create: jest
          .fn()
          .mockResolvedValueOnce({ id: 20, code: 'PLO1' })
          .mockResolvedValueOnce({ id: 21, code: 'PLO1.1' }),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
    };
    prisma.major.findUnique
      .mockResolvedValueOnce({ id: 7 })
      .mockResolvedValueOnce({
        id: 7,
        code: 'KTPM',
        name: 'Kỹ thuật phần mềm',
      });
    prisma.pLO.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 20,
          code: 'PLO1',
          description: 'Phẩm chất nghề nghiệp',
          targetPercent: null,
          directTargetPercent: null,
          isGroupHeader: true,
          parentId: null,
          parent: null,
        },
        {
          id: 21,
          code: 'PLO1.1',
          description: 'Năng lực chuyên môn',
          targetPercent: null,
          directTargetPercent: 85,
          isGroupHeader: false,
          parentId: 20,
          parent: { code: 'PLO1' },
        },
      ]);
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    await service.saveFramework(
      7,
      [
        {
          code: 'PLO1',
          description: 'Phẩm chất nghề nghiệp',
          targetPercent: null,
          isGroupHeader: true,
        },
        {
          code: 'PLO1.1',
          description: 'Năng lực chuyên môn',
          targetPercent: 85,
          isGroupHeader: false,
          parentCode: 'PLO1',
        },
      ],
      'direct',
    );

    expect(transaction.pLO.create).toHaveBeenNthCalledWith(2, {
      data: {
        majorId: 7,
        code: 'PLO1.1',
        description: 'Năng lực chuyên môn',
        directTargetPercent: 85,
        isGroupHeader: false,
        parentId: 20,
      },
      select: { id: true, code: true },
    });
  });

  it('rejects a child indicator whose parent is not a group header', async () => {
    prisma.major.findUnique.mockResolvedValue({ id: 7 });
    prisma.pLO.findMany.mockResolvedValue([]);

    await expect(
      service.saveFramework(7, [
        {
          code: 'PLO1',
          description: 'Chỉ số thường',
          targetPercent: 75,
          isGroupHeader: false,
        },
        {
          code: 'PLO1.1',
          description: 'Chỉ số con',
          targetPercent: 75,
          isGroupHeader: false,
          parentCode: 'PLO1',
        },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
