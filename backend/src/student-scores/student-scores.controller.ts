
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { StudentScoresService } from './student-scores.service';

@Controller('student-scores')
export class StudentScoresController {
  constructor(
    private readonly studentScoresService: StudentScoresService,
  ) {}

  @Post('import-excel')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
  @UploadedFile()
file?: {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
},
) {
    if (!file) {
      throw new BadRequestException(
        'Vui lòng chọn file Excel để nhập điểm.',
      );
    }

    const workbook = XLSX.read(file.buffer, {
      type: 'buffer',
      cellDates: true,
    });

    const sheetName =
      workbook.SheetNames.find((name) => name === 'Nhap diem') ??
      workbook.SheetNames[0];

    if (!sheetName) {
      throw new BadRequestException('File Excel không có sheet dữ liệu.');
    }

    const sheet = workbook.Sheets[sheetName];

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      sheet,
      { defval: '' },
    );

    if (rawRows.length === 0) {
      throw new BadRequestException('Sheet Excel không có dữ liệu.');
    }

    const rows = rawRows.map((row, index) => ({
      MaSV: String(row['MaSV'] ?? '').trim(),
      MaMH: String(row['MaMH'] ?? '').trim(),
      MaCLO: String(row['MaCLO'] ?? '').trim(),
      Diem: row['Diem'] as number | string,
      GhiChu: String(row['GhiChu'] ?? '').trim(),
      excelRow: index + 2,
    }));

    return this.studentScoresService.importScores(rows);
  }
}
