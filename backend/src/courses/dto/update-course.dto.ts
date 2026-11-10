
import {
    IsInt,
    IsOptional,
    IsString,
    Min,
    MinLength,
    MaxLength,
    Max,
} from 'class-validator';

export class UpdateCourseDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    code?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    credits?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(8)
    semester?: number | null;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    moduleCode?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    replacementCode?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    replacementName?: string | null;
}
