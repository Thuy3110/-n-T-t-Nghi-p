import { Module } from '@nestjs/common';
import { ClosController } from './clos.controller';
import { ClosService } from './clos.service';

@Module({
  controllers: [ClosController],
  providers: [ClosService],
})
export class ClosModule {}
