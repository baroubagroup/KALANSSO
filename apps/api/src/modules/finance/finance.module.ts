import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';

@Module({
  controllers: [FinanceController],
  providers: [],
})
export class FinanceModule {}
