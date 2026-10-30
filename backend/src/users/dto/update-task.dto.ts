import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTaskDto {
  @IsOptional() @IsString() @MaxLength(255) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() dueDate?: string | null;
  @IsOptional() @IsIn(['LOW', 'MEDIUM', 'HIGH']) priority?: string;
  @IsOptional() @IsIn(['TODO', 'IN_PROGRESS', 'DONE']) status?: string;
}
