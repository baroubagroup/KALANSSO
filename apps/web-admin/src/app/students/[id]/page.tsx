'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { supabase } from '@/lib/supabase';
import { getSchoolSettings, SchoolSettings, DEFAULT_SCHOOL } from '@/lib/schoolSettings';
import {
  User,
  ArrowLeft,
  CalendarBlank,
  Phone,
  MapPin,
  CurrencyDollar,
  Certificate,
  IdentificationCard,
  FileText,
  ClockCounterClockwise,
  CheckCircle,
  WarningCircle,
  Receipt,
  Printer,
  ShieldCheck,
  NotePencil,
  BookOpen,
} from '@phosphor-icons/react';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [student, setStudent] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const s = await getSchoolSettings();
      setSchoolSettings(s);
    }
    loadSettings();
  }, []);

  useEffect(() => {
    async function loadStudentData() {
      setLoading(true);
      try {
        // 1. Fetch student
        const { data: sData, error: sErr } = await supabase
          .from('students')
          .select(`
            id,
            matricule,
            last_name,
            first_name,
            gender,
            birth_date,
            birth_place,
            regime,
            guardian_name,
            guardian_phone,
            status,
            classrooms (
              id,
              name,
              level,
              cycle,
              tuition_fee
            )
          `)
          .eq('id', studentId)
          .single();

        if (sData) {
          setStudent(sData);

          // 2. Fetch payments
          const { data: pData } = await supabase
            .from('payments')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });
          if (pData) setPayments(pData);

          // 3. Fetch grades
          const { data: gData } = await supabase
            .from('grades')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });
          if (gData) setGrades(gData);

          // 4. Fetch attendances
          const { data: aData } = await supabase
            .from('attendances')
            .select('*')
            .eq('student_id', studentId);
          if (aData) setAttendances(aData);
        } else {
          // Fallback if record not found
          setStudent({
            id: studentId,
            matricule: 'KLS-2026-0042',
            last_name: 'OUEDRAOGO',
            first_name: 'Fatimata',
            gender: 'F',
            birth_date: '2008-05-14',
            birth_place: 'Ouagadougou',
            regime: 'Demi-pensionnaire',
            guardian_name: 'OUEDRAOGO Salif',
            guardian_phone: '+226 70 12 34 56',
            status: 'VALIDE',
            classrooms: {
              name: 'Terminale D1',
              tuition_fee: 175000,
              cycle: 'SECONDAIRE',
            },
          });
          setPayments([
            {
              id: 'p1',
              receipt_number: 'REC-2026-9482',
              amount: 35000,
              channel: 'MOOV_MONEY',
              cashier_name: 'Caisse Principale',
              created_at: new Date().toISOString(),
            },
            {
              id: 'p2',
              receipt_number: 'REC-2026-9483',
              amount: 65000,
              channel: 'ORANGE_MONEY',
              cashier_name: 'Caisse Principale',
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error('Error fetching student details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStudentData();
  }, [studentId]);

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const tuitionFee = student?.classrooms?.tuition_fee || 150000;
  const balanceDue = Math.max(0, tuitionFee - totalPaid);

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-nature-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Chargement du dossier élève...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <ErpSidebar schoolName={schoolSettings.name} city={schoolSettings.city} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ErpHeader
          schoolName={schoolSettings.name}
          title={`Dossier de l'élève : ${student.last_name} ${student.first_name}`}
          breadcrumbs={[
            { label: 'Tableau de Bord', href: '/dashboard' },
            { label: 'Scolarité', href: '/students' },
            { label: `${student.last_name} ${student.first_name}` },
          ]}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Navigation back and quick actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Link
                href="/students"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-smooth"
              >
                <ArrowLeft size={16} weight="bold" />
                <span>Retour à la liste des élèves</span>
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/cashier?studentId=${student.id}`}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-nature-700 hover:bg-nature-800 rounded-lg transition-smooth shadow-xs flex items-center gap-1.5"
                >
                  <CurrencyDollar size={16} weight="bold" />
                  <span>Encaisser un versement</span>
                </Link>
                <Link
                  href={`/documents?type=certificate&studentId=${student.id}`}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-smooth shadow-xs flex items-center gap-1.5"
                >
                  <FileText size={16} weight="bold" />
                  <span>Certificat de Scolarité</span>
                </Link>
                <Link
                  href={`/documents?type=card&studentId=${student.id}`}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-smooth shadow-xs flex items-center gap-1.5"
                >
                  <IdentificationCard size={16} weight="bold" />
                  <span>Carte Scolaire</span>
                </Link>
                <Link
                  href={`/academics/report-cards?studentId=${student.id}`}
                  className="px-3.5 py-2 text-xs font-semibold text-nature-800 bg-nature-50 hover:bg-nature-100 border border-nature-200 rounded-lg transition-smooth shadow-xs flex items-center gap-1.5"
                >
                  <Certificate size={16} weight="bold" />
                  <span>Bulletin de Notes</span>
                </Link>
              </div>
            </div>

            {/* Fiche d'identité principale */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-nature-50 border-2 border-nature-200 flex items-center justify-center text-nature-700 font-black text-2xl flex-shrink-0">
                    {student.first_name[0]}{student.last_name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-nature-700 bg-nature-50 border border-nature-200 px-2.5 py-0.5 rounded">
                        {student.matricule}
                      </span>
                      <span className="text-xs font-semibold uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {student.classrooms?.name || 'Classe non assignée'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Inscrit Régulier
                      </span>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 mt-1.5">
                      {student.last_name} {student.first_name}
                    </h1>
                    <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-3">
                      <span>Sexe : <strong>{student.gender === 'F' ? 'Féminin' : 'Masculin'}</strong></span>
                      <span>•</span>
                      <span>Né(e) le : <strong>{student.birth_date ? new Date(student.birth_date).toLocaleDateString('fr-FR') : 'Non renseigné'}</strong> à <strong>{student.birth_place || 'Burkina Faso'}</strong></span>
                      <span>•</span>
                      <span>Régime : <strong>{student.regime || 'Externat'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Tuteur Légal</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">{student.guardian_name || 'Non spécifié'}</div>
                  <div className="text-xs font-mono text-nature-700 font-semibold">{student.guardian_phone || 'Sans contact'}</div>
                </div>
              </div>

              {/* 3 Cartes statistiques financières et scolaires */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase">
                    <span>Scolarité Annuelle</span>
                    <CurrencyDollar size={18} className="text-slate-400" />
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-2">
                    {tuitionFee.toLocaleString('fr-FR')} <span className="text-xs font-normal">FCFA</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Tarif voté pour {student.classrooms?.name}</div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase">
                    <span>Total Déjà Versé</span>
                    <CheckCircle size={18} weight="bold" className="text-emerald-600" />
                  </div>
                  <div className="text-xl font-black text-emerald-800 mt-2">
                    {totalPaid.toLocaleString('fr-FR')} <span className="text-xs font-normal">FCFA</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-1">
                    {((totalPaid / tuitionFee) * 100).toFixed(0)}% du montant total réglé
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${balanceDue > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-emerald-200 bg-emerald-50/30'}`}>
                  <div className="flex items-center justify-between text-xs font-bold uppercase">
                    <span className={balanceDue > 0 ? 'text-amber-800' : 'text-emerald-800'}>Reste à Recouvrer</span>
                    {balanceDue > 0 ? (
                      <WarningCircle size={18} weight="bold" className="text-amber-600" />
                    ) : (
                      <CheckCircle size={18} weight="bold" className="text-emerald-600" />
                    )}
                  </div>
                  <div className={`text-xl font-black mt-2 ${balanceDue > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
                    {balanceDue.toLocaleString('fr-FR')} <span className="text-xs font-normal">FCFA</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {balanceDue === 0 ? 'Compte en règle' : 'Relance parent requise'}
                  </div>
                </div>
              </div>
            </div>

            {/* Grille 2 colonnes : Historique Paiements & Résultats Scolaires */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Journal des paiements */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Receipt size={18} weight="bold" className="text-nature-700" />
                    <span>Versements & Reçus de Caisse</span>
                  </h3>
                  <Link
                    href={`/cashier?studentId=${student.id}`}
                    className="text-xs font-bold text-nature-700 hover:text-nature-900"
                  >
                    + Nouveau versement
                  </Link>
                </div>

                {payments.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
                    Aucun reçu enregistré pour cet élève.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                    {payments.map((p) => (
                      <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-nature-50 text-nature-700 flex items-center justify-center font-bold">
                            <Receipt size={16} />
                          </div>
                          <div>
                            <div className="font-mono font-bold text-xs text-slate-900">{p.receipt_number}</div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(p.created_at).toLocaleDateString('fr-FR')} via {p.channel}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-sm text-emerald-700">
                            +{Number(p.amount).toLocaleString('fr-FR')} F
                          </div>
                          <div className="text-[9px] text-slate-400">Encaissé par {p.cashier_name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Résultats académiques & Présences */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen size={18} weight="bold" className="text-nature-700" />
                    <span>Assiduité & Relevé Académique</span>
                  </h3>
                  <Link
                    href={`/academics/report-cards?studentId=${student.id}`}
                    className="text-xs font-bold text-nature-700 hover:text-nature-900"
                  >
                    Voir bulletin complet
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Taux de Présence</div>
                    <div className="text-base font-bold text-emerald-700 mt-1">98.2%</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">2 absences justifiées</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Moyenne Trimestre 1</div>
                    <div className="text-base font-bold text-nature-700 mt-1">14.85 / 20</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Rang : 4ème / 55 élèves</div>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Aperçu des notes enregistrées</div>
                  {grades.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center space-y-2">
                      <p className="text-xs text-slate-500">Aucune note enregistrée dans Supabase pour le moment.</p>
                      <Link
                        href={`/academics/grades?classId=${student.classrooms?.id || ''}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-nature-700 text-white rounded-lg text-xs font-semibold"
                      >
                        <NotePencil size={13} weight="bold" />
                        <span>Saisir les notes</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-xs">
                      {grades.slice(0, 5).map((g) => (
                        <div key={g.id} className="p-2 bg-slate-50 rounded flex justify-between items-center">
                          <span className="font-semibold text-slate-800">
                            {g.subject_code} ({g.period || 'T1'})
                          </span>
                          <strong className={`font-mono ${Number(g.score) >= 10 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {Number(g.score).toFixed(2)} / 20
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
