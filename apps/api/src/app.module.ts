import { Module } from '@nestjs/common';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { FinanceModule } from './modules/finance/finance.module';
import { AcademicsModule } from './modules/academics/academics.module';

@Module({
  imports: [OnboardingModule, FinanceModule, AcademicsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
