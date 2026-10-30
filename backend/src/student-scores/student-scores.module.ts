import { Module } from '@nestjs/common';
import { StudentScoresService } from './student-scores.service';
import { StudentScoresController } from './student-scores.controller';

@Module({
  providers: [StudentScoresService],
  controllers: [StudentScoresController]
})
export class StudentScoresModule {}
