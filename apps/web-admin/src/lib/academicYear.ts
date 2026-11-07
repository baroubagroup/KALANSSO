'use client';

export const ACADEMIC_YEARS = [
  { value: '2027-2028', label: '2027 – 2028 (Nouvelle Année)' },
  { value: '2026-2027', label: '2026 – 2027 (Année Active)' },
  { value: '2025-2026', label: '2025 – 2026 (Année Antérieure)' },
  { value: '2024-2025', label: '2024 – 2025 (Archive)' },
];

export const DEFAULT_ACADEMIC_YEAR = '2026-2027';

export function getActiveAcademicYear(): string {
  if (typeof window === 'undefined') return DEFAULT_ACADEMIC_YEAR;
  try {
    return localStorage.getItem('kalansso_academic_year') || DEFAULT_ACADEMIC_YEAR;
  } catch {
    return DEFAULT_ACADEMIC_YEAR;
  }
}

export function setActiveAcademicYear(year: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('kalansso_academic_year', year);
    window.dispatchEvent(new CustomEvent('kalansso_academic_year_changed', { detail: { year } }));
  } catch (e) {
    console.error('Failed to set academic year', e);
  }
}
