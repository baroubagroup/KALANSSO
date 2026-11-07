import { Injectable, Logger } from '@nestjs/common';
import { SetupSchoolDto } from './dto/setup-school.dto';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  async setupSchool(dto: SetupSchoolDto) {
    this.logger.log(`Initialisation de l'école : ${dto.schoolName} (${dto.city})`);

    // Génération du slug unique
    const slug = dto.schoolName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const schoolId = 'sch_' + Math.random().toString(36).substring(2, 11);

    // Simulation de création transactionnelle dans la base de données
    const result = {
      success: true,
      schoolId,
      slug,
      name: dto.schoolName,
      activeCycles: dto.activeCycles,
      createdClassroomsCount: dto.classrooms.length,
      createdSubjectsCount: dto.subjects.length,
      createdFeeItemsCount: dto.feeItems.length,
      theme: {
        primaryColor: dto.primaryColor || '#1B4D3E',
        watermarkPattern: dto.watermarkPattern || 'FASO_DAN_FANI',
      },
      message: `Établissement '${dto.schoolName}' initialisé avec succès sur kalansso os !`,
      dashboardUrl: `/admin/dashboard?schoolId=${schoolId}`,
    };

    return result;
  }

  async getPresetCyclesAndSubjects() {
    return {
      cycles: [
        { id: 'CRECHE_GARDERIE', label: 'Crèche & Garderie (0 à 3 ans)', defaultScale: 'COMPETENCES' },
        { id: 'MATERNELLE', label: 'Maternelle (TPS, PS, MS, GS)', defaultScale: 'COMPETENCES' },
        { id: 'PRIMAIRE', label: 'Enseignement Primaire (CP1 au CM2 / CEP)', defaultScale: 10 },
        { id: 'POST_PRIMAIRE_COLLEGE', label: 'Post-Primaire / Collège (6ème à 3ème / BEPC)', defaultScale: 20 },
        { id: 'SECONDAIRE_LYCEE_GENERAL', label: 'Secondaire Général / Lycée (2nde à Tle)', defaultScale: 20 },
        { id: 'TECHNIQUE_PROFESSIONNEL', label: 'Technique & Professionnel (Séries F, G, BEP)', defaultScale: 20 },
        { id: 'SUPERIEUR_UNIVERSITE', label: 'Supérieur / Post-BAC (BTS, Licences LMD)', defaultScale: 20 },
      ],
      africanMotifs: [
        { id: 'FASO_DAN_FANI', name: 'Faso Dan Fani (Tissage géométrique élégant du Burkina Faso)' },
        { id: 'TIEBELE_KASSENA', name: 'Cour Royale de Tiébélé (Fresques murales traditionnelles Kasséna)' },
        { id: 'BOGOLAN_GEOMETRIC', name: 'Bogolan Sahélien (Motifs de terre cuite et ocre)' },
        { id: 'MINIMAL_CLEAN', name: 'Épuré & Moderne (Sans motif géométrique en filigrane)' },
      ],
    };
  }
}
