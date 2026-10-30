import { IsBoolean } from 'class-validator';

export class UpdateSurveyDashboardSettingDto {
  @IsBoolean()
  cdrConversion!: boolean;
}
