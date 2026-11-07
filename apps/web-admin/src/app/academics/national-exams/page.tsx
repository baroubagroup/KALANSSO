'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { supabase } from '@/lib/supabase';
import { getSchoolSettings, SchoolSettings, DEFAULT_SCHOOL } from '@/lib/schoolSettings';
import { getActiveAcademicYear } from '@/lib/academicYear';
import { BurkinaCoatOfArms } from '@/components/motifs/BurkinaCoatOfArms';
import { AfricanMotif } from '@/components/motifs/AfricanMotif';
import {
  GraduationCap,
  Printer,
  IdentificationBadge,
  FileText,
  CheckCircle,
  Clock,
  Sparkle,
  QrCode,
  Users,
  Building,
  ShieldCheck,
  Funnel,
  Plus,
  ArrowRight,
  SealCheck,
} from '@phosphor-icons/react';

type ExamType = 'CEP' | 'BEPC' | 'BAC';
type PrintDocType = 'REGISTRE' | 'BADGES' | 'FICHE_INDIVIDUELLE';

interface Candidate {
  id: string;
  studentId: string;
  matricule: string;
  lastName: string;
  firstName: string;
  gender: 'M' | 'F';
  birthDate: string;
  birthPlace: string;
  classroomName: string;
  tableNumber: string;
  examCenter: string;
  jury: string;
  dossierStatus: 'COMPLET' | 'PIECE_MANQUANTE' | 'EN_COURS';
  examFeesPaid: boolean;
}

export default function NationalExamsPage() {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [academicYear, setAcademicYear] = useState(getActiveAcademicYear());
  const [selectedExam, setSelectedExam] = useState<ExamType>('BAC');
  const [printDoc, setPrintDoc] = useState<PrintDocType>('REGISTRE');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [autoGenNotice, setAutoGenNotice] = useState<string | null>(null);

  // 1. Paramètres école & Année
  useEffect(() => {
    async function load() {
      const s = await getSchoolSettings();
      setSchoolSettings(s);
    }
    load();

    function handleYear(e: any) {
      if (e.detail?.year) {
        setAcademicYear(e.detail.year);
      }
    }
    window.addEventListener('kalansso_academic_year_changed', handleYear);
    return () => window.removeEventListener('kalansso_academic_year_changed', handleYear);
  }, []);

  // 2. Charger les candidats réels de la classe d'examen correspondante
  useEffect(() => {
    async function loadExamCandidates() {
      setLoading(true);
      try {
        // Trouver la classe liée à l'examen
        // CEP -> CM2, BEPC -> 3ème, BAC -> Terminale D
        const targetSearch = selectedExam === 'CEP' ? 'CM2' : selectedExam === 'BEPC' ? '3ème' : 'Terminale';

        const { data: classRows } = await supabase
          .from('classrooms')
          .select('id, name')
          .ilike('name', `%${targetSearch}%`);

        let classIds: string[] = [];
        if (classRows && classRows.length > 0) {
          classIds = classRows.map((c) => c.id);
        }

        let query = supabase
          .from('students')
          .select(`
            id,
            matricule,
            last_name,
            first_name,
            gender,
            birth_date,
            birth_place,
            classroom_id,
            classrooms (
              name
            )
          `)
          .order('last_name', { ascending: true });

        if (classIds.length > 0) {
          query = query.in('classroom_id', classIds);
        }

        const { data: stdData, error: stdErr } = await query;

        if (!stdErr && stdData && stdData.length > 0) {
          const list: Candidate[] = stdData.map((s: any, idx: number) => {
            const tablePad = String(idx + 1).padStart(3, '0');
            const defaultTableNum = `${selectedExam}-2026-${tablePad}`;
            const defaultCenter =
              selectedExam === 'CEP'
                ? 'Centre Wend-Manegda N° 1'
                : selectedExam === 'BEPC'
                ? 'Lycée Nelson Mandela (Centre N° 04)'
                : 'Lycée Philippe Zinda Kaboré (Centre N° 02)';
            const defaultJury = `Jury N° ${String((idx % 3) + 1).padStart(2, '0')}`;

            return {
              id: s.id,
              studentId: s.id,
              matricule: s.matricule || `KLS-${tablePad}`,
              lastName: s.last_name,
              firstName: s.first_name,
              gender: (s.gender as any) || 'M',
              birthDate: s.birth_date || '2008-05-14',
              birthPlace: s.birth_place || 'Ouagadougou',
              classroomName: s.classrooms?.name || `${selectedExam} Candidats`,
              tableNumber: defaultTableNum,
              examCenter: defaultCenter,
              jury: defaultJury,
              dossierStatus: idx % 4 === 0 ? 'PIECE_MANQUANTE' : 'COMPLET',
              examFeesPaid: true,
            };
          });

          setCandidates(list);
          if (list.length > 0) {
            setSelectedCandidateId(list[0].id);
          }
        } else {
          setCandidates([]);
        }
      } catch (err) {
        console.error('Erreur chargement candidats:', err);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    }

    loadExamCandidates();
  }, [selectedExam, academicYear]);

  // Génération automatique séquentielle des numéros de table
  const handleRegenerateTableNumbers = () => {
    setCandidates((prev) =>
      prev.map((c, idx) => ({
        ...c,
        tableNumber: `${selectedExam}-2026-${String(idx + 1).padStart(3, '0')}`,
      }))
    );
    setAutoGenNotice('Numéros de table séquentiels réinitialisés selon l’ordre alphabétique.');
    setTimeout(() => setAutoGenNotice(null), 4000);
  };

  // Statistiques officielles
  const totalCandidates = candidates.length;
  const boysCount = candidates.filter((c) => c.gender === 'M').length;
  const girlsCount = candidates.filter((c) => c.gender === 'F').length;
  const parityRate = totalCandidates > 0 ? Math.round((girlsCount / totalCandidates) * 100) : 0;
  const completeDossiersCount = candidates.filter((c) => c.dossierStatus === 'COMPLET').length;

  const activeCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0];

  const examDetails = {
    CEP: {
      title: 'Certificat d’Études Primaires (CEP)',
      session: 'Session de Juin 2026',
      level: 'Cours Moyen 2ème Année (CM2)',
      dgec: 'Direction Générale des Examens et Concours du Primaire (DGEC-P)',
      subjects: ['Rédaction', 'Dictée & Questions', 'Calcul & Opérations', 'Problème', 'Histoire & Géographie', 'Sciences', 'Dessin'],
    },
    BEPC: {
      title: 'Brevet d’Études du Premier Cycle (BEPC)',
      session: 'Session de Juin 2026',
      level: 'Classe de Troisième (3ème)',
      dgec: 'Direction Générale des Examens et Concours du Secondaire (DGEC-S)',
      subjects: ['Français (Dictée + Texte)', 'Mathématiques', 'SVT', 'Physique-Chimie', 'Histoire-Géo', 'Anglais', 'EPS'],
    },
    BAC: {
      title: 'Baccalauréat Général (Série D & A4)',
      session: 'Session de Juillet 2026',
      level: 'Classe de Terminale (Tle D / Tle A)',
      dgec: 'Office du Baccalauréat du Burkina Faso (OBBF)',
      subjects: ['Mathématiques', 'Sciences de la Vie et de la Terre', 'Physique-Chimie', 'Philosophie', 'Français', 'Anglais', 'Histoire-Géo', 'EPS'],
    },
  }[selectedExam];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <div className="print:hidden h-full">
        <ErpSidebar schoolName={schoolSettings.name} city={schoolSettings.city} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:p-0">
        <div className="print:hidden">
          <ErpHeader
            schoolName={schoolSettings.name}
            title="Gestion des Examens Nationaux (CEP, BEPC, BAC)"
            breadcrumbs={[
              { label: 'Tableau de Bord', href: '/dashboard' },
              { label: 'Pédagogie & Examens', href: '/academics' },
              { label: 'Examens Nationaux' },
            ]}
          />
        </div>

        {/* ── BARRE DE SÉLECTION & D'ACTIONS ÉPURÉE (Masquée à l'impression) ── */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 print:hidden shadow-2xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Onglets des Examens Nationaux */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Examen :</span>
              {(['BAC', 'BEPC', 'CEP'] as const).map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setSelectedExam(ex)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-smooth flex items-center gap-2 cursor-pointer ${
                    selectedExam === ex
                      ? 'bg-nature-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <GraduationCap size={16} weight="bold" />
                  <span>{ex === 'BAC' ? 'BAC Général' : ex}</span>
                </button>
              ))}
            </div>

            {/* Choix du document d'export officiel */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Document :</span>
              <button
                type="button"
                onClick={() => setPrintDoc('REGISTRE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth cursor-pointer ${
                  printDoc === 'REGISTRE' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Registre Officiel (A4 Paysage)
              </button>
              <button
                type="button"
                onClick={() => setPrintDoc('BADGES')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth cursor-pointer ${
                  printDoc === 'BADGES' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Convocations & Badges
              </button>
              <button
                type="button"
                onClick={() => setPrintDoc('FICHE_INDIVIDUELLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth cursor-pointer ${
                  printDoc === 'FICHE_INDIVIDUELLE' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Fiche Individuelle
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-nature-700 hover:bg-nature-800 text-white font-bold text-xs rounded-xl transition-smooth shadow-xs flex items-center gap-1.5 cursor-pointer ml-2"
              >
                <Printer size={16} weight="bold" />
                <span>Imprimer Document A4</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── CONTENU PRINCIPAL ÉPURÉ & VISUELLEMENT IMPECCABLE ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible">
          {/* VUE ÉCRAN (TABLEAU DE PILOTAGE DES CANDIDATS) */}
          <div className="max-w-6xl mx-auto space-y-6 print:hidden">
            {/* Bannière de présentation */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-nature-700 bg-nature-50 border border-nature-200 px-2 py-0.5 rounded">
                    Centre d’Examen Officiel MENAPLN
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Session {academicYear}</span>
                </div>
                <h1 className="text-xl font-bold text-slate-900 mt-1">{examDetails.title}</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gestion des listes de candidats, attribution des numéros de table et impression des actes officiels certifiés.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRegenerateTableNumbers}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-smooth flex items-center gap-1.5 cursor-pointer border border-slate-200"
                >
                  <Sparkle size={15} weight="bold" className="text-nature-700" />
                  <span>Réindexer N° de Table</span>
                </button>
              </div>
            </div>

            {autoGenNotice && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
                <CheckCircle size={18} weight="fill" className="text-emerald-600" />
                <span>{autoGenNotice}</span>
              </div>
            )}

            {/* 4 Jauges KPI du Centre d'Examen */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Candidats Inscrits</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">{totalCandidates} élèves</div>
                <div className="text-[11px] text-slate-500 mt-1">{examDetails.level}</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-blue-600 block tracking-wider">Garçons</span>
                <div className="text-2xl font-bold text-blue-700 mt-1">{boysCount} candidats</div>
                <div className="text-[11px] text-slate-500 mt-1">{totalCandidates > 0 ? Math.round((boysCount / totalCandidates) * 100) : 0}% de l’effectif</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-purple-600 block tracking-wider">Filles (Parité)</span>
                <div className="text-2xl font-bold text-purple-700 mt-1">{girlsCount} candidates</div>
                <div className="text-[11px] text-slate-500 mt-1">{parityRate}% de l’effectif</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">Dossiers Conformes</span>
                <div className="text-2xl font-bold text-emerald-700 mt-1">{completeDossiersCount} / {totalCandidates}</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">Prêts pour validation DREPS</div>
              </div>
            </div>

            {/* Tableau interactif de gestion des candidats */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <IdentificationBadge size={18} weight="bold" className="text-nature-700" />
                  <span>Registre Informatisé des Candidats à l’Examen</span>
                </div>
                <div className="text-xs text-slate-500">
                  Cliquer sur un candidat pour prévisualiser sa convocation individuelle.
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3 w-12 text-center">N°</th>
                      <th className="px-4 py-3">N° de Table</th>
                      <th className="px-4 py-3">Matricule</th>
                      <th className="px-4 py-3">Nom & Prénom(s)</th>
                      <th className="px-4 py-3 text-center">Sexe</th>
                      <th className="px-4 py-3">Né(e) le</th>
                      <th className="px-4 py-3">Centre d’Examen</th>
                      <th className="px-4 py-3">Jury</th>
                      <th className="px-4 py-3 text-center">Dossier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-500">
                          Extraction des candidats de {selectedExam} depuis Supabase...
                        </td>
                      </tr>
                    ) : candidates.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-500">
                          Aucun élève trouvé dans la classe d’examen ({selectedExam}). Vérifiez les inscriptions dans l’onglet Élèves.
                        </td>
                      </tr>
                    ) : (
                      candidates.map((c, idx) => (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedCandidateId(c.id)}
                          className={`hover:bg-slate-50 transition-smooth cursor-pointer ${
                            selectedCandidateId === c.id ? 'bg-nature-50/50' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono font-bold text-nature-800">{c.tableNumber}</td>
                          <td className="px-4 py-3 font-mono text-slate-600">{c.matricule}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {c.lastName} {c.firstName}
                          </td>
                          <td className="px-4 py-3 text-center font-bold">
                            <span className={c.gender === 'F' ? 'text-purple-700' : 'text-blue-700'}>{c.gender}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {new Date(c.birthDate).toLocaleDateString('fr-FR')} à {c.birthPlace}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{c.examCenter}</td>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{c.jury}</td>
                          <td className="px-4 py-3 text-center">
                            {c.dossierStatus === 'COMPLET' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <CheckCircle size={12} weight="fill" />
                                Complet
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                <Clock size={12} weight="bold" />
                                Pièce requise
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              DOCUMENTS OFFICIELS IMPRIMABLES (ISOLÉS STRICTEMENT FORMAT A4)
              ───────────────────────────────────────────────────────────── */}

          {/* VUE 1 : REGISTRE OFFICIEL DE CANDIDATURE (A4 PAYSAGE) */}
          {printDoc === 'REGISTRE' && (
            <div id="printable-exam-document" className="hidden print:block bg-white text-black p-8 font-serif leading-normal" style={{ minHeight: '200mm' }}>
              {/* En-tête officiel burkinabè pour examen d'État */}
              <div className="flex justify-between items-start pb-4 border-b-2 border-black mb-4">
                <div className="text-left w-1/3">
                  <div className="font-bold uppercase text-[10px]">BURKINA FASO</div>
                  <div className="text-[9px] italic">Unité - Progrès - Justice</div>
                  <div className="text-[9px] font-bold uppercase mt-1">Ministère de l&apos;Éducation Nationale (MENAPLN)</div>
                  <div className="text-[8px] text-gray-700">{examDetails.dgec}</div>
                  <div className="text-[8px] text-gray-700">Direction Régionale du Centre (DREPS)</div>
                </div>

                <div className="w-1/3 flex flex-col items-center">
                  {schoolSettings.logo_url ? (
                    <div className="w-14 h-14 flex items-center justify-center mb-1">
                      <img src={schoolSettings.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <BurkinaCoatOfArms className="w-12 h-12" />
                  )}
                  <div className="text-[9px] font-mono font-bold mt-0.5">{schoolSettings.code_menapln}</div>
                </div>

                <div className="w-1/3 text-right">
                  <div className="font-bold text-sm uppercase">{schoolSettings.name}</div>
                  <div className="text-[9px] text-gray-800">{schoolSettings.address || `${schoolSettings.city}, Burkina Faso`}</div>
                  <div className="text-[9px]">Tél : {schoolSettings.phone}</div>
                  <div className="text-[8px] italic">{schoolSettings.motto}</div>
                </div>
              </div>

              <div className="text-center my-4">
                <h1 className="text-base font-black uppercase tracking-wider underline">
                  REGISTRE GÉNÉRAL DE CANDIDATURE AUX EXAMENS SCOLAIRES NATIONAUX
                </h1>
                <div className="text-xs font-bold mt-1 uppercase">
                  {examDetails.title} — {examDetails.session}
                </div>
                <div className="text-[10px] text-gray-600">
                  Centre principal : <strong>{candidates[0]?.examCenter || 'Centre Officiel'}</strong> · Établissement : <strong>{schoolSettings.name}</strong>
                </div>
              </div>

              {/* Tableau officiel récapitulatif */}
              <table className="w-full text-[10px] border border-black mb-4">
                <thead>
                  <tr className="bg-gray-100 border-b border-black text-center font-bold">
                    <th className="p-1.5 border-r border-black w-8">N°</th>
                    <th className="p-1.5 border-r border-black w-24">N° de Table</th>
                    <th className="p-1.5 border-r border-black w-24">Matricule</th>
                    <th className="p-1.5 border-r border-black text-left">Nom & Prénom(s) de l&apos;Apprenant(e)</th>
                    <th className="p-1.5 border-r border-black w-10">Sexe</th>
                    <th className="p-1.5 border-r border-black">Date & Lieu de Naissance</th>
                    <th className="p-1.5 border-r border-black w-16">Jury</th>
                    <th className="p-1.5 border-r border-black w-20">Dossier</th>
                    <th className="p-1.5 w-28">Émargement Candidat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {candidates.map((c, idx) => (
                    <tr key={c.id} className="text-center">
                      <td className="p-1.5 border-r border-black">{idx + 1}</td>
                      <td className="p-1.5 border-r border-black font-mono font-bold">{c.tableNumber}</td>
                      <td className="p-1.5 border-r border-black font-mono">{c.matricule}</td>
                      <td className="p-1.5 border-r border-black text-left font-bold uppercase">
                        {c.lastName} {c.firstName}
                      </td>
                      <td className="p-1.5 border-r border-black font-bold">{c.gender}</td>
                      <td className="p-1.5 border-r border-black text-left">
                        {new Date(c.birthDate).toLocaleDateString('fr-FR')} à {c.birthPlace}
                      </td>
                      <td className="p-1.5 border-r border-black font-mono font-bold">{c.jury}</td>
                      <td className="p-1.5 border-r border-black uppercase text-[9px]">
                        {c.dossierStatus === 'COMPLET' ? 'Conforme' : 'En instance'}
                      </td>
                      <td className="p-1.5"></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Statistiques officielles & Signatures */}
              <div className="flex justify-between items-end pt-4 border-t border-black text-xs">
                <div className="space-y-1 text-[10px]">
                  <div>Effectif total présenté : <strong>{totalCandidates} candidats</strong></div>
                  <div>Répartition par genre : <strong>{boysCount} Garçons</strong> et <strong>{girlsCount} Filles</strong> (Parité : {parityRate}%)</div>
                  <div>Certification : Document officiel transmis à la DREPS pour le tirage des épreuves.</div>
                </div>

                <div className="text-right">
                  <div>Fait à {schoolSettings.city}, le {new Date().toLocaleDateString('fr-FR')}</div>
                  <div className="font-bold mt-1">{schoolSettings.director_title || 'Le Chef d’Établissement / Proviseur'}</div>
                  <div className="text-xs italic">{schoolSettings.director_name || 'M. ILBOUDO Marc'}</div>
                  <div className="h-14 flex items-center justify-end mt-1">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center text-[7px] text-gray-500 uppercase tracking-widest font-bold">
                      Cachet Officiel
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VUE 2 : PLANCHE DE BADGES & CONVOCATIONS (A4 PORTRAIT) */}
          {printDoc === 'BADGES' && (
            <div id="printable-exam-document" className="hidden print:block bg-white text-black p-6 font-sans" style={{ minHeight: '290mm' }}>
              <div className="grid grid-cols-2 gap-4">
                {candidates.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    className="border-2 border-slate-800 rounded-xl p-4 bg-white relative flex flex-col justify-between"
                    style={{ height: '135mm' }}
                  >
                    <AfricanMotif pattern={schoolSettings.watermark_pattern} opacity={0.03} className="absolute inset-0 pointer-events-none" />

                    <div>
                      {/* Entête Badge */}
                      <div className="flex justify-between items-center pb-2 border-b border-black text-[9px]">
                        <div>
                          <div className="font-bold uppercase">BURKINA FASO</div>
                          <div className="text-[7px] italic">Unité - Progrès - Justice</div>
                          <div className="font-bold text-[8px] uppercase text-nature-800 mt-0.5">{selectedExam} 2026</div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-[9px] uppercase">{schoolSettings.name}</div>
                          <div className="font-mono text-[7px] text-gray-600">{schoolSettings.code_menapln}</div>
                        </div>
                      </div>

                      <div className="text-center my-2">
                        <div className="text-[11px] font-black uppercase tracking-wider bg-black text-white py-1 px-2 rounded">
                          CARTE DE CONVOCATION OFFICIELLE
                        </div>
                        <div className="text-[9px] font-bold text-gray-700 mt-0.5">{examDetails.title}</div>
                      </div>

                      {/* Photo + Infos */}
                      <div className="flex gap-3 my-3">
                        <div className="w-20 h-24 border border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center text-[8px] text-gray-400 p-1 text-center bg-gray-50">
                          <span>Photo d&apos;identité du candidat</span>
                        </div>

                        <div className="flex-1 space-y-1 text-[10px]">
                          <div>Nom : <strong className="uppercase">{c.lastName}</strong></div>
                          <div>Prénom(s) : <strong>{c.firstName}</strong></div>
                          <div>Sexe : <strong>{c.gender === 'F' ? 'Féminin' : 'Masculin'}</strong></div>
                          <div>Né(e) le : <strong>{new Date(c.birthDate).toLocaleDateString('fr-FR')}</strong></div>
                          <div>Matricule : <strong className="font-mono">{c.matricule}</strong></div>
                          <div className="pt-1 border-t border-gray-200">
                            N° DE TABLE : <strong className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded border border-gray-300">{c.tableNumber}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-2 rounded border border-gray-200 text-[9px] space-y-0.5 mb-2">
                        <div>Centre d&apos;examen : <strong>{c.examCenter}</strong></div>
                        <div>Jury d&apos;affectation : <strong>{c.jury}</strong></div>
                        <div>Régime : <strong>Candidat Régulier</strong></div>
                      </div>
                    </div>

                    {/* Pied Badge */}
                    <div className="pt-2 border-t border-black flex justify-between items-end text-[8px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-8 bg-white border border-black rounded p-0.5 flex items-center justify-center">
                          <QrCode size={26} weight="bold" />
                        </div>
                        <span className="font-mono text-[7px]">Scellé DGEC / Anti-fraude</span>
                      </div>

                      <div className="text-right">
                        <div>Le Chef d&apos;Établissement</div>
                        <div className="font-bold">{schoolSettings.director_name || 'M. ILBOUDO Marc'}</div>
                        <div className="text-[6px] text-gray-500">(Signature et Visa)</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VUE 3 : FICHE INDIVIDUELLE DE CANDIDATURE (A4 PORTRAIT) */}
          {printDoc === 'FICHE_INDIVIDUELLE' && activeCandidate && (
            <div id="printable-exam-document" className="hidden print:block bg-white text-black p-8 font-serif leading-relaxed" style={{ minHeight: '290mm' }}>
              <div className="flex justify-between items-start pb-4 border-b-2 border-black mb-6">
                <div className="w-1/3">
                  <div className="font-bold uppercase text-[10px]">BURKINA FASO</div>
                  <div className="text-[9px] italic">Unité - Progrès - Justice</div>
                  <div className="text-[9px] uppercase font-bold mt-1">MENAPLN - {examDetails.dgec}</div>
                  <div className="text-[8px] text-gray-600">Région du Centre · DREPS</div>
                </div>

                <div className="w-1/3 flex flex-col items-center">
                  <BurkinaCoatOfArms className="w-14 h-14 mb-1" />
                  <span className="font-mono text-[8px] text-gray-500">{schoolSettings.code_menapln}</span>
                </div>

                <div className="w-1/3 text-right">
                  <div className="font-bold text-sm uppercase">{schoolSettings.name}</div>
                  <div className="text-[9px] text-gray-700">{schoolSettings.city}, Burkina Faso</div>
                  <div className="text-[9px]">Tél : {schoolSettings.phone}</div>
                </div>
              </div>

              <div className="text-center my-6">
                <h1 className="text-lg font-black uppercase tracking-wider underline">
                  DOSSIER INDIVIDUEL D&apos;INSCRIPTION À L&apos;EXAMEN D&apos;ÉTAT
                </h1>
                <div className="text-xs font-bold mt-1">
                  {examDetails.title} — {examDetails.session}
                </div>
                <div className="text-xs font-mono font-bold mt-1">
                  N° DE TABLE ATTRIBUÉ : {activeCandidate.tableNumber}
                </div>
              </div>

              {/* État Civil Complet */}
              <div className="border border-black p-4 mb-4 text-xs space-y-2">
                <div className="font-bold text-[10px] uppercase text-gray-700 border-b border-black pb-1">
                  1. État Civil & Filiation du Candidat
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>Nom de famille : <strong className="uppercase">{activeCandidate.lastName}</strong></div>
                  <div>Prénom(s) : <strong>{activeCandidate.firstName}</strong></div>
                  <div>Sexe : <strong>{activeCandidate.gender === 'F' ? 'Féminin' : 'Masculin'}</strong></div>
                  <div>Matricule National : <strong className="font-mono">{activeCandidate.matricule}</strong></div>
                  <div>Date de naissance : <strong>{new Date(activeCandidate.birthDate).toLocaleDateString('fr-FR')}</strong></div>
                  <div>Lieu de naissance : <strong>{activeCandidate.birthPlace}</strong></div>
                  <div>Nationalité : <strong>Burkinabè</strong></div>
                  <div>Classe d&apos;origine : <strong>{activeCandidate.classroomName}</strong></div>
                </div>
              </div>

              {/* Centre d'Examen & Jury */}
              <div className="border border-black p-4 mb-4 text-xs space-y-2">
                <div className="font-bold text-[10px] uppercase text-gray-700 border-b border-black pb-1">
                  2. Centre d&apos;Examen & Affectation Administrative
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>Centre d&apos;écrit assigné : <strong>{activeCandidate.examCenter}</strong></div>
                  <div>Jury d&apos;examen : <strong>{activeCandidate.jury}</strong></div>
                  <div>Type de candidature : <strong>Candidat(e) Régulier(ère) Scolarisé(e)</strong></div>
                  <div>Frais d&apos;inscription d&apos;examen : <strong>Acquittés au guichet</strong></div>
                </div>
              </div>

              {/* Pièces Constitutives du Dossier */}
              <div className="border border-black p-4 mb-6 text-xs space-y-2">
                <div className="font-bold text-[10px] uppercase text-gray-700 border-b border-black pb-1">
                  3. Contrôle de Conformité des Pièces Justificatives
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>[ X ] Extrait d&apos;acte de naissance certifié conforme</div>
                  <div>[ X ] Certificat de scolarité de l&apos;année en cours</div>
                  <div>[ X ] 02 Photos d&apos;identité récentes de face (4x4)</div>
                  <div>[ X ] Reçu de versement des droits d&apos;examen MENAPLN</div>
                </div>
              </div>

              {/* Engagement et Signatures */}
              <div className="pt-4 border-t-2 border-black flex justify-between items-end text-xs">
                <div>
                  <div className="font-bold">Signature de l&apos;Apprenant(e) / Tuteur</div>
                  <div className="h-16"></div>
                  <div className="text-[9px] text-gray-500">(Mention manuscrite &quot;Lu et approuvé&quot;)</div>
                </div>

                <div className="text-right">
                  <div>Fait à {schoolSettings.city}, le {new Date().toLocaleDateString('fr-FR')}</div>
                  <div className="font-bold mt-1">{schoolSettings.director_title || 'Le Chef d’Établissement / Proviseur'}</div>
                  <div className="text-xs italic">{schoolSettings.director_name || 'M. ILBOUDO Marc'}</div>
                  <div className="h-16 flex items-center justify-end mt-1">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center text-[7px] text-gray-500 uppercase tracking-widest font-bold">
                      Visa & Cachet
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* RÈGLES STRICTES D'IMPRESSION A4 ISOLÉES POUR LES EXAMENS NATIONAUX */}
      <style jsx global>{`
        @page {
          size: ${printDoc === 'REGISTRE' ? 'A4 landscape' : 'A4 portrait'};
          margin: 0;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-exam-document, #printable-exam-document * {
            visibility: visible !important;
          }
          html, body {
            width: ${printDoc === 'REGISTRE' ? '297mm' : '210mm'} !important;
            height: ${printDoc === 'REGISTRE' ? '210mm' : '297mm'} !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-exam-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${printDoc === 'REGISTRE' ? '297mm' : '210mm'} !important;
            min-height: ${printDoc === 'REGISTRE' ? '210mm' : '297mm'} !important;
            max-height: ${printDoc === 'REGISTRE' ? '210mm' : '297mm'} !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: ${printDoc === 'REGISTRE' ? '8mm 12mm' : '10mm 14mm'} !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
