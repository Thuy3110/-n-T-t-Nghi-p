import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class LecturerCloRateDto {
  @IsInt()
  @Min(1)
  courseId!: number;

  @IsInt()
  @Min(1)
  cloId!: number;

  @ValidateIf((_object, value) => value !== null)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  attainmentRate!: number | null;
}

export class CourseCloRateDto {
  @IsOptional()
  @IsInt()
  courseId?: number;

  @IsInt()
  @Min(1)
  cloId!: number;

  @ValidateIf((_object, value) => value !== null)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  attainmentRate!: number | null;
}

export class SaveLecturerCloAssessmentsDto {
  @IsInt()
  @Min(1)
  majorId!: number;

  @IsInt()
  @Min(1900)
  academicYear!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LecturerCloRateDto)
  @ArrayUnique(
    (item: LecturerCloRateDto) =>
      `${item?.courseId ?? ''}:${item?.cloId ?? ''}`,
  )
  assessments!: LecturerCloRateDto[];
}

export class SaveCourseCloAssessmentsDto {
  @IsInt()
  @Min(1)
  courseId!: number;

  @IsInt()
  @Min(1900)
  academicYear!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseCloRateDto)
  @ArrayUnique(
    (item: CourseCloRateDto) => `${item?.cloId ?? ''}`,
  )
  assessments!: CourseCloRateDto[];
}

export class AssignLecturerCoursesDto {
  @IsInt()
  @Min(1)
  userId!: number;

  @IsArray()
  @IsInt({ each: true })
  courseIds!: number[];

  @IsOptional()
  @IsInt()
  @Min(1900)
  academicYear?: number;
}
