import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { ProgramsModule } from './programs/programs.module';
import { CoursesModule } from './courses/courses.module';
import { PlosModule } from './plos/plos.module';
import { ClosModule } from './clos/clos.module';
import { MatricesModule } from './matrices/matrices.module';
import { StudentsModule } from './students/students.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { SurveysModule } from './surveys/surveys.module';
import { ReportsModule } from './reports/reports.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { MajorsModule } from './majors/majors.module';
import { StatisticsModule } from "./statistics/statistics.module";
import { StudentScoresModule } from './student-scores/student-scores.module';
import { SystemSettingsModule } from './system-settings/system-settings.module';

@Module({
  
imports: [
  ConfigModule,
  PrismaModule,
  AuthModule,
  UsersModule,
  RolesModule,
  ProgramsModule,
  CoursesModule,
  PlosModule,
  ClosModule,
  MatricesModule,
  StudentsModule,
  AssessmentsModule,
  SurveysModule,
  ReportsModule,
  MajorsModule,
  StatisticsModule,
    StudentScoresModule,
    SystemSettingsModule,
],


  controllers: [AppController],
  providers: [AppService],
  
})
export class AppModule {}
