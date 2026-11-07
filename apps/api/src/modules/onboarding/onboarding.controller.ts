import { Controller, Post, Body, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { SetupSchoolDto } from './dto/setup-school.dto';

@ApiTags('Assistant de Démarrage (Setup Wizard)')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('setup-school')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Initialisation complète d'un établissement scolaire via le Setup Wizard" })
  @ApiResponse({ status: 201, description: 'Établissement créé et configuré avec succès.' })
  async setupSchool(@Body() dto: SetupSchoolDto) {
    return this.onboardingService.setupSchool(dto);
  }

  @Get('presets')
  @ApiOperation({ summary: 'Récupération des catalogues prédéfinis de cycles, barèmes et motifs africains' })
  async getPresets() {
    return this.onboardingService.getPresetCyclesAndSubjects();
  }
}
