import { Module } from '@nestjs/common';
import { PlosController } from './plos.controller';
import { PlosService } from './plos.service';

@Module({
  controllers: [PlosController],
  providers: [PlosService],
})
export class PlosModule {}
