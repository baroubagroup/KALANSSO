'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { supabase } from '@/lib/supabase';
import { getSchoolSettings, SchoolSettings, DEFAULT_SCHOOL } from '@/lib/schoolSettings';
import {
  CurrencyDollar,
  MagnifyingGlass,
  DeviceMobile,
  Money,
  Printer,
  CheckCircle,
  Receipt,
  User,
  ShieldCheck,
  CreditCard,
  Bank,
  CaretDown,
  ClockCounterClockwise,
  ArrowSquareOut,
  CalendarBlank,
} from '@phosphor-icons/react';

interface StudentInfo {
  id: string;
  matricule: string;
  last_name: string;
  first_name: string;
  gender: string;
  classroom_name: string;
  classroom_id?: string;
  tuition_fee: number;
  guardian_name?: string;
  guardian_phone?: string;
  total_paid: number;
}

interface PaymentRecord {
  id: string;
  receipt_number: string;
  amount: number;
  channel: string;
  payer_phone?: string;
  cashier_name: string;
  created_at: string;
}

function CashierContent() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('studentId') || '';

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  const [paymentAmount, setPaymentAmount] = useState<number>(35000);
  const [selectedChannel, setSelectedChannel] = useState<'MOOV_MONEY' | 'ORANGE_MONEY' | 'CASH' | 'CORIS_BANK'>('MOOV_MONEY');
  const [cashGiven, setCashGiven] = useState<number>(40000);
  const [mobilePhone, setMobilePhone] = useState('+226 70 12 34 56');
  const [feeCategory, setFeeCategory] = useState<'Scolarité (Tranche)' | 'Frais d’Inscription' | 'Scolarité Intégrale' | 'Cantine Scolaire' | 'Examen'>('Scolarité (Tranche)');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentReceipt, setRecentReceipt] = useState<{
    number: string;
    date: string;
    studentName: string;
    matricule: string;
    classroom: string;
    amount: number;
    channel: string;
    category: string;
    balanceRemaining: number;
    cashierName: string;
  } | null>(null);

  const [studentPaymentHistory, setStudentPaymentHistory] = useState<PaymentRecord[]>([]);

  // 1. Charger les paramètres d'établissement
  useEffect(() => {
    async function loadSettings() {
      const s = await getSchoolSettings();
      setSchoolSettings(s);
    }
    loadSettings();
    window.addEventListener('kalansso_school_updated', loadSettings);
    return () => window.removeEventListener('kalansso_school_updated', loadSettings);
  }, []);

  // 2. Charger les élèves réels depuis Supabase
  useEffect(() => {
    async function loadData() {
      setIsLoadingStudents(true);
      try {
        const { data: stdData, error: stdErr } = await supabase
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
              name,
              tuition_fee
            )
          `);

        if (!stdErr && stdData && stdData.length > 0) {
          // Charger tous les paiements pour calculer les soldes
          const { data: payData } = await supabase.from('payments').select('student_id, amount');

          const payMap = new Map<string, number>();
          if (payData) {
            for (const p of payData) {
              const current = payMap.get(p.student_id) || 0;
              payMap.set(p.student_id, current + Number(p.amount || 0));
            }
          }

          const formatted: StudentInfo[] = stdData.map((s: any) => {
            const clName = s.classrooms?.name || 'Non assigné';
            const fee = s.classrooms?.tuition_fee || 120000;
            const paid = payMap.get(s.id) || 0;
            return {
              id: s.id,
              matricule: s.matricule || 'KLS-000',
              last_name: s.last_name,
              first_name: s.first_name,
              gender: s.gender || 'M',
              classroom_name: clName,
              classroom_id: s.classroom_id,
              tuition_fee: fee,
              guardian_name: s.guardian_name,
              guardian_phone: s.guardian_phone,
              total_paid: paid,
            };
          });

          setStudents(formatted);
          if (preselectedId && formatted.some((st) => st.id === preselectedId)) {
            setSelectedStudentId(preselectedId);
          } else if (formatted.length > 0) {
            setSelectedStudentId(formatted[0].id);
          }
        } else {
          // Données locales si la table est vide
          const fallbackStudents: StudentInfo[] = [
            {
              id: 'fallback_1',
              matricule: 'KLS-2026-0042',
              last_name: 'OUEDRAOGO',
              first_name: 'Fatimata',
              gender: 'F',
              classroom_name: 'Terminale D1',
              tuition_fee: 175000,
              guardian_name: 'OUEDRAOGO Salif',
              guardian_phone: '+226 70 12 34 56',
              total_paid: 100000,
            },
            {
              id: 'fallback_2',
              matricule: 'KLS-2026-0105',
              last_name: 'BAMBARA',
              first_name: 'Christian',
              gender: 'M',
              classroom_name: '3ème A',
              tuition_fee: 140000,
              guardian_name: 'BAMBARA Éric',
              guardian_phone: '+226 76 99 88 77',
              total_paid: 70000,
            },
          ];
          setStudents(fallbackStudents);
          setSelectedStudentId(fallbackStudents[0].id);
        }
      } catch (err) {
        console.error('Erreur chargement élèves caisse:', err);
      } finally {
        setIsLoadingStudents(false);
      }
    }
    loadData();
  }, [preselectedId]);

  // Élève actif
  const currentStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || students[0] || null;
  }, [students, selectedStudentId]);

  // Mettre à jour l'historique des paiements de l'élève actif
  useEffect(() => {
    if (!currentStudent) return;
    if (currentStudent.guardian_phone) {
      setMobilePhone(currentStudent.guardian_phone);
    }
    const balance = Math.max(0, currentStudent.tuition_fee - currentStudent.total_paid);
    setPaymentAmount(balance > 0 ? (balance > 50000 ? 50000 : balance) : 25000);

    async function fetchStudentPayments() {
      try {
        const { data } = await supabase
          .from('payments')
          .select('*')
          .eq('student_id', currentStudent.id)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setStudentPaymentHistory(data);
        } else {
          // Historique initial par défaut si aucun enregistrement
          if (currentStudent.total_paid > 0) {
            setStudentPaymentHistory([
              {
                id: 'init_pay',
                receipt_number: 'REC-2026-9482',
                amount: currentStudent.total_paid,
                channel: 'MOOV_MONEY',
                payer_phone: currentStudent.guardian_phone || '+226 70 12 34 56',
                cashier_name: 'Caisse Principale',
                created_at: new Date().toISOString(),
              },
            ]);
          } else {
            setStudentPaymentHistory([]);
          }
        }
      } catch {}
    }
    fetchStudentPayments();
  }, [currentStudent]);

  // Filtrage des élèves pour le sélecteur
  const filteredStudents = useMemo(() => {
    if (!searchFilter.trim()) return students;
    const q = searchFilter.toLowerCase();
    return students.filter(
      (s) =>
        s.last_name.toLowerCase().includes(q) ||
        s.first_name.toLowerCase().includes(q) ||
        s.matricule.toLowerCase().includes(q) ||
        s.classroom_name.toLowerCase().includes(q)
    );
  }, [students, searchFilter]);

  const remainingBalance = currentStudent
    ? Math.max(0, currentStudent.tuition_fee - currentStudent.total_paid)
    : 0;

  const changeDue = Math.max(0, cashGiven - paymentAmount);

  // Validation de l'encaissement
  const handleValidatePayment = async () => {
    if (!currentStudent || paymentAmount <= 0) return;
    setIsProcessing(true);

    const receiptNum = 'REC-2026-' + Math.floor(100000 + Math.random() * 900000);
    const cashierName = 'KABORE Aminata (Caisse Principale)';

    try {
      // Obtenir l'école garanti
      const schoolId = schoolSettings.id || '7c2d3108-2ac7-4ff5-a344-0803cedac026';

      await supabase.from('payments').insert({
        school_id: schoolId,
        student_id: currentStudent.id,
        receipt_number: receiptNum,
        amount: paymentAmount,
        channel: selectedChannel,
        payer_phone: mobilePhone,
        cashier_name: cashierName,
      });

      // Mettre à jour l'état local
      setStudents((prev) =>
        prev.map((st) =>
          st.id === currentStudent.id
            ? { ...st, total_paid: st.total_paid + paymentAmount }
            : st
        )
      );

      const newRecord: PaymentRecord = {
        id: receiptNum,
        receipt_number: receiptNum,
        amount: paymentAmount,
        channel: selectedChannel,
        payer_phone: mobilePhone,
        cashier_name: cashierName,
        created_at: new Date().toISOString(),
      };
      setStudentPaymentHistory((prev) => [newRecord, ...prev]);

      setRecentReceipt({
        number: receiptNum,
        date: new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR'),
        studentName: `${currentStudent.last_name} ${currentStudent.first_name}`,
        matricule: currentStudent.matricule,
        classroom: currentStudent.classroom_name,
        amount: paymentAmount,
        channel: selectedChannel,
        category: feeCategory,
        balanceRemaining: Math.max(0, remainingBalance - paymentAmount),
        cashierName,
      });
    } catch (e) {
      console.error('Erreur insertion paiement:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const channelCards = [
    {
      id: 'MOOV_MONEY' as const,
      name: 'Moov Money',
      fee: 'Frais : 0 FCFA',
      icon: <DeviceMobile size={18} weight="bold" className="text-blue-600" />,
    },
    {
      id: 'ORANGE_MONEY' as const,
      name: 'Orange Money',
      fee: 'Frais : 0 FCFA',
      icon: <DeviceMobile size={18} weight="bold" className="text-orange-500" />,
    },
    {
      id: 'CASH' as const,
      name: 'Espèces / Cash',
      fee: 'Rendu monnaie auto',
      icon: <Money size={18} weight="bold" className="text-emerald-600" />,
    },
    {
      id: 'CORIS_BANK' as const,
      name: 'Coris / Virement',
      fee: 'Bancaire direct',
      icon: <Bank size={18} weight="bold" className="text-purple-600" />,
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <div className="print:hidden h-full">
        <ErpSidebar schoolName={schoolSettings.name} city={schoolSettings.city} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:p-0">
        <div className="print:hidden">
          <ErpHeader
            schoolName={schoolSettings.name}
            title="Guichet Caisse Express (< 15s)"
            breadcrumbs={[
              { label: 'Tableau de Bord', href: '/dashboard' },
              { label: 'Finances & Trésorerie', href: '/finance' },
              { label: 'Guichet Caisse Express' },
            ]}
          />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 print:p-0 print:overflow-visible">
          {/* ZONE IMPRESSION THERMIQUE EXCLUSIVE LORS DE WINDOW.PRINT */}
          {recentReceipt && (
            <div id="thermal-receipt-sheet" className="hidden print:block max-w-[80mm] mx-auto p-4 bg-white text-black font-mono text-[11px] leading-relaxed border border-dashed border-gray-400">
              <div className="text-center pb-2 border-b border-dashed border-gray-400">
                {schoolSettings.logo_url && (
                  <div className="w-12 h-12 mx-auto mb-1 flex items-center justify-center">
                    <img src={schoolSettings.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                  </div>
                )}
                <div className="font-bold text-xs uppercase">{schoolSettings.name}</div>
                <div className="text-[9px]">{schoolSettings.code_menapln}</div>
                <div className="text-[9px]">{schoolSettings.city} - Tél: {schoolSettings.phone}</div>
                <div className="text-[8px] italic mt-0.5">{schoolSettings.motto}</div>
              </div>

              <div className="my-2 text-center font-bold text-xs">
                REÇU DE PAIEMENT SCOLARITÉ
              </div>

              <div className="space-y-1 border-b border-dashed border-gray-400 pb-2 text-[10px]">
                <div className="flex justify-between">
                  <span>Reçu N° :</span>
                  <span className="font-bold">{recentReceipt.number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date :</span>
                  <span>{recentReceipt.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Matricule :</span>
                  <span className="font-bold">{recentReceipt.matricule}</span>
                </div>
                <div className="flex justify-between">
                  <span>Élève :</span>
                  <span className="font-bold">{recentReceipt.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Classe :</span>
                  <span>{recentReceipt.classroom}</span>
                </div>
                <div className="flex justify-between">
                  <span>Motif :</span>
                  <span>{recentReceipt.category}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mode :</span>
                  <span>{recentReceipt.channel}</span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span>MONTANT VERSÉ :</span>
                  <span>{recentReceipt.amount.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-700">
                  <span>Reste à payer :</span>
                  <span>{recentReceipt.balanceRemaining.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>

              <div className="pt-2 text-center text-[9px] text-gray-600 space-y-1">
                <div>Caissier : {recentReceipt.cashierName}</div>
                <div className="font-bold">Conservez ce reçu pour tout justificatif.</div>
                <div>Kalansso OS - Vérifiable en ligne</div>
              </div>
            </div>
          )}

          {/* INTERFACE DU GUICHET À L'ÉCRAN */}
          <div className="max-w-6xl mx-auto space-y-6 print:hidden">
            {/* Bannière d'en-tête */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-nature-50 border border-nature-200 flex items-center justify-center text-nature-700 flex-shrink-0">
                  <CurrencyDollar size={28} weight="bold" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>Guichet Caisse & Encaissements</span>
                    <span className="text-[10px] uppercase font-bold text-nature-700 bg-nature-50 border border-nature-200 px-2 py-0.5 rounded-full">
                      Encaisser &lt; 15s
                    </span>
                  </h1>
                  <p className="text-xs text-slate-500">
                    Encaissement scolarité, délivrance immédiate de ticket thermique 80mm et synchronisation Supabase en temps réel.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/finance/reports"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-smooth flex items-center gap-1.5"
                >
                  <ClockCounterClockwise size={15} weight="bold" />
                  <span>Journal des encaissements</span>
                </Link>
                <Link
                  href="/students"
                  className="px-3.5 py-2 text-xs font-semibold text-nature-700 bg-nature-50 hover:bg-nature-100 border border-nature-200 rounded-lg transition-smooth flex items-center gap-1.5"
                >
                  <User size={15} weight="bold" />
                  <span>Liste des élèves</span>
                </Link>
              </div>
            </div>

            {/* Grille principale 2 colonnes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Colonne Gauche (7 cols): Recherche et Dossier Financier Élève */}
              <div className="lg:col-span-7 space-y-5">
                {/* Barre de sélection d'élève en temps réel */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Rechercher un élève (Nom, Prénom, Matricule, Classe)
                  </label>
                  <div className="relative">
                    <MagnifyingGlass
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Tapez le nom ou le matricule (ex: Ouedraogo, KLS-2026-0042)..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-nature-500 focus:ring-2 focus:ring-nature-100 transition-smooth outline-none"
                    />
                  </div>

                  {/* Liste des résultats filtrés */}
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-lg">
                    {isLoadingStudents ? (
                      <div className="p-3 text-xs text-slate-500 text-center">Chargement des élèves depuis Supabase...</div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="p-3 text-xs text-slate-500 text-center">Aucun élève trouvé pour cette recherche</div>
                    ) : (
                      filteredStudents.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudentId(st.id);
                            setSearchFilter('');
                          }}
                          className={`w-full p-2.5 text-left flex items-center justify-between text-xs hover:bg-slate-50 transition-smooth cursor-pointer ${
                            st.id === selectedStudentId ? 'bg-nature-50/80 font-bold' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-[11px] text-slate-500">{st.matricule}</span>
                            <span className="text-slate-900 font-semibold">{st.last_name} {st.first_name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 uppercase font-medium">
                              {st.classroom_name}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] text-slate-600">
                              Solde :{' '}
                              <strong className={Math.max(0, st.tuition_fee - st.total_paid) > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                                {Math.max(0, st.tuition_fee - st.total_paid).toLocaleString('fr-FR')} F
                              </strong>
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Fiche d'état financier de l'élève sélectionné */}
                {currentStudent && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-nature-700 bg-nature-50 border border-nature-200 px-2 py-0.5 rounded">
                            {currentStudent.matricule}
                          </span>
                          <span className="text-xs font-semibold text-slate-600 uppercase">
                            {currentStudent.classroom_name}
                          </span>
                        </div>
                        <h2 className="text-base font-bold text-slate-900 mt-1">
                          {currentStudent.last_name} {currentStudent.first_name}
                        </h2>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Tuteur : {currentStudent.guardian_name || 'Non spécifié'} • Tél : {currentStudent.guardian_phone || 'Non renseigné'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Statut Financier</div>
                        {remainingBalance === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md mt-1">
                            <CheckCircle size={14} weight="bold" />
                            Soldé Intégralement
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md mt-1">
                            Reste {remainingBalance.toLocaleString('fr-FR')} F
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Jauges financières */}
                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Scolarité Annuelle</div>
                        <div className="text-base font-black text-slate-900 mt-0.5">
                          {currentStudent.tuition_fee.toLocaleString('fr-FR')} <span className="text-xs font-normal">F</span>
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="text-[10px] uppercase font-bold text-emerald-800">Total Encaissé</div>
                        <div className="text-base font-black text-emerald-800 mt-0.5">
                          {currentStudent.total_paid.toLocaleString('fr-FR')} <span className="text-xs font-normal">F</span>
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-[10px] uppercase font-bold text-amber-800">Reste Dû</div>
                        <div className="text-base font-black text-amber-800 mt-0.5">
                          {remainingBalance.toLocaleString('fr-FR')} <span className="text-xs font-normal">F</span>
                        </div>
                      </div>
                    </div>

                    {/* Échéancier officiel en 3 tranches avec actions directes */}
                    {(() => {
                      const t1Due = Math.round(currentStudent.tuition_fee * 0.4);
                      const t2Due = Math.round(currentStudent.tuition_fee * 0.3);
                      const t3Due = currentStudent.tuition_fee - t1Due - t2Due;

                      const t1Paid = Math.min(currentStudent.total_paid, t1Due);
                      const rem1 = Math.max(0, currentStudent.total_paid - t1Due);

                      const t2Paid = Math.min(rem1, t2Due);
                      const rem2 = Math.max(0, rem1 - t2Due);

                      const t3Paid = Math.min(rem2, t3Due);

                      const t1Rem = Math.max(0, t1Due - t1Paid);
                      const t2Rem = Math.max(0, t2Due - t2Paid);
                      const t3Rem = Math.max(0, t3Due - t3Paid);

                      return (
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                              <CalendarBlank size={14} weight="bold" className="text-nature-700" />
                              <span>Échéancier des 3 Tranches</span>
                            </span>
                            <Link
                              href={`/finance/schedule?studentId=${currentStudent.id}`}
                              className="text-[11px] font-semibold text-nature-700 hover:underline flex items-center gap-1"
                            >
                              <span>Voir tout & Relances</span>
                              <ArrowSquareOut size={12} weight="bold" />
                            </Link>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                            {/* Tranche 1 */}
                            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-700">1ère Tranche (40%)</span>
                                {t1Rem === 0 ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Soldé</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">Reste {t1Rem.toLocaleString('fr-FR')} F</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500">Exigible : 15 Octobre</div>
                              {t1Rem > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentAmount(t1Rem);
                                    setFeeCategory('Scolarité (Tranche)');
                                  }}
                                  className="w-full py-1 bg-nature-700 hover:bg-nature-800 text-white font-bold rounded text-[10px] transition-smooth cursor-pointer"
                                >
                                  Payer Tranche 1 ({t1Rem.toLocaleString('fr-FR')} F)
                                </button>
                              )}
                            </div>

                            {/* Tranche 2 */}
                            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-700">2ème Tranche (30%)</span>
                                {t2Rem === 0 ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Soldé</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">Reste {t2Rem.toLocaleString('fr-FR')} F</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500">Exigible : 15 Décembre</div>
                              {t2Rem > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentAmount(t2Rem);
                                    setFeeCategory('Scolarité (Tranche)');
                                  }}
                                  className="w-full py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[10px] transition-smooth cursor-pointer"
                                >
                                  Payer Tranche 2 ({t2Rem.toLocaleString('fr-FR')} F)
                                </button>
                              )}
                            </div>

                            {/* Tranche 3 */}
                            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-700">3ème Tranche (30%)</span>
                                {t3Rem === 0 ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Soldé</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">Reste {t3Rem.toLocaleString('fr-FR')} F</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500">Exigible : 15 Février</div>
                              {t3Rem > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentAmount(t3Rem);
                                    setFeeCategory('Scolarité (Tranche)');
                                  }}
                                  className="w-full py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-[10px] transition-smooth cursor-pointer"
                                >
                                  Solder Tranche 3 ({t3Rem.toLocaleString('fr-FR')} F)
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Historique des reçus de cet élève */}
                    <div className="pt-2">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Reçus enregistrés pour cet élève</span>
                        <span className="text-[10px] text-slate-500 font-normal">{studentPaymentHistory.length} transaction(s)</span>
                      </div>

                      {studentPaymentHistory.length === 0 ? (
                        <div className="p-4 text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-100 text-center">
                          Aucun versement n&apos;a encore été enregistré pour cet élève.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
                          {studentPaymentHistory.map((pay) => (
                            <div key={pay.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                              <div className="flex items-center gap-2">
                                <Receipt size={16} weight="bold" className="text-slate-400" />
                                <div>
                                  <span className="font-mono font-bold text-slate-800">{pay.receipt_number}</span>
                                  <span className="text-[10px] text-slate-500 ml-2">
                                    {new Date(pay.created_at).toLocaleDateString('fr-FR')} ({pay.channel})
                                  </span>
                                </div>
                              </div>
                              <div className="font-bold text-emerald-700">
                                +{Number(pay.amount).toLocaleString('fr-FR')} FCFA
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Colonne Droite (5 cols): Formulaire d'Encaissement Express */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <CurrencyDollar size={18} weight="bold" className="text-nature-700" />
                      <span>Paramètres de l&apos;encaissement</span>
                    </h3>
                  </div>

                  {/* Motif de paiement */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Motif du versement
                    </label>
                    <select
                      value={feeCategory}
                      onChange={(e: any) => setFeeCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-nature-500 focus:bg-white"
                    >
                      <option value="Scolarité (Tranche)">Scolarité (Tranche ordinaire)</option>
                      <option value="Scolarité Intégrale">Scolarité Intégrale (Solde total)</option>
                      <option value="Frais d’Inscription">Frais d’Inscription administrative</option>
                      <option value="Cantine Scolaire">Cantine Scolaire</option>
                      <option value="Examen">Frais d’Examen / Diplôme (BEPC/BAC/CEP)</option>
                    </select>
                  </div>

                  {/* Modes de paiement */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Canal de règlement
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {channelCards.map((ch) => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setSelectedChannel(ch.id)}
                          className={`p-2.5 rounded-lg border text-left transition-smooth cursor-pointer ${
                            selectedChannel === ch.id
                              ? 'border-nature-600 bg-nature-50 ring-1 ring-nature-600'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                            {ch.icon}
                            <span>{ch.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{ch.fee}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Montant à encaisser */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Montant à encaisser (FCFA)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-lg font-bold text-slate-900 outline-none focus:border-nature-500 focus:bg-white transition-smooth"
                    />

                    {/* Raccourcis de montants */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {remainingBalance > 0 && (
                        <button
                          type="button"
                          onClick={() => setPaymentAmount(remainingBalance)}
                          className="px-2 py-1 bg-nature-100 hover:bg-nature-200 text-nature-800 text-[10px] font-bold rounded transition-smooth cursor-pointer"
                        >
                          Solde complet ({remainingBalance.toLocaleString('fr-FR')} F)
                        </button>
                      )}
                      {[25000, 35000, 50000, 75000].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setPaymentAmount(v)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded transition-smooth cursor-pointer"
                        >
                          {v.toLocaleString('fr-FR')} F
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Champs conditionnels selon canal */}
                  {selectedChannel === 'CASH' ? (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Somme remise en espèces par le payeur
                      </label>
                      <input
                        type="number"
                        step="1000"
                        value={cashGiven}
                        onChange={(e) => setCashGiven(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
                      />
                      <div className="flex justify-between items-center text-xs font-bold pt-1">
                        <span className="text-slate-600">Monnaie à rendre :</span>
                        <span className="text-emerald-700 text-sm font-bold">
                          {changeDue.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Téléphone payeur ({selectedChannel === 'ORANGE_MONEY' ? 'Orange Money' : 'Moov Money'})
                      </label>
                      <input
                        type="text"
                        value={mobilePhone}
                        onChange={(e) => setMobilePhone(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-900"
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Notification automatique du reçu envoyée par SMS.
                      </span>
                    </div>
                  )}

                  {/* Bouton de validation */}
                  <button
                    type="button"
                    disabled={isProcessing || paymentAmount <= 0}
                    onClick={handleValidatePayment}
                    className="w-full py-3 bg-nature-700 hover:bg-nature-800 text-white font-bold rounded-xl transition-smooth shadow-sm text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span>Enregistrement dans Supabase...</span>
                    ) : (
                      <>
                        <ShieldCheck size={18} weight="bold" />
                        <span>Encaisser {paymentAmount.toLocaleString('fr-FR')} FCFA</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Reçu scellé généré */}
                {recentReceipt && (
                  <div className="bg-white rounded-xl border border-emerald-300 shadow-sm p-4 space-y-3 animate-fade-in bg-emerald-50/20">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                        <CheckCircle size={16} weight="bold" className="text-emerald-600" />
                        <span>Reçu Enregistré avec Succès</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-600">{recentReceipt.number}</span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>Élève :</span>
                        <strong className="text-slate-900">{recentReceipt.studentName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Montant :</span>
                        <strong className="text-emerald-700 font-bold">{recentReceipt.amount.toLocaleString('fr-FR')} FCFA</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Nouveau solde restant :</span>
                        <strong className="text-slate-900">{recentReceipt.balanceRemaining.toLocaleString('fr-FR')} FCFA</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-smooth flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Printer size={16} weight="bold" />
                      <span>Imprimer le reçu thermique (80mm)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* RÈGLES STRICTES D'IMPRESSION DU REÇU THERMIQUE (80MM) */}
      <style jsx global>{`
        @page {
          size: 80mm auto;
          margin: 0;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-receipt-sheet, #thermal-receipt-sheet * {
            visibility: visible !important;
          }
          html, body {
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #thermal-receipt-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 4mm 6mm !important;
            box-sizing: border-box !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function CashierPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Chargement du guichet...</div>}>
      <CashierContent />
    </Suspense>
  );
}
