'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { supabase } from '@/lib/supabase';
import {
  Users,
  CurrencyDollar,
  Certificate,
  NotePencil,
  Gear,
  TrendUp,
  ArrowRight,
  Warning,
  Chalkboard,
  CalendarBlank,
  ChartBar,
  UserCircle,
  BookOpen,
  Spinner,
  FileText,
  GraduationCap,
} from '@phosphor-icons/react';

interface ClassroomItem {
  name: string;
  level: string;
  cycle: string;
  capacity: number;
  tuition: number;
}

interface SchoolConfig {
  schoolName: string;
  city: string;
  phone: string;
  motto: string;
  classrooms: ClassroomItem[];
}

const DEFAULT_SCHOOL: SchoolConfig = {
  schoolName: 'Complexe Scolaire Wend-Manegda',
  city: 'Ouagadougou',
  phone: '+226 70 20 30 40',
  motto: 'Discipline · Travail · Succès',
  classrooms: [
    { name: 'CP1 (Cours Préparatoire 1)', level: 'CP1', cycle: 'PRIMAIRE', capacity: 50, tuition: 55000 },
    { name: 'CP2 (Cours Préparatoire 2)', level: 'CP2', cycle: 'PRIMAIRE', capacity: 50, tuition: 55000 },
    { name: 'CE1 (Cours Élémentaire 1)',  level: 'CE1', cycle: 'PRIMAIRE', capacity: 50, tuition: 60000 },
    { name: 'CE2 (Cours Élémentaire 2)',  level: 'CE2', cycle: 'PRIMAIRE', capacity: 50, tuition: 60000 },
    { name: 'CM1 (Cours Moyen 1)',         level: 'CM1', cycle: 'PRIMAIRE', capacity: 50, tuition: 65000 },
    { name: 'CM2 (Candidats Examen CEP)', level: 'CM2', cycle: 'PRIMAIRE', capacity: 50, tuition: 75000 },
    { name: '6ème',                        level: '6ème', cycle: 'COLLEGE', capacity: 55, tuition: 85000 },
    { name: '3ème (Candidats Examen BEPC)', level: '3ème', cycle: 'COLLEGE', capacity: 55, tuition: 110000 },
    { name: 'Terminale D (Candidats BAC D)', level: 'Terminale D', cycle: 'LYCEE', capacity: 50, tuition: 170000 },
  ],
};

function fmt(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

function fmtShort(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M';
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + ' K';
  return String(n);
}

const ERP_MODULES = [
  {
    section: 'Scolarité & Effectifs',
    modules: [
      { title: 'Élèves & Inscriptions',   sub: 'Effectifs & dossiers',         href: '/students',                  icon: <Users size={20} weight="bold" /> },
      { title: 'Classes & Cycles',         sub: 'Gestion des niveaux',  href: '/classes',                   icon: <Chalkboard size={20} weight="bold" /> },
      { title: 'Emplois du Temps',         sub: 'Planning hebdomadaire', href: '/timetable',                icon: <CalendarBlank size={20} weight="bold" /> },
      { title: 'Ressources Humaines',      sub: 'Enseignants & staff',  href: '/hr',                        icon: <UserCircle size={20} weight="bold" /> },
    ],
  },
  {
    section: 'Pédagogie & Évaluations',
    modules: [
      { title: 'Éditeur d’Épreuves',       sub: 'Comme Word · A4 & devoirs', href: '/editor',                   icon: <FileText size={20} weight="bold" /> },
      { title: 'Examens Nationaux',        sub: 'CEP · BEPC · BAC',          href: '/academics/national-exams', icon: <GraduationCap size={20} weight="bold" /> },
      { title: 'Saisie des Notes',         sub: 'Tableur haute cadence', href: '/academics/grades',         icon: <NotePencil size={20} weight="bold" /> },
      { title: 'Bulletins Officiels',      sub: 'Format MENAPLN',        href: '/academics/report-cards',   icon: <Certificate size={20} weight="bold" /> },
      { title: 'Délibérations',            sub: 'Conseils de classe',    href: '/academics/deliberations',  icon: <BookOpen size={20} weight="bold" /> },
      { title: 'Rapports Pédagogiques',   sub: 'Statistiques & rangs',  href: '/academics/reports',        icon: <ChartBar size={20} weight="bold" /> },
    ],
  },
  {
    section: 'Finances & Caisse',
    modules: [
      { title: 'Guichet Caisse Express',  sub: 'Moov · Orange · Cash',  href: '/cashier',                  icon: <CurrencyDollar size={20} weight="bold" /> },
      { title: 'Rapports Financiers',     sub: 'Recettes & impayés',    href: '/finance/reports',           icon: <TrendUp size={20} weight="bold" /> },
    ],
  },
  {
    section: 'Administration',
    modules: [
      { title: 'Paramètres & Logo',        sub: 'Identité & agrément',   href: '/settings',                  icon: <Gear size={20} weight="bold" /> },
    ],
  },
];

export default function DashboardPage() {
  const [school, setSchool] = useState<SchoolConfig>(DEFAULT_SCHOOL);
  const [liveEnrolled, setLiveEnrolled] = useState<number>(14);
  const [liveCollected, setLiveCollected] = useState<number>(165000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Nombre réel d'élèves en base
        const { count } = await supabase.from('students').select('*', { count: 'exact', head: true });
        if (count !== null) setLiveEnrolled(count);

        // 2. Somme réelle des paiements encaissés
        const { data: payRows } = await supabase.from('payments').select('amount');
        if (payRows) {
          const sum = payRows.reduce((acc, p) => acc + Number(p.amount || 0), 0);
          setLiveCollected(sum);
        }

        // 3. Charger l'école et toutes les classes réelles de Supabase
        const { data: schoolRow } = await supabase.from('schools').select('*').limit(1).single();
        const { data: clsRows } = await supabase.from('classrooms').select('*').order('name');

        if (clsRows && clsRows.length > 0) {
          setSchool({
            schoolName: schoolRow?.name || 'Complexe Scolaire Wend-Manegda',
            city: schoolRow?.city || 'Ouagadougou',
            phone: schoolRow?.phone || '+226 70 20 30 40',
            motto: schoolRow?.motto || 'Discipline · Travail · Succès',
            classrooms: clsRows.map((c: any) => ({
              name: c.name,
              level: c.level,
              cycle: c.cycle,
              capacity: c.capacity || 50,
              tuition: Number(c.tuition_fee) || 60000,
            })),
          });
        }
      } catch (e) {
        console.error('Erreur chargement dashboard:', e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const totalCapacity = school.classrooms.reduce((s, c) => s + (c.capacity || 50), 0);
  const totalRevenue  = school.classrooms.reduce((s, c) => s + (c.capacity || 50) * (c.tuition || 60000), 0);
  const displayEnrolled = liveEnrolled;
  const displayCollected = liveCollected;
  const recoveryRate = totalRevenue > 0 ? Math.min(100, Math.round((displayCollected / totalRevenue) * 100)) : 0;

  const stats = [
    {
      label: 'Élèves Inscrits',
      value: displayEnrolled,
      suffix: 'élèves',
      sub: `${school.classrooms.length} classes configurées`,
      color: 'text-nature-700',
      trend: null,
    },
    {
      label: 'Classes Pédagogiques',
      value: school.classrooms.length,
      suffix: 'classes',
      sub: `${totalCapacity} places autorisées`,
      color: 'text-blue-700',
      trend: null,
    },
    {
      label: 'Recouvrement Encaissé',
      value: fmtShort(displayCollected),
      suffix: 'FCFA',
      sub: `Sur ${fmtShort(totalRevenue)} FCFA de potentiel`,
      color: 'text-slate-900',
      trend: null,
    },
    {
      label: 'Taux d’Encaissement',
      value: recoveryRate + '%',
      suffix: '',
      sub: `${fmtShort(displayCollected)} perçus en caisse`,
      color: recoveryRate >= 50 ? 'text-emerald-600' : 'text-slate-600',
      trend: null,
    },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Spinner size={32} className="text-nature-700 animate-spin" />
      </div>
    );
  }

  const isNotConfigured = school.classrooms.length === 0;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <ErpSidebar schoolName={school.schoolName} city={school.city} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ErpHeader
          schoolName={school.schoolName}
          title="Tableau de Bord"
          breadcrumbs={[{ label: 'kalansso os' }, { label: 'Tableau de Bord' }]}
        />

        <main className="flex-1 overflow-y-auto">
          {/* ── Page header strip ── */}
          <div className="bg-white border-b border-slate-200 px-8 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">
                  Cockpit Décisionnel · Année 2026 – 2027
                </p>
                <h2 className="text-xl font-bold text-slate-900">{school.schoolName}</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {school.city} · {school.phone}
                  {school.motto ? ` · « ${school.motto} »` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/cashier"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-nature-700 hover:bg-nature-800 text-white text-sm font-semibold rounded-lg transition-smooth"
                >
                  <CurrencyDollar size={15} weight="bold" />
                  Caisse Express
                </Link>
                <Link
                  href="/academics/grades"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg border border-slate-200 transition-smooth"
                >
                  <NotePencil size={15} weight="bold" />
                  Saisie Notes
                </Link>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-8">
            {/* ── Setup warning ── */}
            {isNotConfigured && (
              <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <Warning size={20} className="text-amber-600 flex-shrink-0 mt-0.5" weight="fill" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">Établissement non configuré</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Lancez l&apos;assistant pour créer vos classes, cycles et grilles tarifaires.
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-smooth flex-shrink-0"
                >
                  Configurer <ArrowRight size={12} weight="bold" />
                </Link>
              </div>
            )}

            {/* ── KPI Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-3">
                    {stat.label}
                  </p>
                  <div className={`text-2xl font-bold ${stat.color} leading-none`}>
                    {stat.value}
                    {stat.suffix && (
                      <span className="text-xs font-semibold text-slate-400 ml-1.5">{stat.suffix}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-tight">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Classes actives ── */}
            {school.classrooms.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Classes Actives & Grilles Tarifaires
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        ({school.classrooms.length} classes)
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Générées selon vos cycles et modifiables à tout moment</p>
                  </div>
                  <Link
                    href="/classes"
                    className="text-xs font-semibold text-nature-700 hover:text-nature-900 flex items-center gap-1 transition-smooth"
                  >
                    Gérer les classes <ArrowRight size={12} weight="bold" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {school.classrooms.map((cls, i) => (
                    <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 hover:border-nature-200 transition-smooth">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-nature-600 bg-nature-50 border border-nature-100 px-2 py-0.5 rounded">
                          {cls.cycle?.replace(/_/g, ' ') || 'Primaire'}
                        </span>
                        <span className="text-[10px] text-slate-400">{cls.capacity} places</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 leading-tight">{cls.name}</p>
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Scolarité</span>
                        <span className="text-xs font-bold text-slate-700">{fmt(cls.tuition)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ERP Modules ── */}
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Modules du Système</h3>
                <p className="text-xs text-slate-400 mt-0.5">Accès rapide à tous les outils de gestion</p>
              </div>
              <div className="space-y-6">
                {ERP_MODULES.map((section, si) => (
                  <div key={si}>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-3">
                      {section.section}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {section.modules.map((mod, mi) => (
                        <Link
                          key={mi}
                          href={mod.href}
                          className="group flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-nature-300 hover:shadow-sm transition-smooth"
                        >
                          <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-nature-50 group-hover:border-nature-100 border border-transparent flex items-center justify-center text-slate-500 group-hover:text-nature-700 transition-smooth flex-shrink-0">
                            {mod.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 group-hover:text-nature-700 transition-smooth leading-tight">
                              {mod.title}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{mod.sub}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
