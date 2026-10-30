import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CreateSurveyFormDto } from './dto/create-survey-form.dto';
import { CreateDashboardSurveyFormDto } from './dto/create-dashboard-survey-form.dto';
import { UpdateSurveyDashboardSettingDto } from './dto/update-survey-dashboard-setting.dto';
import { UpdateDashboardSurveyFormDto } from './dto/update-dashboard-survey-form.dto';
import { UpdateSurveyQuestionsDto } from './dto/update-survey-questions.dto';
import { UpdateSurveyFormDto } from './dto/update-survey-form.dto';
import { SurveysService } from './surveys.service';

@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Get()
  findAll() {
    return this.surveysService.findAll();
  }

  @Get('dashboard')
  getDashboard() {
    return this.surveysService.getDashboard();
  }

  @Patch('dashboard/settings')
  updateDashboardSettings(@Body() dto: UpdateSurveyDashboardSettingDto) {
    return this.surveysService.updateDashboardSettings(dto);
  }

  @Get('dashboard/forms')
  findDashboardForms() {
    return this.surveysService.findDashboardForms();
  }

  @Post('dashboard/forms')
  createDashboardForm(@Body() dto: CreateDashboardSurveyFormDto) {
    return this.surveysService.createDashboardForm(dto);
  }

  @Get('dashboard/forms/:id/questions')
  findDashboardQuestions(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.findDashboardQuestions(id);
  }

  @Put('dashboard/forms/:id/questions')
  saveDashboardQuestions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSurveyQuestionsDto,
  ) {
    return this.surveysService.saveDashboardQuestions(id, dto);
  }

  @Patch('dashboard/forms/:id')
  updateDashboardForm(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDashboardSurveyFormDto,
  ) {
    return this.surveysService.updateDashboardForm(id, dto);
  }

  @Delete('dashboard/forms/:id')
  removeDashboardForm(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.removeDashboardForm(id);
  }

  @Post()
  create(@Body() dto: CreateSurveyFormDto) {
    return this.surveysService.create(dto);
  }

  @Get(':id/questions')
  findQuestions(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.findQuestions(id);
  }

  @Put(':id/questions')
  saveQuestions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSurveyQuestionsDto,
  ) {
    return this.surveysService.saveQuestions(id, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSurveyFormDto,
  ) {
    return this.surveysService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.remove(id);
  }
}
