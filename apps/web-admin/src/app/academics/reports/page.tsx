'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { getSchoolSettings, SchoolSettings, DEFAULT_SCHOOL } from '@/lib/schoolSettings';
import { supabase } from '@/lib/supabase';
import {
  ChartBar,
  Printer,
  Export,
  TrendUp,
  CheckCircle,
  Medal,
  Users,
} from '@phosphor-icons/react';

const SUBJECT_PERFORMANCE = [
  { subject: 'Mathématiques', coef: 5, avg: 13.45, passRate: 78, topScore: 20.0, lowestScore: 5.5, teacher: 'M. ILBOUDO Marc' },
  { subject: 'Physique-Chimie', coef: 5, avg: 14.10, passRate: 82, topScore: 19.5, lowestScore: 6.0, teacher: 'Mme SAWADOGO Patricia' },
  { subject: 'SVT (Sciences)', coef: 5, avg: 14.85, passRate: 88, topScore: 18.5, lowestScore: 8.0, teacher: 'M. TRAORE Adama' },
  { subject: 'Français', coef: 3, avg: 12.30, passRate: 72, topScore: 17.0, lowestScore: 7.0, teacher: 'Mme KABORE Salimata' },
  { subject: 'Histoire-Géo', coef: 2, avg: 15.20, passRate: 92, topScore: 19.0, lowestScore: 9.5, teacher: 'M. DIALLO Oumar' },
  { subject: 'Philosophie', coef: 2, avg: 13.80, passRate: 80, topScore: 16.5, lowestScore: 8.0, teacher: 'M. OUATTARA Salif' },
  { subject: 'Anglais', coef: 2, avg: 14.50, passRate: 85, topScore: 18.0, lowestScore: 8.5, teacher: 'M. COMPAORE Paul' },
  { subject: 'EPS (Sport)', coef: 2, avg: 17.20, passRate: 98, topScore: 20.0, lowestScore: 12.0, teacher: 'M. ZONGO Eric' },
];

export default function AcademicReportsPage() {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [classList, setClassList] = useState<string[]>([
    'Terminale D (Candidats BAC D)',
    '3ème (Candidats Examen BEPC)',
    '6ème',
    'CM2 (Candidats Examen CEP)',
  ]);
  const [selectedClass, setSelectedClass] = useState('Terminale D (Candidats BAC D)');

  useEffect(() => {
    async function load() {
      const s = await getSchoolSettings();
      setSchoolSettings(s);

      try {
        const { data: clsData } = await supabase.from('classrooms').select('name').order('name');
        if (clsData && clsData.length > 0) {
          const names = clsData.map((c) => c.name);
          setClassList(names);
          setSelectedClass(names[0]);
        }
      } catch {}
    }
    load();
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <ErpSidebar schoolName={schoolSettings.name} city={schoolSettings.city} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ErpHeader
          schoolName={schoolSettings.name}
          title="Rapports Pédagogiques & Statistiques"
          breadcrumbs={[
            { label: 'Tableau de Bord', href: '/dashboard' },
            { label: 'Pédagogie & Évaluations', href: '/academics/grades' },
            { label: 'Rapports Pédagogiques' },
          ]}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-nature-700 bg-nature-50 px-2 py-0.5 rounded border border-nature-100">
                  Analytique Pédagogique
                </span>
                <span className="text-xs text-slate-400">Évaluation des performances par discipline</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">Bilan Trimestriel par Matière & Enseignant</h1>
              <p className="text-xs text-slate-500 mt-0.5">Taux de réussite, moyennes générales et repérage des élèves en difficulté.</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none cursor-pointer"
              >
                {classList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-smooth flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimer Bilan</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Moyenne Générale</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">14.46 / 20</span>
              <span className="text-[11px] text-emerald-600 font-semibold">+0.6 pt vs Trimestre 1</span>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Taux Réussite Global</span>
              <span className="text-2xl font-bold text-emerald-700 mt-1 block">84.2%</span>
              <span className="text-[11px] text-slate-500">Moyenne &gt;= 10/20</span>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Discipline Phare</span>
              <span className="text-xl font-bold text-nature-700 mt-1 block">Histoire-Géo</span>
              <span className="text-[11px] text-slate-500">92% de copies admises</span>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Discipline à Renforcer</span>
              <span className="text-xl font-bold text-amber-600 mt-1 block">Français</span>
              <span className="text-[11px] text-slate-500">72% de copies admises</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-bold text-[10px] tracking-wider text-left">
                    <th className="px-4 py-3">Matière</th>
                    <th className="px-4 py-3 text-center">Coef</th>
                    <th className="px-4 py-3 text-left">Enseignant Responsable</th>
                    <th className="px-4 py-3 text-center">Moyenne Classe</th>
                    <th className="px-4 py-3 text-center">Plus Forte</th>
                    <th className="px-4 py-3 text-center">Plus Faible</th>
                    <th className="px-4 py-3 text-center w-36">Taux de Réussite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SUBJECT_PERFORMANCE.map((sub, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-smooth">
                      <td className="px-4 py-3 font-semibold text-slate-900">{sub.subject}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{sub.coef}</td>
                      <td className="px-4 py-3 text-slate-600">{sub.teacher}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-900 text-sm">
                        {sub.avg.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-emerald-700 font-semibold">{sub.topScore.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center font-mono text-red-600 font-semibold">{sub.lowestScore.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full rounded-full ${sub.passRate >= 80 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                              style={{ width: `${sub.passRate}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px] text-slate-800">{sub.passRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
