import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @IsString() @MaxLength(255) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsIn(['LOW', 'MEDIUM', 'HIGH']) priority?: string;
}
