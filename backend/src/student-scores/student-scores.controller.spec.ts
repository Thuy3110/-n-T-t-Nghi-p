import { Test, TestingModule } from '@nestjs/testing';
import { StudentScoresController } from './student-scores.controller';

describe('StudentScoresController', () => {
  let controller: StudentScoresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentScoresController],
    }).compile();

    controller = module.get<StudentScoresController>(StudentScoresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
