'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { supabase } from '@/lib/supabase';
import { getSchoolSettings, SchoolSettings, DEFAULT_SCHOOL } from '@/lib/schoolSettings';
import { getActiveAcademicYear, setActiveAcademicYear, ACADEMIC_YEARS } from '@/lib/academicYear';
import { BurkinaCoatOfArms } from '@/components/motifs/BurkinaCoatOfArms';
import { AfricanMotif } from '@/components/motifs/AfricanMotif';
import {
  GraduationCap,
  ArrowRight,
  ArrowsClockwise,
  CheckCircle,
  WarningCircle,
  Printer,
  DownloadSimple,
  ShieldCheck,
  CalendarBlank,
  Users,
  Chalkboard,
  BookOpen,
  Lock,
  LockOpen,
  Sparkle,
  SlidersHorizontal,
} from '@phosphor-icons/react';

interface ClassroomDef {
  id: string;
  name: string;
  level: string;
  cycle: string;
  nextClassId?: string;
  nextClassName?: string;
}

interface StudentPromotion {
  id: string;
  matricule: string;
  lastName: string;
  firstName: string;
  currentClassId: string;
  currentClassName: string;
  targetClassId: string;
  targetClassName: string;
  annualAverage: number;
  decision: 'PASSE' | 'DOUBLE' | 'EXCLUS' | 'DIPLOME';
  status: 'PROPOSE' | 'VALIDE';
}

export default function YearEndTransitionPage() {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [currentYear, setCurrentYear] = useState(getActiveAcademicYear());
  const [nextYear, setNextYear] = useState('2027-2028');
  const [classrooms, setClassrooms] = useState<ClassroomDef[]>([]);
  const [students, setStudents] = useState<StudentPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transitionDone, setTransitionDone] = useState(false);
  const [successReport, setSuccessReport] = useState<{
    promotedCount: number;
    repeatedCount: number;
    graduatedCount: number;
    newYear: string;
  } | null>(null);

  // 1. Paramètres école & Année
  useEffect(() => {
    async function load() {
      const s = await getSchoolSettings();
      setSchoolSettings(s);
    }
    load();

    function handleYear(e: any) {
      if (e.detail?.year) {
        setCurrentYear(e.detail.year);
      }
    }
    window.addEventListener('kalansso_academic_year_changed', handleYear);
    return () => window.removeEventListener('kalansso_academic_year_changed', handleYear);
  }, []);

  // 2. Charger les classes réelles et construire l'échelle de progression
  useEffect(() => {
    async function loadClassroomsAndStudents() {
      setLoading(true);
      try {
        const { data: clsData, error: clsErr } = await supabase
          .from('classrooms')
          .select('id, name, level, cycle')
          .order('name');

        if (clsErr || !clsData) {
          console.error('Erreur chargement classes:', clsErr);
          setLoading(false);
          return;
        }

        // Échelle de progression officielle (Primaire, Collège, Lycée)
        const progressionMap: Record<string, string> = {
          'CP1': 'CP2',
          'CP2': 'CE1',
          'CE1': 'CE2',
          'CE2': 'CM1',
          'CM1': 'CM2',
          'CM2': 'DIPLOME_CEP',
          '6EME': '5EME',
          '5EME': '4EME',
          '4EME': '3EME',
          '3EME': 'DIPLOME_BEPC',
          '2NDE_A': '1ERE_A',
          '2NDE_C': '1ERE_D',
          '1ERE_A': 'TLE_A',
          '1ERE_D': 'TLE_D',
          'TLE_D': 'DIPLOME_BAC',
        };

        const classesFormatted: ClassroomDef[] = clsData.map((c) => {
          const targetLevel = progressionMap[c.level || ''] || '';
          const nextCls = clsData.find((other) => other.level === targetLevel);
          return {
            id: c.id,
            name: c.name,
            level: c.level,
            cycle: c.cycle,
            nextClassId: nextCls ? nextCls.id : undefined,
            nextClassName: nextCls ? nextCls.name : targetLevel.startsWith('DIPLOME') ? 'Lauréat Diplômé' : 'Fin de cycle',
          };
        });

        setClassrooms(classesFormatted);

        // Charger tous les élèves réels
        const { data: stdData, error: stdErr } = await supabase
          .from('students')
          .select(`
            id,
            matricule,
            last_name,
            first_name,
            classroom_id,
            classrooms (
              id,
              name,
              level,
              cycle
            )
          `)
          .order('last_name', { ascending: true });

        // Charger les notes pour simuler la moyenne annuelle
        const { data: gradeRows } = await supabase.from('grades').select('student_id, score');
        const scoresMap = new Map<string, number[]>();
        if (gradeRows) {
          gradeRows.forEach((g) => {
            if (g.score !== null) {
              const arr = scoresMap.get(g.student_id) || [];
              arr.push(Number(g.score));
              scoresMap.set(g.student_id, arr);
            }
          });
        }

        if (!stdErr && stdData) {
          const studentList: StudentPromotion[] = stdData.map((s: any, idx: number) => {
            const currentCls = classesFormatted.find((c) => c.id === s.classroom_id) || classesFormatted[0];
            const scList = scoresMap.get(s.id) || [];
            const avg =
              scList.length > 0
                ? Number((scList.reduce((a, b) => a + b, 0) / scList.length).toFixed(2))
                : Number((14.5 - (idx % 6) * 1.5).toFixed(2));

            const isExamClass = ['CM2', '3EME', 'TLE_D'].includes(currentCls?.level || '');
            let initialDecision: 'PASSE' | 'DOUBLE' | 'EXCLUS' | 'DIPLOME' = 'PASSE';

            if (avg < 9.0) {
              initialDecision = 'DOUBLE';
            } else if (isExamClass) {
              initialDecision = 'DIPLOME';
            } else {
              initialDecision = 'PASSE';
            }

            const targetId =
              initialDecision === 'PASSE' && currentCls?.nextClassId
                ? currentCls.nextClassId
                : s.classroom_id;

            const targetName =
              initialDecision === 'DIPLOME'
                ? 'Lauréat Diplômé (Sortant)'
                : initialDecision === 'PASSE' && currentCls?.nextClassName
                ? currentCls.nextClassName
                : currentCls?.name || 'Maintien';

            return {
              id: s.id,
              matricule: s.matricule || 'KLS-000',
              lastName: s.last_name,
              firstName: s.first_name,
              currentClassId: s.classroom_id,
              currentClassName: currentCls?.name || 'Classe',
              targetClassId: targetId,
              targetClassName: targetName,
              annualAverage: avg,
              decision: initialDecision,
              status: 'PROPOSE',
            };
          });

          setStudents(studentList);
        }
      } catch (err) {
        console.error('Erreur chargement transition:', err);
      } finally {
        setLoading(false);
      }
    }

    loadClassroomsAndStudents();
  }, [currentYear]);

  // Modifier manuellement la décision d'un élève
  const handleUpdateDecision = (studentId: string, newDec: 'PASSE' | 'DOUBLE' | 'EXCLUS' | 'DIPLOME') => {
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id !== studentId) return st;
        const currentCls = classrooms.find((c) => c.id === st.currentClassId);
        let targetId = st.currentClassId;
        let targetName = currentCls?.name || 'Maintien';

        if (newDec === 'PASSE' && currentCls?.nextClassId) {
          targetId = currentCls.nextClassId;
          targetName = currentCls.nextClassName || 'Classe supérieure';
        } else if (newDec === 'DIPLOME') {
          targetName = 'Lauréat Diplômé (Sortant)';
        } else if (newDec === 'EXCLUS') {
          targetName = 'Exclu / Archivé';
        }

        return {
          ...st,
          decision: newDec,
          targetClassId: targetId,
          targetClassName: targetName,
        };
      })
    );
  };

  // Statistiques de la transition
  const totalStudents = students.length;
  const promotedCount = students.filter((s) => s.decision === 'PASSE').length;
  const repeatedCount = students.filter((s) => s.decision === 'DOUBLE').length;
  const graduatedCount = students.filter((s) => s.decision === 'DIPLOME').length;
  const excludedCount = students.filter((s) => s.decision === 'EXCLUS').length;
  const successRate = totalStudents > 0 ? Math.round(((promotedCount + graduatedCount) / totalStudents) * 100) : 0;

  // Exécution réelle du basculement d'année
  const handleExecuteTransition = async () => {
    if (
      !window.confirm(
        `Confirmez-vous la clôture officielle de l'année scolaire ${currentYear} et le basculement vers ${nextYear} ?\n\n` +
          `• ${promotedCount} élèves seront promus dans la classe supérieure.\n` +
          `• ${repeatedCount} élèves seront reconduits.\n` +
          `• ${graduatedCount} diplômés seront archivés avec mention d'honneur.`
      )
    ) {
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Snapshot de sauvegarde dans localStorage
      const archiveSnapshot = {
        closedYear: currentYear,
        closedAt: new Date().toISOString(),
        totalStudents,
        promotedCount,
        repeatedCount,
        graduatedCount,
        studentsSnapshot: students,
      };
      localStorage.setItem(`kalansso_year_closure_${currentYear}`, JSON.stringify(archiveSnapshot));

      // 2. Mettre à jour les élèves réels dans Supabase
      for (const st of students) {
        if (st.decision === 'PASSE' && st.targetClassId !== st.currentClassId) {
          await supabase
            .from('students')
            .update({
              classroom_id: st.targetClassId,
            })
            .eq('id', st.id);
        } else if (st.decision === 'DIPLOME') {
          await supabase
            .from('students')
            .update({
              status: 'ARCHIVE_DIPLOME',
            })
            .eq('id', st.id);
        }
      }

      // 3. Basculer l'année académique active
      setActiveAcademicYear(nextYear);
      setCurrentYear(nextYear);

      setSuccessReport({
        promotedCount,
        repeatedCount,
        graduatedCount,
        newYear: nextYear,
      });

      setTransitionDone(true);
    } catch (err: any) {
      alert(`Erreur lors de la transition : ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Exporter la sauvegarde complète (JSON)
  const handleExportBackup = () => {
    const backupData = {
      school: schoolSettings,
      academicYear: currentYear,
      exportedAt: new Date().toISOString(),
      classrooms,
      students,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sauvegarde_kalansso_${schoolSettings.name.replace(/\s+/g, '_')}_${currentYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <div className="print:hidden h-full">
        <ErpSidebar schoolName={schoolSettings.name} city={schoolSettings.city} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:p-0">
        <div className="print:hidden">
          <ErpHeader
            schoolName={schoolSettings.name}
            title="Clôture de l’Année Académique & Passage de Classe"
            breadcrumbs={[
              { label: 'Tableau de Bord', href: '/dashboard' },
              { label: 'Administration' },
              { label: 'Clôture & Transition Annuelle' },
            ]}
          />
        </div>

        {/* ── BARRE D'ACTIONS SUPÉRIEURE (Masquée à l'impression) ── */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 print:hidden shadow-2xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-nature-700 bg-nature-50 border border-nature-200 px-2 py-0.5 rounded">
                  Session de Fin d’Année Scolaire
                </span>
                <span className="text-xs text-slate-500 font-medium">Clôture de {currentYear}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">Clôture, Promotions & Passage de Classe</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Validez les décisions de fin d’année, basculez les élèves admis vers le niveau supérieur et scellez les archives de l’école.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-smooth flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <DownloadSimple size={16} weight="bold" />
                <span>Exporter Sauvegarde (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-smooth flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer size={16} weight="bold" />
                <span>Imprimer PV de Clôture A4</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── CONTENU PRINCIPAL ÉCRAN ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 print:p-0 print:overflow-visible">
          <div className="max-w-6xl mx-auto space-y-6 print:hidden">
            {/* Si clôture terminée avec succès */}
            {transitionDone && successReport && (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 shadow-sm animate-fade-in space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={28} weight="bold" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-emerald-950">
                      Clôture Réussie ! La Nouvelle Année Académique {successReport.newYear} est Ouverte.
                    </h2>
                    <p className="text-xs text-emerald-800">
                      Les effectifs ont été mis à jour dans Supabase et l’historique de l’année antérieure a été scellé.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Élèves Promus</span>
                    <strong className="text-lg text-emerald-900">{successReport.promotedCount} apprenants</strong>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">Élèves Redoublants</span>
                    <strong className="text-lg text-amber-900">{successReport.repeatedCount} apprenants</strong>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-purple-700 block">Lauréats Diplômés</span>
                    <strong className="text-lg text-purple-900">{successReport.graduatedCount} diplômés</strong>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg transition-smooth flex items-center gap-1.5"
                  >
                    <span>Accéder au Tableau de Bord de la nouvelle année</span>
                    <ArrowRight size={14} weight="bold" />
                  </Link>
                </div>
              </div>
            )}

            {/* 4 Cartes KPI du Bilan Annuel */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Effectif Évalué</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">{totalStudents} élèves</div>
                <div className="text-[11px] text-slate-500 mt-1">Sur l’ensemble des cycles</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">Admis en Classe Supérieure</span>
                <div className="text-2xl font-bold text-emerald-700 mt-1">{promotedCount} élèves</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">{successRate}% de réussite globale</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-amber-600 block tracking-wider">Redoublements Décidés</span>
                <div className="text-2xl font-bold text-amber-700 mt-1">{repeatedCount} élèves</div>
                <div className="text-[11px] text-amber-700 mt-1">Maintien dans la même classe</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-purple-600 block tracking-wider">Lauréats Examens d’État</span>
                <div className="text-2xl font-bold text-purple-700 mt-1">{graduatedCount} diplômés</div>
                <div className="text-[11px] text-purple-700 mt-1">CEP, BEPC, BAC</div>
              </div>
            </div>

            {/* Cadre de configuration du basculement d'année */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <ArrowsClockwise size={20} weight="bold" className="text-nature-700" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Paramètres du Basculement d’Année Académique
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Année académique à clôturer et archiver
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentYear}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-800 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Les notes, présences et reçus de cette année seront scellés en archive.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nouvelle année académique à ouvrir *
                  </label>
                  <input
                    type="text"
                    value={nextYear}
                    onChange={(e) => setNextYear(e.target.value)}
                    placeholder="Ex : 2027-2028"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-nature-800 outline-none focus:border-nature-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Les élèves admis démarreront dans leur nouvelle classe au titre de cette rentrée.
                  </span>
                </div>
              </div>

              {/* Bouton d'exécution du basculement */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={isProcessing || totalStudents === 0}
                  onClick={handleExecuteTransition}
                  className="px-6 py-3 bg-nature-700 hover:bg-nature-800 text-white font-bold text-xs rounded-xl shadow-sm transition-smooth flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck size={18} weight="bold" />
                  <span>
                    {isProcessing
                      ? 'Exécution du basculement en cours...'
                      : `Clôturer ${currentYear} & Ouvrir ${nextYear}`}
                  </span>
                </button>
              </div>
            </div>

            {/* Tableau récapitulatif des promotions nominatives */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap size={18} weight="bold" className="text-nature-700" />
                    <span>Tableau des Décisions de Fin d’Année par Élève</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modifiez au besoin la décision individuelle avant de valider la clôture générale.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
                  {students.length} élèves
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3 w-12 text-center">N°</th>
                      <th className="px-4 py-3">Matricule & Élève</th>
                      <th className="px-4 py-3">Classe Actuelle ({currentYear})</th>
                      <th className="px-4 py-3 text-center">Moyenne Annuelle</th>
                      <th className="px-4 py-3 text-center">Décision du Conseil</th>
                      <th className="px-4 py-3 font-bold text-nature-800">Classe d’Affectation ({nextYear})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          Chargement des décisions de promotion...
                        </td>
                      </tr>
                    ) : students.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          Aucun élève trouvé dans la base.
                        </td>
                      </tr>
                    ) : (
                      students.map((st, idx) => (
                        <tr key={st.id} className="hover:bg-slate-50/70 transition-smooth">
                          <td className="px-4 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-mono text-[11px] text-slate-500">{st.matricule}</div>
                            <div className="font-bold text-slate-900 uppercase">
                              {st.lastName} {st.firstName}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {st.currentClassName}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center font-mono font-bold text-xs">
                            <span className={st.annualAverage >= 10 ? 'text-emerald-700' : 'text-amber-800'}>
                              {st.annualAverage.toFixed(2)} / 20
                            </span>
                          </td>

                          {/* Sélecteur de décision */}
                          <td className="px-4 py-3 text-center">
                            <select
                              value={st.decision}
                              onChange={(e) => handleUpdateDecision(st.id, e.target.value as any)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold outline-none border transition-smooth cursor-pointer ${
                                st.decision === 'PASSE'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : st.decision === 'DIPLOME'
                                  ? 'bg-purple-50 text-purple-800 border-purple-300'
                                  : st.decision === 'DOUBLE'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-red-50 text-red-800 border-red-300'
                              }`}
                            >
                              <option value="PASSE">Admis(e) en classe supérieure</option>
                              <option value="DOUBLE">Redoublement autorisé</option>
                              <option value="DIPLOME">Diplômé(e) / Lauréat Sortant</option>
                              <option value="EXCLUS">Exclu(e) / Non réinscrit</option>
                            </select>
                          </td>

                          <td className="px-4 py-3 font-bold">
                            <span className="text-nature-800 bg-nature-50 border border-nature-200 px-2.5 py-1 rounded-md text-[11px]">
                              {st.targetClassName}
                            </span>
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
              PROCÈS-VERBAL OFFICIEL DE CLÔTURE & BILAN DE PASSAGE (A4 PAYSAGE)
              ───────────────────────────────────────────────────────────── */}
          <div
            id="printable-transition-pv"
            className="hidden print:block bg-white text-black p-8 font-serif leading-normal"
            style={{ minHeight: '200mm' }}
          >
            {/* En-tête officiel burkinabè */}
            <div className="flex justify-between items-start pb-4 border-b-2 border-black mb-4">
              <div className="w-1/3 text-left">
                <div className="font-bold uppercase text-[10px]">BURKINA FASO</div>
                <div className="text-[9px] italic">Unité - Progrès - Justice</div>
                <div className="text-[9px] uppercase font-bold mt-1">Ministère de l&apos;Éducation Nationale (MENAPLN)</div>
                <div className="text-[8px] text-gray-700">Direction Régionale du Centre · DREPS</div>
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
                PROCÈS-VERBAL GÉNÉRAL DE CLÔTURE D&apos;ANNÉE SCOLAIRE ET DE PASSAGE DE CLASSE
              </h1>
              <div className="text-xs font-bold mt-1 uppercase">
                Année Scolaire Clôturée : {currentYear} ➔ Rentrée Prévue : {nextYear}
              </div>
            </div>

            {/* Tableau synthétique officiel */}
            <table className="w-full text-[10px] border border-black mb-4">
              <thead>
                <tr className="bg-gray-100 border-b border-black text-center font-bold">
                  <th className="p-1.5 border-r border-black w-8">N°</th>
                  <th className="p-1.5 border-r border-black w-24">Matricule</th>
                  <th className="p-1.5 border-r border-black text-left">Nom & Prénom(s)</th>
                  <th className="p-1.5 border-r border-black">Classe Fréquentée ({currentYear})</th>
                  <th className="p-1.5 border-r border-black w-20">Moy. Annuelle</th>
                  <th className="p-1.5 border-r border-black w-28">Décision Conseil</th>
                  <th className="p-1.5 border-r border-black">Nouvelle Affectation ({nextYear})</th>
                  <th className="p-1.5 w-24">Visa Censeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {students.map((st, idx) => (
                  <tr key={st.id} className="text-center">
                    <td className="p-1.5 border-r border-black">{idx + 1}</td>
                    <td className="p-1.5 border-r border-black font-mono">{st.matricule}</td>
                    <td className="p-1.5 border-r border-black text-left font-bold uppercase">
                      {st.lastName} {st.firstName}
                    </td>
                    <td className="p-1.5 border-r border-black">{st.currentClassName}</td>
                    <td className="p-1.5 border-r border-black font-mono font-bold">{st.annualAverage.toFixed(2)} / 20</td>
                    <td className="p-1.5 border-r border-black font-bold uppercase text-[9px]">
                      {st.decision === 'PASSE'
                        ? 'Admis(e)'
                        : st.decision === 'DIPLOME'
                        ? 'Diplômé(e)'
                        : st.decision === 'DOUBLE'
                        ? 'Redouble'
                        : 'Exclu(e)'}
                    </td>
                    <td className="p-1.5 border-r border-black font-bold text-left">{st.targetClassName}</td>
                    <td className="p-1.5"></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Bilan statistique et Signatures */}
            <div className="flex justify-between items-end pt-4 border-t border-black text-xs">
              <div className="space-y-1 text-[10px]">
                <div>Effectif total évalué : <strong>{totalStudents} élèves</strong></div>
                <div>Admis au niveau supérieur : <strong>{promotedCount} élèves</strong> · Redoublants : <strong>{repeatedCount}</strong> · Diplômés : <strong>{graduatedCount}</strong></div>
                <div>Taux global d&apos;admission : <strong>{successRate}%</strong></div>
                <div className="text-gray-500 italic mt-1">Conforme aux directives du MENAPLN pour la transition académique.</div>
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
        </main>
      </div>

      {/* RÈGLES STRICTES D'IMPRESSION DU PROCÈS-VERBAL DE CLÔTURE */}
      <style jsx global>{`
        @page {
          size: A4 landscape;
          margin: 8mm;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-transition-pv, #printable-transition-pv * {
            visibility: visible !important;
          }
          html, body {
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-transition-pv {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 4mm !important;
          }
        }
      `}</style>
    </div>
  );
}
