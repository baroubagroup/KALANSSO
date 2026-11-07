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
  Chalkboard,
  CurrencyDollar,
  Printer,
  ChatCircleText,
  CheckCircle,
  WarningCircle,
  MagnifyingGlass,
  ArrowRight,
  FileText,
  Funnel,
  Receipt,
  Users,
  CaretDown,
  Sparkle,
  Stack,
  ArrowSquareOut,
} from '@phosphor-icons/react';

interface ClassroomOption {
  id: string;
  name: string;
  cycle: string;
  tuition_fee: number;
}

interface StudentClassFinance {
  id: string;
  matricule: string;
  lastName: string;
  firstName: string;
  gender: string;
  classroomId: string;
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

function ClassSheetContent() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classroomId') || 'ALL';

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [academicYear, setAcademicYear] = useState(getActiveAcademicYear());
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(initialClassId);
  const [students, setStudents] = useState<StudentClassFinance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'UNPAID_ONLY' | 'ALL' | 'SOLDE_ONLY'>('UNPAID_ONLY');
  const [search, setSearch] = useState('');

  // 1. Paramètres école
  useEffect(() => {
    async function loadSettings() {
      const s = await getSchoolSettings();
      setSchoolSettings(s);
    }
    loadSettings();

    function handleYear(e: any) {
      if (e.detail?.year) setAcademicYear(e.detail.year);
    }
    window.addEventListener('kalansso_academic_year_changed', handleYear);
    return () => window.removeEventListener('kalansso_academic_year_changed', handleYear);
  }, []);

  // 2. Charger les classes depuis Supabase
  useEffect(() => {
    async function loadClassrooms() {
      try {
        const { data, error } = await supabase
          .from('classrooms')
          .select('id, name, cycle, tuition_fee')
          .order('name');

        if (!error && data && data.length > 0) {
          setClassrooms(data);
        }
      } catch (e) {
        console.error('Erreur chargement classes:', e);
      }
    }
    loadClassrooms();
  }, []);

  // 3. Charger les élèves et paiements (Classe spécifique ou TOUTES les classes)
  useEffect(() => {
    async function loadStudents() {
      setLoading(true);

      try {
        let query = supabase
          .from('students')
          .select(`
            id,
            matricule,
            last_name,
            first_name,
            gender,
            classroom_id,
            guardian_name,
            guardian_phone,
            classrooms (
              id,
              name,
              tuition_fee
            )
          `)
          .order('last_name', { ascending: true });

        if (selectedClassroomId !== 'ALL') {
          query = query.eq('classroom_id', selectedClassroomId);
        }

        const { data: stdData, error: stdErr } = await query;

        if (stdErr || !stdData) {
          setStudents([]);
          return;
        }

        // Paiements réels enregistrés pour ces élèves
        const stdIds = stdData.map((s) => s.id);
        const { data: payData } = await supabase
          .from('payments')
          .select('student_id, amount')
          .in('student_id', stdIds);

        const payMap = new Map<string, number>();
        if (payData) {
          payData.forEach((p) => {
            const current = payMap.get(p.student_id) || 0;
            payMap.set(p.student_id, current + Number(p.amount || 0));
          });
        }

        const mapped: StudentClassFinance[] = stdData.map((s: any) => {
          const tuition = Number(s.classrooms?.tuition_fee || 60000);
          const paid = payMap.get(s.id) || 0;
          const remaining = Math.max(0, tuition - paid);

          const t1Due = Math.round(tuition * 0.4);
          const t2Due = Math.round(tuition * 0.3);
          const t3Due = tuition - t1Due - t2Due;

          const t1Paid = Math.min(paid, t1Due);
          const remainingAfterT1 = Math.max(0, paid - t1Due);
          const t2Paid = Math.min(remainingAfterT1, t2Due);
          const remainingAfterT2 = Math.max(0, remainingAfterT1 - t2Due);
          const t3Paid = Math.min(remainingAfterT2, t3Due);

          const t1Status = t1Paid >= t1Due ? 'SOLDE' : t1Paid > 0 ? 'PARTIEL' : 'EN_RETARD';
          const t2Status = t2Paid >= t2Due ? 'SOLDE' : t2Paid > 0 ? 'PARTIEL' : 'EN_RETARD';
          const t3Status = t3Paid >= t3Due ? 'SOLDE' : t3Paid > 0 ? 'PARTIEL' : 'EN_ATTENTE';

          return {
            id: s.id,
            matricule: s.matricule || 'KLS-000',
            lastName: s.last_name,
            firstName: s.first_name,
            gender: s.gender || 'M',
            classroomId: s.classroom_id,
            classroomName: s.classrooms?.name || 'Classe',
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

        setStudents(mapped);
      } catch (e) {
        console.error('Erreur chargement élèves de la classe:', e);
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, [selectedClassroomId, academicYear]);

  // Filtrage global des élèves
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      if (filterMode === 'UNPAID_ONLY' && st.remainingBalance <= 0) return false;
      if (filterMode === 'SOLDE_ONLY' && st.remainingBalance > 0) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = `${st.lastName} ${st.firstName}`.toLowerCase().includes(q);
        const matchMatr = st.matricule.toLowerCase().includes(q);
        if (!matchName && !matchMatr) return false;
      }
      return true;
    });
  }, [students, filterMode, search]);

  // Groupement par classe (pour mode Tournée Complète ou mode Classe Unique)
  const classesGroups = useMemo(() => {
    if (selectedClassroomId !== 'ALL') {
      const targetClass = classrooms.find((c) => c.id === selectedClassroomId);
      const clsStudents = filteredStudents.filter((s) => s.classroomId === selectedClassroomId);
      if (!targetClass) {
        return [{
          id: 'custom-class',
          name: clsStudents[0]?.classroomName || 'Classe',
          cycle: 'Secondaire',
          tuition_fee: 60000,
          students: clsStudents,
        }];
      }
      return [{
        ...targetClass,
        students: clsStudents,
      }];
    }

    // Si ALL : regrouper par classe réelle
    const groups = classrooms.map((cls) => {
      const clsStudents = filteredStudents.filter((s) => s.classroomId === cls.id);
      return {
        ...cls,
        students: clsStudents,
      };
    });

    // Garder uniquement les classes qui ont des élèves selon le filtre
    return groups.filter((g) => g.students.length > 0);
  }, [classrooms, selectedClassroomId, filteredStudents]);

  // Statistiques globales
  const totalStudentsCount = students.length;
  const totalUnpaidCount = students.filter((s) => s.remainingBalance > 0).length;
  const totalPaidCount = students.filter((s) => s.remainingBalance === 0).length;
  const totalRemainingSum = students.reduce((acc, s) => acc + s.remainingBalance, 0);
  const totalExpectedSum = students.reduce((acc, s) => acc + s.tuitionFee, 0);
  const totalCollectedSum = students.reduce((acc, s) => acc + s.totalPaid, 0);
  const globalRecoveryRate = totalExpectedSum > 0 ? Math.round((totalCollectedSum / totalExpectedSum) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppReminderUrl = (st: StudentClassFinance) => {
    const text = encodeURIComponent(
      `Bonjour M./Mme ${st.guardianName},\n\n` +
      `La Direction du ${schoolSettings.name} vous informe que la scolarité de votre enfant ${st.lastName} ${st.firstName} (${st.classroomName}, Matr: ${st.matricule}) présente un impayé en date du ${new Date().toLocaleDateString('fr-FR')}.\n\n` +
      `Reste à régulariser : ${st.remainingBalance.toLocaleString('fr-FR')} FCFA.\n\n` +
      `Merci d'effectuer le règlement auprès de l'intendance ou par Moov Money / Orange Money au numéro officiel de l'école : ${schoolSettings.phone}.\n\n` +
      `Direction de l'Établissement`
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
            title="Fiche de Contrôle Financier & Recouvrement par Classe"
            breadcrumbs={[
              { label: 'Tableau de Bord', href: '/dashboard' },
              { label: 'Finances', href: '/finance' },
              { label: 'Échéanciers', href: '/finance/schedule' },
              { label: 'Fiche par Classe' },
            ]}
          />
        </div>

        {/* ── BARRE D'ACTIONS & FILTRES (print:hidden) ── */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 print:hidden shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                  selectedClassroomId === 'ALL'
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : 'bg-nature-50 text-nature-700 border-nature-200'
                }`}>
                  {selectedClassroomId === 'ALL' ? '🎒 Mode Tournée Complète' : '📋 Contrôle en Classe'}
                </span>
                <span className="text-xs text-slate-500 font-medium">Année Scolaire {academicYear}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">
                {selectedClassroomId === 'ALL'
                  ? 'Tournée Complète de Recouvrement (Toutes les Classes)'
                  : 'Fiche de Contrôle Financier en Classe (Format A4 Émargement)'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedClassroomId === 'ALL'
                  ? `Imprimez en 1 clic l'ensemble des fiches (${classesGroups.length} classes). Chaque classe s'imprime automatiquement sur sa propre feuille A4.`
                  : 'Feuille prête à imprimer pour la visite dans la classe sélectionnée avec colonne d’émargement au stylo.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/finance/schedule"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-smooth"
              >
                Échéanciers Globaux
              </Link>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-smooth shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Printer size={16} weight="bold" />
                <span>
                  {selectedClassroomId === 'ALL'
                    ? `Imprimer la Tournée Complète (${classesGroups.length} fiches A4)`
                    : 'Imprimer la Fiche de la Classe (A4)'}
                </span>
              </button>
            </div>
          </div>

          {/* SÉLECTEUR DE CLASSE / MODE TOURNÉE & FILTRES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
            {/* Choix classe / Tournée complète */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Périmètre du Contrôle *
              </label>
              <select
                value={selectedClassroomId}
                onChange={(e) => setSelectedClassroomId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-nature-500 focus:bg-white cursor-pointer"
              >
                <option value="ALL">🌟 TOUTES LES CLASSES (Mode Tournée Complète)</option>
                <optgroup label="── CLASSES INDIVIDUELLES ──">
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.cycle})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Filtre statut */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Affichage des Élèves
              </label>
              <select
                value={filterMode}
                onChange={(e: any) => setFilterMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:border-nature-500 focus:bg-white cursor-pointer"
              >
                <option value="UNPAID_ONLY">Retardataires uniquement (Recommandé en classe)</option>
                <option value="ALL">Tous les élèves de la classe</option>
                <option value="SOLDE_ONLY">Élèves en règle uniquement (Soldé)</option>
              </select>
            </div>

            {/* Recherche élève */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Rechercher un élève
              </label>
              <div className="relative">
                <MagnifyingGlass size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrer par nom ou matricule..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-nature-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* BANDEAU MODE TOURNÉE (si ALL) */}
          {selectedClassroomId === 'ALL' && (
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Stack size={18} weight="bold" className="text-purple-700" />
                <span className="font-bold text-purple-900">
                  Mode Tournée Générale : {classesGroups.length} classe(s) préparée(s) pour la tournée du surveillant.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-purple-700 font-medium">Classes incluses :</span>
                {classesGroups.map((g) => (
                  <span key={g.id} className="font-bold text-purple-800 bg-white border border-purple-200 px-2 py-0.5 rounded-md">
                    {g.name} ({g.students.length})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── ZONE DE CONTENU (Écran & Impression A4) ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0">
          {/* STATS GLOBALES SUR ÉCRAN (print:hidden) */}
          <div className="max-w-5xl mx-auto mb-4 print:hidden grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                {selectedClassroomId === 'ALL' ? 'Total Élèves Établissement' : 'Effectif Classe'}
              </span>
              <div className="text-xl font-black text-slate-900 mt-0.5">{totalStudentsCount} élèves</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {selectedClassroomId === 'ALL' ? `${classesGroups.length} classes actives` : 'Inscrits dans la classe'}
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">Élèves Retardataires</span>
              <div className="text-xl font-black text-amber-700 mt-0.5">{totalUnpaidCount} élèves</div>
              <div className="text-[11px] text-amber-800 mt-0.5">À contrôler en tournée</div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Élèves en Règle</span>
              <div className="text-xl font-black text-emerald-700 mt-0.5">{totalPaidCount} élèves</div>
              <div className="text-[11px] text-emerald-800 mt-0.5">Scolarité soldée (100%)</div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-rose-800 block">Total en Souffrance</span>
              <div className="text-xl font-black text-rose-700 mt-0.5">{totalRemainingSum.toLocaleString('fr-FR')} F</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Taux global : {globalRecoveryRate}%</div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              CONTENEUR D'IMPRESSION A4 (Supporte Tournée Complète & Classe Unique)
              ───────────────────────────────────────────────────────────── */}
          <div id="printable-tour-container" className="max-w-[850px] mx-auto space-y-8 print:space-y-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                Chargement des fiches de classe depuis Supabase...
              </div>
            ) : classesGroups.length === 0 ? (
              <div className="p-12 text-center space-y-3 bg-white rounded-xl border border-slate-200">
                <CheckCircle size={36} className="mx-auto text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Aucun retardataire trouvé selon les critères</h3>
                <p className="text-xs text-slate-500">
                  Tous les élèves sont à jour de leur scolarité ou aucun élève ne correspond à votre filtre.
                </p>
              </div>
            ) : (
              classesGroups.map((group, groupIdx) => {
                const grpExpected = group.students.reduce((acc, s) => acc + s.tuitionFee, 0);
                const grpPaid = group.students.reduce((acc, s) => acc + s.totalPaid, 0);
                const grpRemaining = group.students.reduce((acc, s) => acc + s.remainingBalance, 0);
                const grpRate = grpExpected > 0 ? Math.round((grpPaid / grpExpected) * 100) : 0;

                return (
                  <div
                    key={group.id || groupIdx}
                    className="print-class-sheet bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 text-black leading-tight relative"
                    style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                  >
                    {/* Filigrane culturel burkinabè discret */}
                    <AfricanMotif pattern={schoolSettings.watermark_pattern} opacity={0.03} className="absolute inset-0 pointer-events-none" />

                    {/* EN-TÊTE OFFICIEL BURKINABÈ */}
                    <div className="flex justify-between items-start pb-3 border-b-2 border-black mb-3">
                      {/* Gauche : Ministère */}
                      <div className="w-1/3 text-left">
                        <div className="font-bold text-[10px] uppercase tracking-wider">BURKINA FASO</div>
                        <div className="text-[9px] italic">Unité - Progrès - Justice</div>
                        <div className="text-[8.5px] uppercase font-bold mt-1 text-slate-800">
                          Ministère de l&apos;Éducation Nationale (MENAPLN)
                        </div>
                        <div className="text-[8px] text-slate-600">Direction Régionale du Centre</div>
                      </div>

                      {/* Centre : Armoiries ou Logo */}
                      <div className="w-1/3 flex flex-col items-center">
                        {schoolSettings.logo_url ? (
                          <div className="w-12 h-12 flex items-center justify-center mb-0.5">
                            <img src={schoolSettings.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                          </div>
                        ) : (
                          <BurkinaCoatOfArms className="w-12 h-12" />
                        )}
                        <span className="font-mono text-[8px] text-slate-600 font-bold uppercase mt-0.5">
                          {schoolSettings.code_menapln}
                        </span>
                      </div>

                      {/* Droite : École */}
                      <div className="w-1/3 text-right">
                        <div className="font-bold text-xs uppercase text-slate-900">{schoolSettings.name}</div>
                        <div className="text-[8.5px] text-slate-600">{schoolSettings.address || `${schoolSettings.city}, Burkina Faso`}</div>
                        <div className="text-[8.5px] text-slate-700">Tél : {schoolSettings.phone}</div>
                        <div className="text-[8px] italic text-emerald-800 font-semibold">{schoolSettings.motto}</div>
                      </div>
                    </div>

                    {/* TITRE ET CARTOUCHE DE LA CLASSE */}
                    <div className="border-2 border-black bg-slate-50 p-2.5 mb-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                          FICHE DE CONTRÔLE FINANCIER & DE RECOUVREMENT EN CLASSE
                        </h2>
                      </div>
                      <div className="flex flex-wrap justify-between items-center text-[10px] font-bold mt-1.5 pt-1 border-t border-slate-300 px-2">
                        <div>
                          CLASSE :{' '}
                          <span className="text-xs font-black uppercase bg-white px-2 py-0.5 border border-black rounded">
                            {group.name}
                          </span>
                        </div>
                        <div>ANNÉE SCOLAIRE : <span className="font-mono">{academicYear}</span></div>
                        <div>DATE DU CONTRÔLE : <span className="font-mono">{new Date().toLocaleDateString('fr-FR')}</span></div>
                        <div>
                          STATUT :{' '}
                          <span className="uppercase text-[9px]">
                            {filterMode === 'UNPAID_ONLY' ? 'Retardataires Uniquement' : filterMode === 'SOLDE_ONLY' ? 'Soldés' : 'Tous Élèves'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* TABLEAU DES ÉLÈVES AVEC ÉMARGEMENT */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[9.5px] border-collapse border border-black">
                        <thead>
                          <tr className="bg-slate-100 text-black font-bold uppercase text-[8.5px] border-b-2 border-black">
                            <th className="p-1.5 border border-black text-center w-7">N°</th>
                            <th className="p-1.5 border border-black w-20">Matricule</th>
                            <th className="p-1.5 border border-black">Nom & Prénom(s)</th>
                            <th className="p-1.5 border border-black text-right w-20">Scolarité</th>
                            <th className="p-1.5 border border-black text-right w-20">Versé</th>
                            <th className="p-1.5 border border-black text-right w-24 bg-amber-50">Reste Dû</th>
                            <th className="p-1.5 border border-black text-center w-24">Tranches</th>
                            <th className="p-1.5 border border-black w-24">Tél. Parent</th>
                            <th className="p-1.5 border border-black text-center w-36 bg-slate-50">Émargement / Observation</th>
                            <th className="p-1.5 border border-black text-center w-14 print:hidden">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black">
                          {group.students.map((st, idx) => (
                            <tr key={st.id} className="hover:bg-slate-50/50">
                              <td className="p-1.5 border border-black text-center font-bold text-slate-600">
                                {idx + 1}
                              </td>
                              <td className="p-1.5 border border-black font-mono font-bold text-slate-800">
                                {st.matricule}
                              </td>
                              <td className="p-1.5 border border-black font-semibold text-slate-900">
                                {st.lastName} {st.firstName}
                              </td>
                              <td className="p-1.5 border border-black text-right font-mono">
                                {st.tuitionFee.toLocaleString('fr-FR')} F
                              </td>
                              <td className="p-1.5 border border-black text-right font-mono text-emerald-800 font-semibold">
                                {st.totalPaid.toLocaleString('fr-FR')} F
                              </td>
                              <td className={`p-1.5 border border-black text-right font-mono font-black ${
                                st.remainingBalance > 0 ? 'text-rose-700 bg-rose-50/40' : 'text-emerald-700'
                              }`}>
                                {st.remainingBalance.toLocaleString('fr-FR')} F
                              </td>
                              <td className="p-1.5 border border-black text-center text-[8.5px]">
                                {st.remainingBalance === 0 ? (
                                  <span className="text-emerald-700 font-bold">Soldé</span>
                                ) : (
                                  <span className="font-mono text-slate-700">
                                    T1:{st.t1Status === 'SOLDE' ? 'OK' : 'Ret.'} | T2:{st.t2Status === 'SOLDE' ? 'OK' : 'Ret.'}
                                  </span>
                                )}
                              </td>
                              <td className="p-1.5 border border-black font-mono text-[9px] text-slate-700">
                                {st.guardianPhone}
                              </td>
                              {/* Colonne d'émargement au stylo */}
                              <td className="p-1.5 border border-black text-center align-middle relative min-h-[32px] bg-slate-50/30">
                                <div className="h-6 border-b border-dashed border-slate-400 w-full"></div>
                              </td>
                              {/* Actions écran */}
                              <td className="p-1.5 border border-black text-center print:hidden">
                                <div className="flex items-center justify-center gap-1">
                                  <Link
                                    href={`/cashier?studentId=${st.id}`}
                                    title="Encaisser au guichet"
                                    className="p-1 rounded bg-nature-50 text-nature-700 hover:bg-nature-100 border border-nature-200"
                                  >
                                    <CurrencyDollar size={13} weight="bold" />
                                  </Link>
                                  {st.remainingBalance > 0 && (
                                    <a
                                      href={getWhatsAppReminderUrl(st)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Relance WhatsApp parent"
                                      className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                    >
                                      <ChatCircleText size={13} weight="bold" />
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        {/* LIGNE DE TOTAUX DE LA CLASSE */}
                        <tfoot>
                          <tr className="bg-slate-100 font-bold border-t-2 border-black text-[9.5px]">
                            <td colSpan={3} className="p-2 border border-black uppercase text-right">
                              TOTAUX CLASSE ({group.name}) : {group.students.length} élève(s)
                            </td>
                            <td className="p-2 border border-black text-right font-mono">
                              {grpExpected.toLocaleString('fr-FR')} F
                            </td>
                            <td className="p-2 border border-black text-right font-mono text-emerald-800">
                              {grpPaid.toLocaleString('fr-FR')} F
                            </td>
                            <td className="p-2 border border-black text-right font-mono font-black text-rose-700 bg-rose-50/60">
                              {grpRemaining.toLocaleString('fr-FR')} F
                            </td>
                            <td colSpan={3} className="p-2 border border-black text-[8.5px] italic text-slate-600">
                              Taux de recouvrement : {grpRate}%
                            </td>
                            <td className="border border-black print:hidden"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* GUIDE D'ÉMARGEMENT & SIGNATURES EN BAS DE PAGE */}
                    <div className="mt-4 pt-3 border-t-2 border-black text-[9px] flex justify-between items-start gap-4">
                      <div className="w-1/2">
                        <div className="font-bold uppercase tracking-wider mb-1">Légende des annotations en classe :</div>
                        <div className="space-y-0.5 text-slate-700 italic">
                          <div>• <strong>R</strong> : Reçu déjà payé présenté par l&apos;élève.</div>
                          <div>• <strong>M-[date]</strong> : Moratoire / Engagement du parent jusqu&apos;à la date indiquée.</div>
                          <div>• <strong>C-[date]</strong> : Convocation remise à l&apos;élève pour les parents.</div>
                          <div>• <strong>E</strong> : Exclusion temporaire de cours jusqu&apos;à régularisation à la caisse.</div>
                        </div>
                      </div>

                      <div className="w-1/2 flex justify-between text-center pt-1">
                        <div>
                          <div className="font-bold">Le Surveillant / Contrôleur</div>
                          <div className="h-10"></div>
                          <div className="text-[8px] text-slate-500 uppercase tracking-widest">(Visa & Date)</div>
                        </div>

                        <div>
                          <div className="font-bold">L&apos;Intendant / Comptable</div>
                          <div className="h-10"></div>
                          <div className="text-[8px] text-slate-500 uppercase tracking-widest">(Visa Caisse)</div>
                        </div>
                      </div>
                    </div>

                    {/* PIED DE PAGE AUTHENTICITÉ */}
                    <div className="mt-3 pt-1 border-t border-slate-300 flex justify-between items-center text-[8px] text-slate-500">
                      <span className="font-mono">
                        Document officiel kalansso os • Fiche {groupIdx + 1} sur {classesGroups.length}
                      </span>
                      <span>Conforme aux normes de gestion des établissements MENAPLN Burkina Faso</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* RÈGLES STRICTES D'IMPRESSION A4 PORTRAIT & SAUT DE PAGE MULTI-CLASSES */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-tour-container,
          #printable-tour-container * {
            visibility: visible !important;
          }
          html, body {
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-tour-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-class-sheet {
            width: 210mm !important;
            min-height: 297mm !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 10mm 12mm !important;
            page-break-after: always !important;
            break-after: page !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-class-sheet:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function ClassFinanceSheetPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Chargement de la fiche de classe...</div>}>
      <ClassSheetContent />
    </Suspense>
  );
}
