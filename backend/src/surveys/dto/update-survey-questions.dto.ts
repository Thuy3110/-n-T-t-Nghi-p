import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class SurveyQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionText!: string;

  @IsIn(['single', 'multiple', 'text', 'rating'])
  type!: string;

  @IsBoolean()
  required!: boolean;

  @IsArray()
  @ArrayMaxSize(9)
  @IsString({ each: true })
  options!: string[];

  @IsInt()
  @Min(1)
  groupNo!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  groupTitle?: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class UpdateSurveyQuestionsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SurveyQuestionDto)
  questions!: SurveyQuestionDto[];
}
