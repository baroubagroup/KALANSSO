'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { supabase } from '@/lib/supabase';
import { getSchoolSettings, SchoolSettings, DEFAULT_SCHOOL } from '@/lib/schoolSettings';
import {
  CurrencyDollar,
  TrendUp,
  Receipt,
  DeviceMobile,
  Money,
  ArrowRight,
  ShieldCheck,
  ChartPieSlice,
  CreditCard,
  Printer,
  CalendarBlank,
  FileText,
} from '@phosphor-icons/react';

function fmtShort(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M';
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + ' K';
  return String(n);
}

export default function FinanceHubPage() {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [liveStudentsCount, setLiveStudentsCount] = useState<number>(14);
  const [liveCollected, setLiveCollected] = useState<number>(165000);
  const [paymentsCount, setPaymentsCount] = useState<number>(3);

  useEffect(() => {
    async function loadFinance() {
      const s = await getSchoolSettings();
      setSchoolSettings(s);

      try {
        const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
        if (sCount !== null) setLiveStudentsCount(sCount);

        const { data: pRows, count: pCount } = await supabase.from('payments').select('amount', { count: 'exact' });
        if (pRows) {
          const sum = pRows.reduce((acc, p) => acc + Number(p.amount || 0), 0);
          setLiveCollected(sum);
        }
        if (pCount !== null) setPaymentsCount(pCount);
      } catch (e) {
        console.error(e);
      }
    }
    loadFinance();
  }, []);

  const stats = [
    { label: 'Élèves à Recouvrer', value: `${liveStudentsCount} élèves`, sub: 'Effectifs réels en base', color: 'text-slate-900' },
    { label: 'Recouvrement Encaissé', value: fmtShort(liveCollected) + ' FCFA', sub: 'Paiements enregistrés', color: 'text-emerald-700' },
    { label: 'Reçus de Caisse Émis', value: `${paymentsCount} reçus`, sub: 'Journal certifié en temps réel', color: 'text-nature-700' },
    { label: 'Modes d’Encaissement', value: '3 canaux', sub: 'Moov · Orange · Espèces', color: 'text-blue-700' },
  ];

  const modules = [
    {
      title: 'Guichet Caisse Express (< 15s)',
      sub: 'Encaissement rapide au comptoir, push USSD Moov/Orange Money et impression des reçus thermiques.',
      href: '/cashier',
      icon: <Receipt size={24} weight="bold" className="text-nature-700" />,
      cta: 'Ouvrir le guichet de caisse',
      badge: 'Haute cadence',
    },
    {
      title: 'Échéanciers & Relances (3 Tranches)',
      sub: 'Découpage officiel en 3 tranches, relances WhatsApp en 1 clic et lettres officielles de mise en demeure A4.',
      href: '/finance/schedule',
      icon: <CalendarBlank size={24} weight="bold" className="text-amber-700" />,
      cta: 'Gérer les échéanciers',
      badge: '3 Tranches',
    },
    {
      title: 'Fiche de Contrôle en Classe (A4 Émargement)',
      sub: 'Générez et imprimez par classe (ex: 6ème A, 3ème) la fiche des élèves en retard avec contacts parents et colonne d’émargement pour la visite.',
      href: '/finance/class-sheet',
      icon: <FileText size={24} weight="bold" className="text-purple-700" />,
      cta: 'Générer la fiche par classe',
      badge: 'Contrôle Terrain',
    },
    {
      title: 'Rapports Financiers & Grand Livre',
      sub: 'Analyse par classe, état des impayés, grand livre comptable et exports Excel.',
      href: '/finance/reports',
      icon: <TrendUp size={24} weight="bold" className="text-emerald-700" />,
      cta: 'Consulter les rapports',
      badge: 'Recouvrement',
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <ErpSidebar schoolName={schoolSettings.name} city={schoolSettings.city} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ErpHeader
          schoolName={schoolSettings.name}
          title="Pôle Finances, Caisse & Recouvrement"
          breadcrumbs={[
            { label: 'Tableau de Bord', href: '/dashboard' },
            { label: 'Finances' },
          ]}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* Header strip */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-nature-700 bg-nature-50 px-2 py-0.5 rounded border border-nature-100">
                  Gestion Financière & Trésorerie
                </span>
                <span className="text-xs text-slate-400">Année Scolaire 2026 – 2027</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">Centre des Opérations Financières</h1>
              <p className="text-xs text-slate-500 mt-0.5">Encaissez au guichet, suivez le recouvrement et auditez les flux de trésorerie.</p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/cashier"
                className="px-4 py-2.5 bg-nature-700 hover:bg-nature-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-smooth flex items-center gap-1.5 cursor-pointer"
              >
                <CurrencyDollar size={15} weight="bold" />
                <span>Nouveau Versement</span>
              </Link>
              <Link
                href="/finance/reports"
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-smooth flex items-center gap-1.5 cursor-pointer"
              >
                <TrendUp size={15} weight="bold" />
                <span>Rapports de Recouvrement</span>
              </Link>
            </div>
          </div>

          {/* 4 Financial KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((st, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">{st.label}</span>
                <div className={`text-2xl font-bold ${st.color} mt-1 leading-none`}>
                  {st.value}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">{st.sub}</p>
              </div>
            ))}
          </div>

          {/* Core modules cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((mod, i) => (
              <Link
                key={i}
                href={mod.href}
                className="group bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-nature-300 hover:shadow-md transition-smooth flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-smooth">
                      {mod.icon}
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-nature-700 bg-nature-50 border border-nature-100 px-2.5 py-1 rounded-md">
                      {mod.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-nature-700 transition-smooth">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {mod.sub}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-nature-700">
                  <span>{mod.cta}</span>
                  <ArrowRight size={14} weight="bold" className="group-hover:translate-x-1 transition-smooth" />
                </div>
              </Link>
            ))}
          </div>

          {/* Mobile Money & Payment Methods Overview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Passerelles d&apos;Encaissement Actives</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <DeviceMobile size={20} weight="bold" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Moov Money</div>
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Push USSD Actif (Sans frais)
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center font-bold">
                  <DeviceMobile size={20} weight="bold" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Orange Money</div>
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Push USSD Actif (Sans frais)
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Money size={20} weight="bold" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Espèces au Guichet</div>
                  <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    Calcul automatique de la monnaie
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
