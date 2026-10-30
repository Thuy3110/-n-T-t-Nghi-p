import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { MajorsService } from './majors.service';

import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';

@Controller('majors')
export class MajorsController {
  constructor(private readonly majorsService: MajorsService) { }

  @Get()
  async findAll() {
    const majors = await this.majorsService.findAll();

    return majors.map((major: any) => ({
      id: major.id,

      majorCode: major.code,
      majorName: major.name,
      createdAt: major.createdAt.toISOString(),
      years: major.majorYears?.map((my: any) => my.academicYear.year) || [],

      subjectCount: major.courses.length,

      plo: major.plos.length,

      clo: major.clos.length,

      kg: major.plos.length + major.clos.length,
    }));
  }

  private mapMajorConfig(major: any) {
    const assessments = major.assessments || [];

    const avgPlo =
      assessments.length > 0
        ? assessments.reduce(
          (sum: number, item: any) => sum + item.ploRate,
          0,
        ) / assessments.length
        : 0;

    const avgClo =
      assessments.length > 0
        ? assessments.reduce(
          (sum: number, item: any) => sum + item.cloRate,
          0,
        ) / assessments.length
        : 0;

    const latestAssessment = assessments.reduce(
      (latest: any, item: any) => (!latest || item.createdAt > latest.createdAt) ? item : latest,
      null as any
    );

    return {
      id: major.id,
      majorCode: major.code,
      majorName: major.name,
      ploThreshold: Number(avgPlo.toFixed(0)) || 75,
      cloThreshold: Number(avgClo.toFixed(0)) || 3,
      enableContribution: true,
      enableSelfAssessment: true,
      updatedAt: latestAssessment ? latestAssessment.createdAt.toISOString() : major.createdAt.toISOString(),
      courses: major.courses || [],
      plos: major.plos || [],
      clos: major.clos || [],
      matrixData: major.matrixData || null,
      enabledCoursesData: major.enabledCoursesData || null,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    const major = (await this.majorsService.findOne(id)) as any;

    if (!major) {
      return null;
    }

    return this.mapMajorConfig(major);
  }

  @Post()
  create(
    @Body()
    dto: CreateMajorDto,
  ) {
    return this.majorsService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdateMajorDto,
  ) {
    const major = await this.majorsService.update(id, dto);
    if (!major) {
      return null;
    }
    return this.mapMajorConfig(major);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.majorsService.remove(id);
  }
}