import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSurveyFormDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  year!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isCdr?: boolean;

  @IsOptional()
  @IsString()
  link?: string;

  @IsIn(['LV1', 'LV2'])
  level!: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  legacyLink?: string;

  @IsOptional()
  @IsIn(['main', 'sidebar'])
  menu?: string;

  @IsOptional()
  @IsString()
  classes?: string;
}
