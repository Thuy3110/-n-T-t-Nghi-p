import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

export class CloPloMatrixRowDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  courseId?: number;

  @IsInt()
  @Min(1)
  cloId!: number;

  @IsInt()
  @Min(1)
  ploId!: number;

  @IsInt()
  @IsIn([1, 2, 3])
  level!: number;

  @IsIn(['GT', 'TT'])
  method!: string;
}

export class SaveCloPloMatrixDto {
  @IsArray()
  @ArrayMaxSize(2000)
  @ValidateNested({ each: true })
  @Type(() => CloPloMatrixRowDto)
  rows!: CloPloMatrixRowDto[];
}
