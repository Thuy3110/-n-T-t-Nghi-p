import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AssessmentsService, CloScoreImportRow } from './assessments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('assessments')
@UseGuards(JwtAuthGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post('import-clo-scores')
  importCloScores(@Body('rows') rows: CloScoreImportRow[]) {
    return this.assessmentsService.importCloScores(rows);
  }

  @Get('plo-results')
  getPloResults(
    @Query('majorId') majorId: string,
    @Query('cohortYear') cohortYear: string,
  ) {
    return this.assessmentsService.getPloResults(Number(majorId), Number(cohortYear));
  }
}
