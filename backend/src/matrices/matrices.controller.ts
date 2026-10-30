import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { SaveCloPloMatrixDto } from './dto/save-clo-plo-matrix.dto';
import { MatricesService } from './matrices.service';

@Controller('matrices')
export class MatricesController {
  constructor(private readonly matricesService: MatricesService) {}

  @Get('clo-plo/:majorId')
  getCloPloMatrix(@Param('majorId', ParseIntPipe) majorId: number) {
    return this.matricesService.getCloPloMatrix(majorId);
  }

  @Put('clo-plo/:majorId')
  saveCloPloMatrix(
    @Param('majorId', ParseIntPipe) majorId: number,
    @Body() dto: SaveCloPloMatrixDto,
  ) {
    return this.matricesService.saveCloPloMatrix(majorId, dto);
  }
}
