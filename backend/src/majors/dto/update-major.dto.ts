import { PartialType } from '@nestjs/mapped-types';
import { CreateMajorDto } from './create-major.dto';
import { IsOptional, IsNumber, IsBoolean, IsString } from 'class-validator';

export class UpdateMajorDto extends PartialType(CreateMajorDto) {
  @IsOptional()
  @IsString()
  matrixData?: string;

  @IsOptional()
  @IsString()
  enabledCoursesData?: string;

  @IsOptional()
  @IsNumber()
  ploThreshold?: number;

  @IsOptional()
  @IsNumber()
  cloThreshold?: number;

  @IsOptional()
  @IsBoolean()
  enableContribution?: boolean;

  @IsOptional()
  @IsBoolean()
  enableSelfAssessment?: boolean;
}