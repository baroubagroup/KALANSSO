'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { supabase } from '@/lib/supabase';
import { getSchoolSettings, SchoolSettings, DEFAULT_SCHOOL } from '@/lib/schoolSettings';
import { getActiveAcademicYear } from '@/lib/academicYear';
import { BurkinaCoatOfArms } from '@/components/motifs/BurkinaCoatOfArms';
import { AfricanMotif } from '@/components/motifs/AfricanMotif';
import {
  CalendarBlank,
  CurrencyDollar,
  Printer,
  ChatCircleText,
  CheckCircle,
  WarningCircle,
  Clock,
  User,
  MagnifyingGlass,
  Funnel,
  ArrowRight,
  Receipt,
  FileText,
  ShieldCheck,
  PaperPlaneTilt,
} from '@phosphor-icons/react';

interface StudentSchedule {
  id: string;
  matricule: string;
  lastName: string;
  firstName: string;
  classroomName: string;
  guardianName: string;
  guardianPhone: string;
  tuitionFee: number;
  totalPaid: number;
  remainingBalance: number;
  t1Due: number;
  t1Paid: number;
  t1Status: 'SOLDE' | 'PARTIEL' | 'EN_RETARD';
  t2Due: number;
  t2Paid: number;
  t2Status: 'SOLDE' | 'PARTIEL' | 'EN_RETARD';
  t3Due: number;
  t3Paid: number;
  t3Status: 'SOLDE' | 'PARTIEL' | 'EN_ATTENTE';
}

function ScheduleContent() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('studentId') || '';

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [academicYear, setAcademicYear] = useState(getActiveAcademicYear());
  const [students, setStudents] = useState<StudentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'ALL' | 'LATE_T1' | 'LATE_T2' | 'SOLDE'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(preselectedId);
  const [isPrintLetter, setIsPrintLetter] = useState(false);

  // 1. Paramètres école & année
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

  // 2. Charger les élèves et calculer les tranches réelles
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: stdData, error: stdErr } = await supabase
          .from('students')
          .select(`
            id,
            matricule,
            last_name,
            first_name,
            guardian_name,
            guardian_phone,
            classrooms (
              name,
              tuition_fee
            )
          `)
          .order('last_name', { ascending: true });

        const { data: payData } = await supabase.from('payments').select('student_id, amount');

        const payMap = new Map<string, number>();
        if (payData) {
          payData.forEach((p) => {
            const current = payMap.get(p.student_id) || 0;
            payMap.set(p.student_id, current + Number(p.amount || 0));
          });
        }

        if (!stdErr && stdData) {
          const list: StudentSchedule[] = stdData.map((s: any) => {
            const tuition = Number(s.classrooms?.tuition_fee || 60000);
            const paid = payMap.get(s.id) || 0;
            const remaining = Math.max(0, tuition - paid);

            // Découpage MENAPLN des 3 tranches :
            // Tranche 1 = 40% (Échéance 15 Octobre)
            // Tranche 2 = 30% (Échéance 15 Décembre)
            // Tranche 3 = 30% (Échéance 15 Février)
            const t1Due = Math.round(tuition * 0.4);
            const t2Due = Math.round(tuition * 0.3);
            const t3Due = tuition - t1Due - t2Due;

            const t1Paid = Math.min(paid, t1Due);
            const remainingAfterT1 = Math.max(0, paid - t1Due);

            const t2Paid = Math.min(remainingAfterT1, t2Due);
            const remainingAfterT2 = Math.max(0, remainingAfterT1 - t2Due);

            const t3Paid = Math.min(remainingAfterT2, t3Due);

            const t1Status: 'SOLDE' | 'PARTIEL' | 'EN_RETARD' =
              t1Paid >= t1Due ? 'SOLDE' : t1Paid > 0 ? 'PARTIEL' : 'EN_RETARD';

            const t2Status: 'SOLDE' | 'PARTIEL' | 'EN_RETARD' =
              t2Paid >= t2Due ? 'SOLDE' : t2Paid > 0 ? 'PARTIEL' : 'EN_RETARD';

            const t3Status: 'SOLDE' | 'PARTIEL' | 'EN_ATTENTE' =
              t3Paid >= t3Due ? 'SOLDE' : t3Paid > 0 ? 'PARTIEL' : 'EN_ATTENTE';

            return {
              id: s.id,
              matricule: s.matricule || 'KLS-000',
              lastName: s.last_name,
              firstName: s.first_name,
              classroomName: s.classrooms?.name || 'Général',
              guardianName: s.guardian_name || 'Tuteur Légal',
              guardianPhone: s.guardian_phone || '+226 70 00 00 00',
              tuitionFee: tuition,
              totalPaid: paid,
              remainingBalance: remaining,
              t1Due,
              t1Paid,
              t1Status,
              t2Due,
              t2Paid,
              t2Status,
              t3Due,
              t3Paid,
              t3Status,
            };
          });

          setStudents(list);
          if (preselectedId && list.some((st) => st.id === preselectedId)) {
            setSelectedStudentId(preselectedId);
          } else if (list.length > 0 && !selectedStudentId) {
            setSelectedStudentId(list[0].id);
          }
        }
      } catch (e) {
        console.error('Erreur chargement échéanciers:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [preselectedId, academicYear]);

  // Filtrage
  const filtered = useMemo(() => {
    return students.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        s.lastName.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        s.matricule.toLowerCase().includes(q) ||
        s.classroomName.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (filterMode === 'LATE_T1') return s.t1Status === 'EN_RETARD';
      if (filterMode === 'LATE_T2') return s.t2Status === 'EN_RETARD';
      if (filterMode === 'SOLDE') return s.remainingBalance === 0;
      return true;
    });
  }, [students, search, filterMode]);

  // Statistiques globales
  const totalStudents = students.length;
  const lateT1Count = students.filter((s) => s.t1Status === 'EN_RETARD').length;
  const lateT2Count = students.filter((s) => s.t2Status === 'EN_RETARD').length;
  const fullyPaidCount = students.filter((s) => s.remainingBalance === 0).length;

  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const handleOpenPrintLetter = (stId: string) => {
    setSelectedStudentId(stId);
    setIsPrintLetter(true);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const getWhatsAppReminderUrl = (st: StudentSchedule) => {
    const text = encodeURIComponent(
      `Bonjour M./Mme ${st.guardianName},\n\n` +
      `La Direction du ${schoolSettings.name} vous informe que la tranche de scolarité de votre enfant ${st.lastName} ${st.firstName} (${st.classroomName}, Matr: ${st.matricule}) est arrivée à échéance.\n\n` +
      `Solde restant à régulariser : ${st.remainingBalance.toLocaleString('fr-FR')} FCFA.\n\n` +
      `Merci d'effectuer le règlement au guichet de caisse ou par Moov Money / Orange Money dans les plus brefs délais.\n\n` +
      `Direction Générale : ${schoolSettings.phone}`
    );
    const cleanPhone = st.guardianPhone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${text}`;
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
            title="Échéanciers de Scolarité & Relances d'Impayés"
            breadcrumbs={[
              { label: 'Tableau de Bord', href: '/dashboard' },
              { label: 'Finances', href: '/finance' },
              { label: 'Échéanciers & Relances' },
            ]}
          />
        </div>

        {/* ── BARRE DE CONTRÔLE SUPÉRIEURE ── */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 print:hidden shadow-2xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-nature-700 bg-nature-50 border border-nature-200 px-2 py-0.5 rounded">
                  Plan Financier en 3 Tranches
                </span>
                <span className="text-xs text-slate-500 font-medium">Année Scolaire {academicYear}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">Échéanciers, Tranches & Recouvrement</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Suivi nominatif des paiements par tranche, alertes WhatsApp directes et lettres officielles de mise en demeure.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/finance/class-sheet"
                className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs rounded-xl transition-smooth shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileText size={16} weight="bold" />
                <span>Fiche par Classe (A4)</span>
              </Link>
              <Link
                href="/cashier"
                className="px-4 py-2 bg-nature-700 hover:bg-nature-800 text-white font-bold text-xs rounded-xl transition-smooth shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CurrencyDollar size={16} weight="bold" />
                <span>Ouvrir le Guichet Caisse</span>
              </Link>
            </div>
          </div>

          {/* 3 Tranches officielles explicatives */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">1ère Tranche (40%)</span>
                <strong className="text-slate-900 text-sm">Rentrée & Inscription</strong>
                <div className="text-[11px] text-slate-500 mt-0.5">Échéance : 15 Octobre</div>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">Échue</span>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-800 block">2ème Tranche (30%)</span>
                <strong className="text-amber-900 text-sm">Fin 1er Trimestre</strong>
                <div className="text-[11px] text-amber-700 mt-0.5">Échéance : 15 Décembre</div>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">En cours</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">3ème Tranche (30%)</span>
                <strong className="text-slate-900 text-sm">Fin 2ème Trimestre</strong>
                <div className="text-[11px] text-slate-500 mt-0.5">Échéance : 15 Février</div>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">À venir</span>
            </div>
          </div>
        </div>

        {/* ── CONTENU PRINCIPAL ÉCRAN ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 print:p-0 print:overflow-visible">
          <div className="max-w-6xl mx-auto space-y-6 print:hidden">
            {/* 4 Jauges KPI des Échéanciers */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Effectif Évalué</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">{totalStudents} élèves</div>
                <div className="text-[11px] text-slate-500 mt-1">Inscrits réels en base</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">Scolarités Intégrales</span>
                <div className="text-2xl font-bold text-emerald-700 mt-1">{fullyPaidCount} élèves</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">100% des 3 tranches soldées</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-amber-600 block tracking-wider">Retard Tranche 2</span>
                <div className="text-2xl font-bold text-amber-700 mt-1">{lateT2Count} élèves</div>
                <div className="text-[11px] text-amber-700 mt-1">À relancer avant le 15 Décembre</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-red-600 block tracking-wider">Retard Critique (Tr. 1)</span>
                <div className="text-2xl font-bold text-red-700 mt-1">{lateT1Count} élèves</div>
                <div className="text-[11px] text-red-600 font-semibold mt-1">Mise en demeure requise</div>
              </div>
            </div>

            {/* Barre de filtres et recherche */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterMode('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth cursor-pointer ${
                    filterMode === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tous les élèves ({totalStudents})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('LATE_T2')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth cursor-pointer ${
                    filterMode === 'LATE_T2' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  Impayés Tranche 2 ({lateT2Count})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('LATE_T1')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth cursor-pointer ${
                    filterMode === 'LATE_T1' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'
                  }`}
                >
                  Critiques Tranche 1 ({lateT1Count})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('SOLDE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth cursor-pointer ${
                    filterMode === 'SOLDE' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  Soldés ({fullyPaidCount})
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher élève, matricule..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:border-nature-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Tableau principal des échéanciers */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Matricule & Élève</th>
                      <th className="px-4 py-3">Classe</th>
                      <th className="px-4 py-3 text-right">Scolarité Dûe</th>
                      <th className="px-4 py-3 text-center">Tranche 1 (40%)</th>
                      <th className="px-4 py-3 text-center">Tranche 2 (30%)</th>
                      <th className="px-4 py-3 text-center">Tranche 3 (30%)</th>
                      <th className="px-4 py-3 text-right">Reste Total</th>
                      <th className="px-4 py-3 text-center">Actions Relance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          Calcul des échéanciers depuis Supabase...
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          Aucun élève ne correspond aux critères de filtre.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50/70 transition-smooth">
                          <td className="px-4 py-3">
                            <div className="font-mono text-[11px] text-slate-500">{st.matricule}</div>
                            <div className="font-bold text-slate-900 uppercase">
                              {st.lastName} {st.firstName}
                            </div>
                            <div className="text-[10px] text-slate-400">Tél: {st.guardianPhone}</div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {st.classroomName}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                            {st.tuitionFee.toLocaleString('fr-FR')} F
                          </td>

                          {/* Statut Tranche 1 */}
                          <td className="px-4 py-3 text-center">
                            {st.t1Status === 'SOLDE' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                <CheckCircle size={11} weight="fill" />
                                {st.t1Due.toLocaleString('fr-FR')} F
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                                <WarningCircle size={11} weight="fill" />
                                Reste {(st.t1Due - st.t1Paid).toLocaleString('fr-FR')} F
                              </span>
                            )}
                          </td>

                          {/* Statut Tranche 2 */}
                          <td className="px-4 py-3 text-center">
                            {st.t2Status === 'SOLDE' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                <CheckCircle size={11} weight="fill" />
                                {st.t2Due.toLocaleString('fr-FR')} F
                              </span>
                            ) : st.t2Paid > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                                Partiel ({st.t2Paid.toLocaleString('fr-FR')} F)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                <Clock size={11} weight="bold" />
                                {st.t2Due.toLocaleString('fr-FR')} F
                              </span>
                            )}
                          </td>

                          {/* Statut Tranche 3 */}
                          <td className="px-4 py-3 text-center">
                            {st.t3Status === 'SOLDE' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                <CheckCircle size={11} weight="fill" />
                                {st.t3Due.toLocaleString('fr-FR')} F
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {st.t3Due.toLocaleString('fr-FR')} F
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-bold">
                            <span className={st.remainingBalance === 0 ? 'text-emerald-700' : 'text-amber-800'}>
                              {st.remainingBalance.toLocaleString('fr-FR')} F
                            </span>
                          </td>

                          {/* Boutons d'action */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Guichet Caisse direct */}
                              <Link
                                href={`/cashier?studentId=${st.id}`}
                                title="Encaisser un versement au guichet"
                                className="p-1.5 rounded-lg bg-nature-50 text-nature-700 hover:bg-nature-100 border border-nature-200 transition-smooth"
                              >
                                <CurrencyDollar size={15} weight="bold" />
                              </Link>

                              {/* Relance WhatsApp */}
                              {st.remainingBalance > 0 && (
                                <a
                                  href={getWhatsAppReminderUrl(st)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Envoyer une relance WhatsApp personnalisée"
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-smooth"
                                >
                                  <ChatCircleText size={15} weight="bold" />
                                </a>
                              )}

                              {/* Lettre Officielle de Mise en Demeure A4 */}
                              {st.remainingBalance > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPrintLetter(st.id)}
                                  title="Imprimer la lettre officielle de relance A4"
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-smooth cursor-pointer"
                                >
                                  <FileText size={15} weight="bold" />
                                </button>
                              )}
                            </div>
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
              LETTRE OFFICIELLE DE RELANCE D'IMPAYÉ (FORMAT A4 ISOLÉ)
              ───────────────────────────────────────────────────────────── */}
          {activeStudent && (
            <div
              id="printable-reminder-letter"
              className="hidden print:block bg-white text-black p-10 font-serif leading-relaxed"
              style={{ minHeight: '290mm' }}
            >
              {/* En-tête officiel burkinabè */}
              <div className="flex justify-between items-start pb-4 border-b-2 border-black mb-6">
                <div className="w-1/3">
                  <div className="font-bold uppercase text-[10px]">BURKINA FASO</div>
                  <div className="text-[9px] italic">Unité - Progrès - Justice</div>
                  <div className="text-[9px] uppercase font-bold mt-1">Ministère de l&apos;Éducation Nationale (MENAPLN)</div>
                  <div className="text-[8px] text-gray-700">Direction Régionale du Centre</div>
                </div>

                <div className="w-1/3 flex flex-col items-center">
                  {schoolSettings.logo_url ? (
                    <div className="w-14 h-14 flex items-center justify-center mb-1">
                      <img src={schoolSettings.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <BurkinaCoatOfArms className="w-12 h-12" />
                  )}
                  <span className="font-mono text-[8px] text-gray-600 mt-0.5">{schoolSettings.code_menapln}</span>
                </div>

                <div className="w-1/3 text-right">
                  <div className="font-bold text-sm uppercase">{schoolSettings.name}</div>
                  <div className="text-[9px] text-gray-800">{schoolSettings.address || `${schoolSettings.city}, Burkina Faso`}</div>
                  <div className="text-[9px]">Tél : {schoolSettings.phone}</div>
                  <div className="text-[8px] italic">{schoolSettings.motto}</div>
                </div>
              </div>

              {/* Référence et Date */}
              <div className="flex justify-between items-center text-xs mb-6">
                <div>
                  Réf : <strong>REL-{academicYear}/{activeStudent.matricule}</strong>
                </div>
                <div>
                  Fait à {schoolSettings.city}, le {new Date().toLocaleDateString('fr-FR')}
                </div>
              </div>

              {/* Destinataire */}
              <div className="border border-black p-4 mb-6 text-xs w-2/3 ml-auto bg-gray-50/50">
                <div className="font-bold uppercase text-[10px] text-gray-600">Destinataire :</div>
                <div className="font-bold text-sm text-black mt-1">
                  M. / Mme {activeStudent.guardianName}
                </div>
                <div>Parent / Tuteur légal de l&apos;élève : <strong className="uppercase">{activeStudent.lastName} {activeStudent.firstName}</strong></div>
                <div>Classe d&apos;affectation : <strong className="uppercase">{activeStudent.classroomName}</strong></div>
                <div>Téléphone de contact : <strong className="font-mono">{activeStudent.guardianPhone}</strong></div>
              </div>

              {/* Titre et Objet */}
              <div className="mb-6">
                <div className="text-sm font-bold uppercase tracking-wider">
                  OBJET : LETTRE DE RELANCE & MISE EN DEMEURE POUR RETARD DE SCOLARITÉ
                </div>
                <div className="text-xs font-semibold text-gray-700 mt-0.5">
                  Année Scolaire en cours : {academicYear}
                </div>
              </div>

              {/* Corps de la lettre officiel */}
              <div className="text-xs space-y-4 text-justify">
                <p>Madame, Monsieur,</p>

                <p>
                  Sauf erreur ou omission de notre part, nous constatons qu&apos;à la date de ce jour, les frais de scolarité
                  dus au titre de l&apos;échéancier officiel pour votre enfant <strong>{activeStudent.lastName} {activeStudent.firstName}</strong>,
                  inscrit(e) en classe de <strong>{activeStudent.classroomName}</strong> (Matricule : <strong className="font-mono">{activeStudent.matricule}</strong>),
                  présentent un solde débiteur non régularisé.
                </p>

                {/* Tableau récapitulatif des tranches */}
                <table className="w-full text-xs border border-black my-4">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black text-center font-bold text-[10px]">
                      <th className="p-2 border-r border-black text-left">Désignation de la Tranche</th>
                      <th className="p-2 border-r border-black w-28">Date Limite</th>
                      <th className="p-2 border-r border-black w-28">Montant Exigible</th>
                      <th className="p-2 border-r border-black w-28">Montant Versé</th>
                      <th className="p-2 w-28 text-right">Reste Dû</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    <tr>
                      <td className="p-2 border-r border-black font-semibold">1ère Tranche (Rentrée & Inscription)</td>
                      <td className="p-2 border-r border-black text-center font-mono">15/10/2026</td>
                      <td className="p-2 border-r border-black text-center font-mono">{activeStudent.t1Due.toLocaleString('fr-FR')} F</td>
                      <td className="p-2 border-r border-black text-center font-mono">{activeStudent.t1Paid.toLocaleString('fr-FR')} F</td>
                      <td className="p-2 text-right font-mono font-bold">{(activeStudent.t1Due - activeStudent.t1Paid).toLocaleString('fr-FR')} F</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-black font-semibold">2ème Tranche (Fin 1er Trimestre)</td>
                      <td className="p-2 border-r border-black text-center font-mono">15/12/2026</td>
                      <td className="p-2 border-r border-black text-center font-mono">{activeStudent.t2Due.toLocaleString('fr-FR')} F</td>
                      <td className="p-2 border-r border-black text-center font-mono">{activeStudent.t2Paid.toLocaleString('fr-FR')} F</td>
                      <td className="p-2 text-right font-mono font-bold">{(activeStudent.t2Due - activeStudent.t2Paid).toLocaleString('fr-FR')} F</td>
                    </tr>
                    <tr className="bg-gray-50 font-bold border-t-2 border-black">
                      <td colSpan={4} className="p-2 border-r border-black uppercase text-right">
                        TOTAL ACTUELLEMENT EN SOUFFRANCE :
                      </td>
                      <td className="p-2 text-right font-mono text-sm underline">
                        {activeStudent.remainingBalance.toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p>
                  Nous vous prions de bien vouloir régulariser ce montant sous un délai de <strong>huit (08) jours ouvrables</strong> à
                  compter de la réception de la présente notification, soit au plus tard le <strong>{new Date(Date.now() + 8 * 86400000).toLocaleDateString('fr-FR')}</strong>.
                </p>

                <p>
                  Les règlements peuvent s&apos;effectuer directement au guichet de la comptabilité de l&apos;établissement ou par paiement
                  sécurisé <strong>Moov Money</strong> / <strong>Orange Money</strong> auprès du secrétariat au numéro officiel <strong>{schoolSettings.phone}</strong>.
                </p>

                <p className="text-[11px] italic text-gray-700">
                  Passé ce délai, et conformément au règlement intérieur de l&apos;établissement agréé par le MENAPLN, la direction
                  se verra dans l&apos;obligation d&apos;appliquer les mesures administratives d&apos;usage (suspension temporaire des cours).
                </p>

                <p>Comptant sur votre diligence et votre bonne collaboration pour le bon suivi de la scolarité de votre enfant, veuillez agréer, Madame, Monsieur, l&apos;expression de nos salutations distinguées.</p>
              </div>

              {/* Signatures officielles */}
              <div className="flex justify-between items-end pt-8 border-t-2 border-black mt-8 text-xs">
                <div>
                  <div className="font-bold">L&apos;Intendant / Le Chef Comptable</div>
                  <div className="h-14"></div>
                  <div className="text-[9px] text-gray-500">(Signature)</div>
                </div>

                <div className="text-right">
                  <div className="font-bold">{schoolSettings.director_title || 'Le Chef d’Établissement / Proviseur'}</div>
                  <div className="text-xs italic">{schoolSettings.director_name || 'M. ILBOUDO Marc'}</div>
                  <div className="h-16 flex items-center justify-end mt-1">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center text-[7px] text-gray-500 uppercase tracking-widest font-bold">
                      Cachet Officiel
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* RÈGLES STRICTES D'IMPRESSION A4 ISOLÉE POUR LA LETTRE DE RELANCE */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-reminder-letter, #printable-reminder-letter * {
            visibility: visible !important;
          }
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-reminder-letter {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
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

export default function TuitionSchedulePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Chargement des échéanciers...</div>}>
      <ScheduleContent />
    </Suspense>
  );
}
