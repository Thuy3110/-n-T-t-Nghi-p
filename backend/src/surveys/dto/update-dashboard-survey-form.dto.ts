import { PartialType } from '@nestjs/mapped-types';
import { CreateDashboardSurveyFormDto } from './create-dashboard-survey-form.dto';

export class UpdateDashboardSurveyFormDto extends PartialType(
  CreateDashboardSurveyFormDto,
) {}
