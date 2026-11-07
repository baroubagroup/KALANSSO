import { supabase } from './supabase';
import { WatermarkPattern } from '@/components/motifs/AfricanMotif';

export interface PhoneContact {
  id: string;
  label: string;
  phone: string;
}

export interface GradingScaleItem {
  id: string;
  minAverage: number;
  maxAverage: number;
  mention: string;
  appreciation: string;
  badgeColor: string;
}

export interface SchoolModulesConfig {
  canteen_enabled: boolean;
  transport_enabled: boolean;
  infirmary_enabled: boolean;
  boarding_enabled: boolean;
}

export const DEFAULT_MODULES_CONFIG: SchoolModulesConfig = {
  canteen_enabled: false,
  transport_enabled: false,
  infirmary_enabled: false,
  boarding_enabled: false,
};

export interface SchoolSettings {
  id?: string;
  name: string;
  code_menapln: string;
  matricule_prefix?: string; // Préfixe d'établissement pour les matricules élèves (ex: 'CSWM', 'ABC')
  city: string;
  address?: string;
  phone: string;
  phones?: PhoneContact[];
  email?: string;
  motto: string;
  approval_number?: string;
  director_name?: string;
  director_title?: string;
  logo_url?: string;
  watermark_pattern: WatermarkPattern;
  grading_scale?: GradingScaleItem[];
  modules_config?: SchoolModulesConfig;
}

export function getDefaultMatriculePrefix(schoolName: string): string {
  if (!schoolName || !schoolName.trim()) return 'SCH';
  const cleaned = schoolName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, ' ');

  const words = cleaned.split(/[\s-]+/).filter(Boolean);
  const stopWords = new Set(['DE', 'DU', 'DES', 'LE', 'LA', 'LES', 'D', 'L', 'ET', 'AU', 'AUX', 'EN', 'UN', 'UNE']);
  const meaningfulWords = words.filter(w => !stopWords.has(w));
  const candidateWords = meaningfulWords.length >= 2 ? meaningfulWords : words;

  if (candidateWords.length === 0) return 'SCH';
  if (candidateWords.length === 1) {
    const single = candidateWords[0];
    return single.length >= 3 ? single.slice(0, 4) : single.padEnd(3, 'X');
  }

  const acronym = candidateWords.map(w => w[0]).join('');
  if (acronym.length >= 3) {
    return acronym.slice(0, 4);
  }
  if (candidateWords.length === 2) {
    return (candidateWords[0].slice(0, 2) + candidateWords[1].slice(0, 2)).slice(0, 4);
  }
  return (acronym + 'SCH').slice(0, 3);
}

export const DEFAULT_PHONES: PhoneContact[] = [
  { id: 'ph-1', label: 'Standard / Direction', phone: '+226 70 20 30 40' },
  { id: 'ph-2', label: 'Secrétariat WhatsApp', phone: '+226 76 44 55 66' },
  { id: 'ph-3', label: 'Comptabilité & Caisse', phone: '+226 71 00 11 22' },
];

export const DEFAULT_GRADING_SCALE: GradingScaleItem[] = [
  { id: 'gr-1', minAverage: 18.0, maxAverage: 20.0, mention: 'Excellent', appreciation: 'Félicitations du Conseil de Classe', badgeColor: 'bg-emerald-100 text-emerald-800' },
  { id: 'gr-2', minAverage: 16.0, maxAverage: 17.99, mention: 'Très Bien', appreciation: 'Tableau d’Honneur avec Félicitations', badgeColor: 'bg-blue-100 text-blue-800' },
  { id: 'gr-3', minAverage: 14.0, maxAverage: 15.99, mention: 'Bien', appreciation: 'Tableau d’Honneur', badgeColor: 'bg-indigo-100 text-indigo-800' },
  { id: 'gr-4', minAverage: 12.0, maxAverage: 13.99, mention: 'Assez Bien', appreciation: 'Encouragements du Conseil', badgeColor: 'bg-teal-100 text-teal-800' },
  { id: 'gr-5', minAverage: 10.0, maxAverage: 11.99, mention: 'Passable', appreciation: 'Résultats moyens, peut mieux faire', badgeColor: 'bg-amber-100 text-amber-800' },
  { id: 'gr-6', minAverage: 8.0, maxAverage: 9.99, mention: 'Insuffisant', appreciation: 'Travail à intensifier au prochain trimestre', badgeColor: 'bg-orange-100 text-orange-800' },
  { id: 'gr-7', minAverage: 5.0, maxAverage: 7.99, mention: 'Faible', appreciation: 'Difficultés graves, soutien obligatoire', badgeColor: 'bg-rose-100 text-rose-800' },
  { id: 'gr-8', minAverage: 0.0, maxAverage: 4.99, mention: 'Médiocre', appreciation: 'Avertissement du Conseil pour manque de travail', badgeColor: 'bg-red-100 text-red-900' },
];

export const DEFAULT_SCHOOL: SchoolSettings = {
  id: '7c2d3108-2ac7-4ff5-a344-0803cedac026',
  name: 'Complexe Scolaire Wend-Manegda',
  code_menapln: 'MENAPLN-BF-0042',
  matricule_prefix: 'CSWM',
  approval_number: '2019-042/MENAPLN/SG/DREPS-C',
  city: 'Ouagadougou',
  address: 'Secteur 24, Somgandé, BP 1024 Ouagadougou 01',
  phone: '+226 70 20 30 40',
  phones: DEFAULT_PHONES,
  email: 'direction@wendmanegda.bf',
  motto: 'Discipline - Travail - Succès',
  director_name: 'M. ILBOUDO Marc',
  director_title: 'Le Chef d’Établissement / Proviseur',
  watermark_pattern: 'FASO_DAN_FANI',
  grading_scale: DEFAULT_GRADING_SCALE,
  modules_config: DEFAULT_MODULES_CONFIG,
};

// Récupère les paramètres de l'école (Supabase + localStorage)
export async function getSchoolSettings(): Promise<SchoolSettings> {
  let settings = { ...DEFAULT_SCHOOL };

  if (typeof window !== 'undefined') {
    try {
      const localSchool = localStorage.getItem('kalansso_school_config');
      if (localSchool) {
        const parsed = JSON.parse(localSchool);
        if (parsed.schoolName) settings.name = parsed.schoolName;
        if (parsed.city) settings.city = parsed.city;
        if (parsed.phone) settings.phone = parsed.phone;
        if (parsed.phones && Array.isArray(parsed.phones)) settings.phones = parsed.phones;
        if (parsed.motto) settings.motto = parsed.motto;
        if (parsed.codeMenapln) settings.code_menapln = parsed.codeMenapln;
        if (parsed.matriculePrefix) settings.matricule_prefix = parsed.matriculePrefix;
        if (parsed.approvalNumber) settings.approval_number = parsed.approvalNumber;
        if (parsed.directorName) settings.director_name = parsed.directorName;
        if (parsed.directorTitle) settings.director_title = parsed.directorTitle;
        if (parsed.address) settings.address = parsed.address;
        if (parsed.email) settings.email = parsed.email;
        if (parsed.watermarkPattern) settings.watermark_pattern = parsed.watermarkPattern;
        if (parsed.gradingScale && Array.isArray(parsed.gradingScale)) settings.grading_scale = parsed.gradingScale;
        if (parsed.modulesConfig) settings.modules_config = { ...DEFAULT_MODULES_CONFIG, ...parsed.modulesConfig };
      }

      const localLogo = localStorage.getItem('kalansso_school_logo');
      if (localLogo) {
        settings.logo_url = localLogo;
      }
    } catch {}
  }

  // Synchroniser avec Supabase
  try {
    const { data: schoolRow } = await supabase.from('schools').select('*').limit(1).single();
    if (schoolRow) {
      settings.id = schoolRow.id;
      settings.name = schoolRow.name || settings.name;
      settings.city = schoolRow.city || settings.city;
      settings.phone = schoolRow.phone || settings.phone;
      settings.motto = schoolRow.motto || settings.motto;
      settings.code_menapln = schoolRow.code_menapln || settings.code_menapln;
      if (schoolRow.matricule_prefix) {
        settings.matricule_prefix = schoolRow.matricule_prefix;
      }
    }
  } catch {}

  // Si aucun préfixe n'est spécifié, le déduire intelligemment du nom réel de l'école
  if (!settings.matricule_prefix) {
    settings.matricule_prefix = getDefaultMatriculePrefix(settings.name);
  }

  return settings;
}

// Enregistre les paramètres et notifie l'application
export async function saveSchoolSettings(updated: Partial<SchoolSettings>): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const existing = localStorage.getItem('kalansso_school_config');
      const parsed = existing ? JSON.parse(existing) : {};
      const merged = {
        ...parsed,
        schoolName: updated.name ?? parsed.schoolName,
        city: updated.city ?? parsed.city,
        phone: updated.phone ?? parsed.phone,
        phones: updated.phones ?? parsed.phones,
        motto: updated.motto ?? parsed.motto,
        codeMenapln: updated.code_menapln ?? parsed.codeMenapln,
        matriculePrefix: updated.matricule_prefix ?? parsed.matriculePrefix,
        approvalNumber: updated.approval_number ?? parsed.approvalNumber,
        directorName: updated.director_name ?? parsed.directorName,
        directorTitle: updated.director_title ?? parsed.directorTitle,
        address: updated.address ?? parsed.address,
        email: updated.email ?? parsed.email,
        watermarkPattern: updated.watermark_pattern ?? parsed.watermarkPattern,
        gradingScale: updated.grading_scale ?? parsed.gradingScale,
        modulesConfig: updated.modules_config ?? parsed.modulesConfig,
      };
      localStorage.setItem('kalansso_school_config', JSON.stringify(merged));

      if (updated.logo_url !== undefined) {
        if (updated.logo_url) {
          localStorage.setItem('kalansso_school_logo', updated.logo_url);
        } else {
          localStorage.removeItem('kalansso_school_logo');
        }
      }

      window.dispatchEvent(new Event('kalansso_school_updated'));
    } catch (e) {
      console.error('LocalStorage save error', e);
    }
  }

  // Sauvegarde dans Supabase si connecté
  try {
    const { data: schools } = await supabase.from('schools').select('id').limit(1);
    const schoolId = schools && schools[0] ? schools[0].id : null;

    if (schoolId) {
      const payload: any = {
        name: updated.name,
        city: updated.city,
        phone: updated.phone,
        motto: updated.motto,
        code_menapln: updated.code_menapln,
      };
      if (updated.matricule_prefix) {
        payload.matricule_prefix = updated.matricule_prefix;
      }
      await supabase.from('schools').update(payload).eq('id', schoolId);
    }
    return true;
  } catch (err) {
    console.error('Supabase school update error', err);
    return false;
  }
}
