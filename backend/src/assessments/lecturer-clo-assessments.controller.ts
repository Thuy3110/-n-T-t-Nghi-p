import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LecturerCloAssessmentsService } from './lecturer-clo-assessments.service';
import { LecturerAssessmentRoleGuard } from './lecturer-assessment-role.guard';
import {
  AssignLecturerCoursesDto,
  SaveCourseCloAssessmentsDto,
  SaveLecturerCloAssessmentsDto,
} from './lecturer-clo-assessment.dto';

type AuthenticatedRequest = Request & {
  user: { sub: number };
};

@Controller('assessments/lecturer-clo')
@UseGuards(JwtAuthGuard, LecturerAssessmentRoleGuard)
export class LecturerCloAssessmentsController {
  constructor(
    private readonly lecturerCloAssessmentsService: LecturerCloAssessmentsService,
  ) {}

  @Get('years')
  listYears() {
    return this.lecturerCloAssessmentsService.listYears();
  }

  @Get('my-courses')
  getMyCourses(
    @Query('academicYear', ParseIntPipe) academicYear: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.lecturerCloAssessmentsService.getMyCourses(
      request.user.sub,
      academicYear,
    );
  }

  @Post('course')
  saveCourseAssessments(
    @Body() data: SaveCourseCloAssessmentsDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.lecturerCloAssessmentsService.saveCourseAssessments(
      request.user.sub,
      data,
    );
  }

  @Get('assignments')
  getAssignments() {
    return this.lecturerCloAssessmentsService.getAssignments();
  }

  @Post('assign')
  assignCourses(@Body() data: AssignLecturerCoursesDto) {
    return this.lecturerCloAssessmentsService.assignCourses(data);
  }

  @Get('report')
  getProgramReport(@Query('academicYear', ParseIntPipe) academicYear: number) {
    return this.lecturerCloAssessmentsService.getProgramReport(academicYear);
  }

  @Get()
  getMajorAssessments(
    @Query('majorId', ParseIntPipe) majorId: number,
    @Query('academicYear', ParseIntPipe) academicYear: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.lecturerCloAssessmentsService.getMajorAssessments(
      majorId,
      academicYear,
      request.user.sub,
    );
  }

  @Post()
  saveAssessments(
    @Body() data: SaveLecturerCloAssessmentsDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.lecturerCloAssessmentsService.saveAssessments(
      request.user.sub,
      data,
    );
  }
}
