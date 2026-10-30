import { PartialType } from '@nestjs/mapped-types';
import { CreateSurveyFormDto } from './create-survey-form.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSurveyFormDto extends PartialType(CreateSurveyFormDto) {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
