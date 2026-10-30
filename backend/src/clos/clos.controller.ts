import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { ClosService } from './clos.service';

class UpdateCloDescriptionDto {
  @IsString()
  @MinLength(1)
  description!: string;
}

@Controller('clos')
export class ClosController {
  constructor(private readonly closService: ClosService) {}

  @Patch(':id/description')
  updateDescription(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCloDescriptionDto,
  ) {
    return this.closService.updateDescription(id, dto.description);
  }
}
