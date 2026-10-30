import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdatePreferenceDto {
  @IsOptional() @IsString() @IsIn(['vi', 'en']) language?: string;
  @IsOptional() @IsString() @IsIn(['light', 'dark']) theme?: string;
  @IsOptional() @IsBoolean() emailNotifications?: boolean;
  @IsOptional() @IsBoolean() taskNotifications?: boolean;
}
