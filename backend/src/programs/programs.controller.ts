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
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProgramsService } from './programs.service';

class ProgramDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  majorCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  majorName!: string;

  @IsOptional()
  @IsString()
  majorDescription?: string;
}

class UpdateProgramDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class AddMajorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

type CtdtImportPayload = {
  ctdt: { MaCTDT: string; TenCTDT: string; MoTa?: string };
  nganh: Array<{ MaNganh: string; TenNganh: string; MoTa?: string }>;
  hocphan: Array<{ MaNganh: string; MaHocPhan: string; TenHocPhan: string; SoTinChi: number; HocKy?: number | string; MaHocPhanThayThe?: string; TenHocPhanThayThe?: string }>;
  plo: Array<{ MaNganh: string; MaPLO: string; MoTaPLO: string; NguongDat?: number | string; MaPLOCha?: string }>;
  clo: Array<{ MaNganh: string; MaHocPhan: string; MaCLO: string; MoTaCLO: string }>;
  matrix: Array<{ MaNganh: string; MaHocPhan: string; MaCLO: string; MaPLO: string; MucDongGop: number | string; PhuongPhap: string }>;
};

@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  findAll() {
    return this.programsService.findAll();
  }

  @Get(':id/export')
  exportData(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.getExportData(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.findOne(id);
  }

  @Post()
  create(@Body() dto: ProgramDto) {
    return this.programsService.create(dto);
  }

  @Post('import')
  import(@Body() payload: CtdtImportPayload) {
    return this.programsService.import(payload);
  }

  @Post(':id/majors')
  addMajor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddMajorDto,
  ) {
    return this.programsService.addMajor(id, dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProgramDto) {
    return this.programsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.remove(id);
  }
}
