// ==============================================================================
// PROJET : kalansso os
// MODULE : TYPES TYPESCRIPT PARTAGÉS (@kalansso/types)
// ==============================================================================

export type SchoolType =
  | 'PUBLIC'
  | 'PRIVATE_LAIC'
  | 'CONFESSIONAL_CATHOLIC'
  | 'CONFESSIONAL_PROTESTANT'
  | 'FRANCO_ARABE'
  | 'INTERNATIONAL';

export type SchoolCycle =
  | 'CRECHE_GARDERIE'
  | 'MATERNELLE'
  | 'PRIMAIRE'
  | 'POST_PRIMAIRE_COLLEGE'
  | 'SECONDAIRE_LYCEE_GENERAL'
  | 'TECHNIQUE_PROFESSIONNEL'
  | 'SUPERIEUR_UNIVERSITE';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'FOUNDER_DG'
  | 'PROVISEUR_DIR'
  | 'CENSEUR_DE'
  | 'SURVEILLANT_GEN'
  | 'COMPTABLE_CAISSE'
  | 'SECRETAIRE'
  | 'ENSEIGNANT'
  | 'PARENT'
  | 'ELEVE'
  | 'INFIRMIER'
  | 'CHAUFFEUR_BUS';

export type PaymentChannel =
  | 'CASH'
  | 'MOOV_MONEY'
  | 'ORANGE_MONEY'
  | 'CORIS_MONEY'
  | 'WAVE'
  | 'CHECK'
  | 'BANK_TRANSFER';

export type AfricanMotifPattern =
  | 'FASO_DAN_FANI'
  | 'TIEBELE_KASSENA'
  | 'BOGOLAN_GEOMETRIC'
  | 'MINIMAL_CLEAN';

export interface SchoolProfile {
  id: string;
  name: string;
  codeMenapln?: string;
  slug: string;
  schoolType: SchoolType;
  activeCycles: SchoolCycle[];
  city: string;
  countryCode: string;
  phone: string;
  email?: string;
  motto?: string;
  logoUrl?: string;
  primaryColor: string;
  watermarkPattern: AfricanMotifPattern;
  gradingRules: Record<string, unknown>;
  feeSettings: Record<string, unknown>;
  isActive: boolean;
}

export interface SetupWizardData {
  // Étape 1 : Profil & Coordonnées
  schoolName: string;
  schoolType: SchoolType;
  codeMenapln?: string;
  city: string;
  phone: string;
  email?: string;
  motto?: string;

  // Étape 2 : Cycles & Classes
  activeCycles: SchoolCycle[];
  classrooms: Array<{
    name: string;
    levelCode: string;
    cycle: SchoolCycle;
    capacity: number;
    roomNumber?: string;
  }>;

  // Étape 3 : Périodes & Système de notation
  periodType: 'TRIMESTER' | 'SEMESTER' | 'CUSTOM';
  gradingScale: number; // 20 ou 10
  subjects: Array<{
    name: string;
    code: string;
    cycle: SchoolCycle;
    coefficient: number;
  }>;

  // Étape 4 : Grille tarifaire
  feeItems: Array<{
    name: string;
    category: string;
    amount: number;
    isMandatory: boolean;
  }>;
  paymentInstallments: number; // 1, 3 ou 9

  // Étape 5 : Identité visuelle
  primaryColor: string;
  watermarkPattern: AfricanMotifPattern;
}
