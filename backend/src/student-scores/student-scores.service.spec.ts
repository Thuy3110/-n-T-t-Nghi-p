import { Test, TestingModule } from '@nestjs/testing';
import { StudentScoresService } from './student-scores.service';

describe('StudentScoresService', () => {
  let service: StudentScoresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentScoresService],
    }).compile();

    service = module.get<StudentScoresService>(StudentScoresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
