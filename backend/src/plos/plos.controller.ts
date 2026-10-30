import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Put,
} from '@nestjs/common';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlosService } from './plos.service';

class PloTargetDto {
  @IsInt()
  @Min(1)
  id!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  targetPercent!: number;
}

class UpdatePloTargetsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PloTargetDto)
  targets!: PloTargetDto[];
}

class PloFrameworkEntryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;

  @IsString()
  code!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  targetPercent!: number | null;

  @IsBoolean()
  isGroupHeader!: boolean;

  @IsOptional()
  @IsString()
  parentCode?: string | null;
}

class SavePloFrameworkDto {
  @IsOptional()
  @IsIn(['direct', 'indirect'])
  assessmentType?: 'direct' | 'indirect';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PloFrameworkEntryDto)
  entries!: PloFrameworkEntryDto[];
}

@Controller('plos')
export class PlosController {
  constructor(private readonly plosService: PlosService) {}

  @Get('major/:majorId')
  findByMajor(@Param('majorId', ParseIntPipe) majorId: number) {
    return this.plosService.findByMajor(majorId);
  }

  @Patch('major/:majorId/targets')
  updateTargets(
    @Param('majorId', ParseIntPipe) majorId: number,
    @Body() dto: UpdatePloTargetsDto,
  ) {
    return this.plosService.updateTargets(majorId, dto.targets);
  }

  @Put('major/:majorId/framework')
  saveFramework(
    @Param('majorId', ParseIntPipe) majorId: number,
    @Body() dto: SavePloFrameworkDto,
  ) {
    return this.plosService.saveFramework(
      majorId,
      dto.entries,
      dto.assessmentType,
    );
  }
}
