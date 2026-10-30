import { IsIn } from 'class-validator';

export class UpdateRoleDto {
  @IsIn(['USER', 'LECTURER'])
  role!: 'USER' | 'LECTURER';
}
