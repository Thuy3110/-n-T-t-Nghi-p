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
export class LecturerCloAssessmentsController {
  constructor(
    private readonly lecturerCloAssessmentsService: LecturerCloAssessmentsService,
  ) {}

  @Get('years')
  listYears() {
    return this.lecturerCloAssessmentsService.listYears();
  }

  @UseGuards(JwtAuthGuard, LecturerAssessmentRoleGuard)
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

  @UseGuards(JwtAuthGuard, LecturerAssessmentRoleGuard)
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

  @UseGuards(JwtAuthGuard, LecturerAssessmentRoleGuard)
  @Get('assignments')
  getAssignments() {
    return this.lecturerCloAssessmentsService.getAssignments();
  }

  @UseGuards(JwtAuthGuard, LecturerAssessmentRoleGuard)
  @Post('assign')
  assignCourses(@Body() data: AssignLecturerCoursesDto) {
    return this.lecturerCloAssessmentsService.assignCourses(data);
  }

  @UseGuards(JwtAuthGuard, LecturerAssessmentRoleGuard)
  @Get('report')
  getProgramReport(@Query('academicYear', ParseIntPipe) academicYear: number) {
    return this.lecturerCloAssessmentsService.getProgramReport(academicYear);
  }

  @UseGuards(JwtAuthGuard, LecturerAssessmentRoleGuard)
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

  @UseGuards(JwtAuthGuard, LecturerAssessmentRoleGuard)
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
