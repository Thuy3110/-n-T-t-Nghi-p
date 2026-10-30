import { Test, TestingModule } from '@nestjs/testing';
import { SurveysController } from './surveys.controller';
import { SurveysService } from './surveys.service';

describe('SurveysController', () => {
  let controller: SurveysController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SurveysController],
      providers: [
        {
          provide: SurveysService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SurveysController>(SurveysController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
