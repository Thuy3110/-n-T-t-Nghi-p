import { Test, TestingModule } from '@nestjs/testing';
import { MatricesController } from './matrices.controller';
import { MatricesService } from './matrices.service';

describe('MatricesController', () => {
  let controller: MatricesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatricesController],
      providers: [
        {
          provide: MatricesService,
          useValue: {
            getCloPloMatrix: jest.fn(),
            saveCloPloMatrix: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MatricesController>(MatricesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
