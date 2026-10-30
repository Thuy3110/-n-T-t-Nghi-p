import { Test, TestingModule } from '@nestjs/testing';
import { MatricesService } from './matrices.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MatricesService', () => {
  let service: MatricesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatricesService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MatricesService>(MatricesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
