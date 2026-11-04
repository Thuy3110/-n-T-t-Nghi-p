import { Module } from '@nestjs/common';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LecturerCloAssessmentsController } from './lecturer-clo-assessments.controller';
import { LecturerCloAssessmentsService } from './lecturer-clo-assessments.service';
import { LecturerAssessmentRoleGuard } from './lecturer-assessment-role.guard';

@Module({
  imports: [AuthModule],
  controllers: [AssessmentsController, LecturerCloAssessmentsController],
  providers: [
    AssessmentsService,
    LecturerCloAssessmentsService,
    LecturerAssessmentRoleGuard,
    JwtAuthGuard,
  ],
})
export class AssessmentsModule {}
