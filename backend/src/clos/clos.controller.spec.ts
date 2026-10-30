import { Test, TestingModule } from '@nestjs/testing';
import { ClosController } from './clos.controller';
import { ClosService } from './clos.service';

describe('ClosController', () => {
  let controller: ClosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClosController],
      providers: [
        {
          provide: ClosService,
          useValue: { updateDescription: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ClosController>(ClosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
