import { Module } from '@nestjs/common';
import { AcademicsController } from './academics.controller';

@Module({
  controllers: [AcademicsController],
  providers: [],
})
export class AcademicsModule {}
