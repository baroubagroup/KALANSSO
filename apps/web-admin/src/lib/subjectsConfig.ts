// Gestionnaire officiel des matières, programmes et coefficients selon les normes MENAPLN du Burkina Faso

export type EducationCycle = 'MATERNELLE' | 'PRIMAIRE' | 'COLLEGE' | 'LYCEE';

export type SubjectCategory = 'LITTERAIRE' | 'SCIENTIFIQUE' | 'SCIENCES_HUMAINES' | 'ARTS_SPORT' | 'PRATIQUE';

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
  category: SubjectCategory;
  cycle: EducationCycle;
  classrooms: string[]; // Classes autorisées ou ['ALL']
  coefficient: number;
  maxScore: number; // 20 au secondaire, 10 ou 20 au primaire
  isActive: boolean;
  isCustom?: boolean;
}

export const DEFAULT_BURKINA_SUBJECTS: SubjectItem[] = [
  // ── PRIMAIRE (Barème standard sur 10) ──
  { id: 'sub-pri-01', name: 'Lecture & Compréhension', code: 'LECT', category: 'LITTERAIRE', cycle: 'PRIMAIRE', classrooms: ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'], coefficient: 2, maxScore: 10, isActive: true },
  { id: 'sub-pri-02', name: 'Expression Écrite / Rédaction', code: 'RED', category: 'LITTERAIRE', cycle: 'PRIMAIRE', classrooms: ['CE1', 'CE2', 'CM1', 'CM2'], coefficient: 2, maxScore: 10, isActive: true },
  { id: 'sub-pri-03', name: 'Dictée & Questions', code: 'DICT', category: 'LITTERAIRE', cycle: 'PRIMAIRE', classrooms: ['CE1', 'CE2', 'CM1', 'CM2'], coefficient: 2, maxScore: 10, isActive: true },
  { id: 'sub-pri-04', name: 'Grammaire, Conjugaison & Vocabulaire', code: 'ETUD_L', category: 'LITTERAIRE', cycle: 'PRIMAIRE', classrooms: ['CE1', 'CE2', 'CM1', 'CM2'], coefficient: 1, maxScore: 10, isActive: true },
  { id: 'sub-pri-05', name: 'Calcul Mental & Opérations', code: 'OPER', category: 'SCIENTIFIQUE', cycle: 'PRIMAIRE', classrooms: ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'], coefficient: 2, maxScore: 10, isActive: true },
  { id: 'sub-pri-06', name: 'Résolution de Problèmes', code: 'PROB', category: 'SCIENTIFIQUE', cycle: 'PRIMAIRE', classrooms: ['CE1', 'CE2', 'CM1', 'CM2'], coefficient: 2, maxScore: 10, isActive: true },
  { id: 'sub-pri-07', name: 'Géométrie & Mesures', code: 'GEOM', category: 'SCIENTIFIQUE', cycle: 'PRIMAIRE', classrooms: ['CE1', 'CE2', 'CM1', 'CM2'], coefficient: 1, maxScore: 10, isActive: true },
  { id: 'sub-pri-08', name: 'Histoire & Géographie', code: 'HG_PRI', category: 'SCIENCES_HUMAINES', cycle: 'PRIMAIRE', classrooms: ['CE1', 'CE2', 'CM1', 'CM2'], coefficient: 1, maxScore: 10, isActive: true },
  { id: 'sub-pri-09', name: 'Sciences d’Observation & Hygiène', code: 'SCI_OBS', category: 'SCIENTIFIQUE', cycle: 'PRIMAIRE', classrooms: ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'], coefficient: 1, maxScore: 10, isActive: true },
  { id: 'sub-pri-10', name: 'Dessin / Travaux Manuels', code: 'DESS', category: 'ARTS_SPORT', cycle: 'PRIMAIRE', classrooms: ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'], coefficient: 1, maxScore: 10, isActive: true },
  { id: 'sub-pri-11', name: 'Éducation Physique & Sportive (EPS)', code: 'EPS_PRI', category: 'ARTS_SPORT', cycle: 'PRIMAIRE', classrooms: ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'], coefficient: 1, maxScore: 10, isActive: true },

  // ── COLLÈGE (6ème, 5ème, 4ème, 3ème - BEPC) ──
  { id: 'sub-col-01', name: 'Français (Expression & Texte)', code: 'FRAN', category: 'LITTERAIRE', cycle: 'COLLEGE', classrooms: ['6EME', '5EME', '4EME', '3EME'], coefficient: 5, maxScore: 20, isActive: true },
  { id: 'sub-col-02', name: 'Mathématiques', code: 'MATH', category: 'SCIENTIFIQUE', cycle: 'COLLEGE', classrooms: ['6EME', '5EME', '4EME', '3EME'], coefficient: 4, maxScore: 20, isActive: true },
  { id: 'sub-col-03', name: 'Physique-Chimie', code: 'PC', category: 'SCIENTIFIQUE', cycle: 'COLLEGE', classrooms: ['4EME', '3EME'], coefficient: 2, maxScore: 20, isActive: true },
  { id: 'sub-col-04', name: 'Sciences de la Vie et de la Terre (SVT)', code: 'SVT', category: 'SCIENTIFIQUE', cycle: 'COLLEGE', classrooms: ['6EME', '5EME', '4EME', '3EME'], coefficient: 2, maxScore: 20, isActive: true },
  { id: 'sub-col-05', name: 'Anglais', code: 'ANG', category: 'LITTERAIRE', cycle: 'COLLEGE', classrooms: ['6EME', '5EME', '4EME', '3EME'], coefficient: 3, maxScore: 20, isActive: true },
  { id: 'sub-col-06', name: 'Histoire-Géographie', code: 'HG', category: 'SCIENCES_HUMAINES', cycle: 'COLLEGE', classrooms: ['6EME', '5EME', '4EME', '3EME'], coefficient: 3, maxScore: 20, isActive: true },
  { id: 'sub-col-07', name: 'Éducation Physique & Sportive (EPS)', code: 'EPS', category: 'ARTS_SPORT', cycle: 'COLLEGE', classrooms: ['6EME', '5EME', '4EME', '3EME'], coefficient: 2, maxScore: 20, isActive: true },
  { id: 'sub-col-08', name: 'Arts Plastiques / Musique', code: 'ARTS', category: 'ARTS_SPORT', cycle: 'COLLEGE', classrooms: ['6EME', '5EME', '4EME', '3EME'], coefficient: 1, maxScore: 20, isActive: true },

  // ── LYCÉE GÉNÉRAL (Terminale D - BAC D) ──
  { id: 'sub-lyc-01', name: 'Mathématiques', code: 'MATH_D', category: 'SCIENTIFIQUE', cycle: 'LYCEE', classrooms: ['2NDE_C', '1ERE_D', 'TLE_D'], coefficient: 4, maxScore: 20, isActive: true },
  { id: 'sub-lyc-02', name: 'Physique-Chimie', code: 'PC_D', category: 'SCIENTIFIQUE', cycle: 'LYCEE', classrooms: ['2NDE_C', '1ERE_D', 'TLE_D'], coefficient: 5, maxScore: 20, isActive: true },
  { id: 'sub-lyc-03', name: 'Sciences de la Vie et de la Terre (SVT)', code: 'SVT_D', category: 'SCIENTIFIQUE', cycle: 'LYCEE', classrooms: ['2NDE_C', '1ERE_D', 'TLE_D'], coefficient: 5, maxScore: 20, isActive: true },
  { id: 'sub-lyc-04', name: 'Philosophie', code: 'PHILO', category: 'LITTERAIRE', cycle: 'LYCEE', classrooms: ['TLE_A', 'TLE_D'], coefficient: 3, maxScore: 20, isActive: true },
  { id: 'sub-lyc-05', name: 'Français', code: 'FRAN_L', category: 'LITTERAIRE', cycle: 'LYCEE', classrooms: ['2NDE_A', '2NDE_C', '1ERE_A', '1ERE_D'], coefficient: 3, maxScore: 20, isActive: true },
  { id: 'sub-lyc-06', name: 'Anglais', code: 'ANG_L', category: 'LITTERAIRE', cycle: 'LYCEE', classrooms: ['2NDE_A', '2NDE_C', '1ERE_A', '1ERE_D', 'TLE_A', 'TLE_D'], coefficient: 2, maxScore: 20, isActive: true },
  { id: 'sub-lyc-07', name: 'Histoire-Géographie', code: 'HG_L', category: 'SCIENCES_HUMAINES', cycle: 'LYCEE', classrooms: ['2NDE_A', '2NDE_C', '1ERE_A', '1ERE_D', 'TLE_A', 'TLE_D'], coefficient: 2, maxScore: 20, isActive: true },
  { id: 'sub-lyc-08', name: 'Éducation Physique & Sportive (EPS)', code: 'EPS_L', category: 'ARTS_SPORT', cycle: 'LYCEE', classrooms: ['2NDE_A', '2NDE_C', '1ERE_A', '1ERE_D', 'TLE_A', 'TLE_D'], coefficient: 2, maxScore: 20, isActive: true },
];

const STORAGE_KEY = 'kalansso_subjects_config_v2';

export function getAllSubjects(): SubjectItem[] {
  if (typeof window === 'undefined') return DEFAULT_BURKINA_SUBJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BURKINA_SUBJECTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return DEFAULT_BURKINA_SUBJECTS;
}

export function saveAllSubjects(subjects: SubjectItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
    window.dispatchEvent(new CustomEvent('kalansso_subjects_updated', { detail: { count: subjects.length } }));
  } catch (err) {
    console.error('Erreur sauvegarde matières:', err);
  }
}

export function resetToBurkinaDefaultSubjects(): SubjectItem[] {
  saveAllSubjects(DEFAULT_BURKINA_SUBJECTS);
  return DEFAULT_BURKINA_SUBJECTS;
}

// Filtre les matières pertinentes pour une classe donnée
export function getSubjectsForClassroom(classroomName: string, cycle?: string): SubjectItem[] {
  const all = getAllSubjects().filter((s) => s.isActive);
  const upper = classroomName.toUpperCase();

  // 1. Si Primaire (CP, CE, CM)
  if (cycle === 'PRIMAIRE' || /CP|CE|CM/i.test(upper)) {
    return all.filter((s) => s.cycle === 'PRIMAIRE');
  }

  // 2. Si Lycée (2nde, 1ère, Terminale, TLE)
  if (cycle === 'LYCEE' || /TERMINALE|TLE|1ERE|2NDE/i.test(upper)) {
    return all.filter((s) => s.cycle === 'LYCEE');
  }

  // 3. Si Collège (6ème, 5ème, 4ème, 3ème)
  if (cycle === 'COLLEGE' || /6EME|6È|5EME|5È|4EME|4È|3EME|3È/i.test(upper)) {
    return all.filter((s) => s.cycle === 'COLLEGE');
  }

  // Par défaut, retourner tout ce qui correspond au cycle ou tout
  return all.filter((s) => (cycle ? s.cycle === cycle : true));
}
