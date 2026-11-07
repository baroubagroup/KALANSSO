'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { getSchoolSettings, SchoolSettings, DEFAULT_SCHOOL } from '@/lib/schoolSettings';
import {
  NotePencil,
  Certificate,
  BookOpen,
  ChartBar,
  ArrowRight,
  GraduationCap,
  CalendarBlank,
  FileText,
  ArrowsClockwise,
  SlidersHorizontal,
} from '@phosphor-icons/react';

export default function AcademicsHubPage() {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);

  useEffect(() => {
    async function load() {
      const s = await getSchoolSettings();
      setSchoolSettings(s);
    }
    load();
  }, []);

  const modules = [
    {
      title: 'Matières, Cycles & Coefficients (MENAPLN)',
      sub: 'Personnalisez les matières par cycle (Primaire sur 10, Collège & Lycée sur 20), ajustez les coefficients officiels BEPC/BAC et ajoutez des matières spécifiques.',
      href: '/academics/subjects',
      icon: <SlidersHorizontal size={24} weight="bold" className="text-nature-700" />,
      cta: 'Configurer les matières & coeffs',
      badge: '100% Modulable',
    },
    {
      title: 'Éditeur d’Épreuves & Textes (Style Word)',
      sub: 'Rédigez devoirs surveillés, sujets d’examen, circulaires et convocations sur feuille A4 avec barème et cartouche.',
      href: '/editor',
      icon: <FileText size={24} weight="bold" className="text-nature-700" />,
      cta: 'Ouvrir l’éditeur de devoirs',
      badge: 'Word A4',
    },
    {
      title: 'Examens Nationaux (CEP, BEPC, BAC)',
      sub: 'Gestion des candidatures officielles, indexation séquentielle des numéros de table, registres DREPS et badges scellés.',
      href: '/academics/national-exams',
      icon: <GraduationCap size={24} weight="bold" className="text-purple-700" />,
      cta: 'Gérer les examens d’État',
      badge: 'DREPS / MENAPLN',
    },
    {
      title: 'Saisie Matricielle des Notes',
      sub: 'Saisie rapide haute cadence au pavé numérique type tableur, calcul des moyennes et scellement SHA-256.',
      href: '/academics/grades',
      icon: <NotePencil size={24} weight="bold" className="text-blue-700" />,
      cta: 'Ouvrir la matrice de saisie',
      badge: 'Haute cadence',
    },
    {
      title: 'Bulletins Scellés QR Code (A4 MENAPLN)',
      sub: 'Impression officielle conforme au modèle national burkinabè, calcul des rangs, mentions et diffusion WhatsApp.',
      href: '/academics/report-cards',
      icon: <Certificate size={24} weight="bold" className="text-amber-700" />,
      cta: 'Générer les bulletins A4',
      badge: 'Format Officiel',
    },
    {
      title: 'Conseils de Classe & Délibérations',
      sub: 'Validation des passages en classe supérieure, redoublements, mentions d’honneur et clôture du conseil.',
      href: '/academics/deliberations',
      icon: <BookOpen size={24} weight="bold" className="text-emerald-700" />,
      cta: 'Accéder aux délibérations',
      badge: 'Décisions officielles',
    },
    {
      title: 'Clôture & Passage d’Année Académique',
      sub: 'Promotion automatique des admis selon l’échelle MENAPLN, reconduction des redoublants, scellement de PV et bascule 2027-2028.',
      href: '/academics/year-end-transition',
      icon: <ArrowsClockwise size={24} weight="bold" className="text-teal-700" />,
      cta: 'Lancer le passage d’année',
      badge: 'Bascule Annuelle',
    },
    {
      title: 'Statistiques & Bilan Pédagogique',
      sub: 'Analytique par matière, taux de réussite, comparaisons de promotions et repérage des élèves en difficulté.',
      href: '/academics/reports',
      icon: <ChartBar size={24} weight="bold" className="text-nature-700" />,
      cta: 'Consulter les statistiques',
      badge: 'Analytique',
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <ErpSidebar schoolName={schoolSettings.name} city={schoolSettings.city} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ErpHeader
          schoolName={schoolSettings.name}
          title="Pôle Pédagogie, Évaluations & Bulletins"
          breadcrumbs={[
            { label: 'Tableau de Bord', href: '/dashboard' },
            { label: 'Pédagogie' },
          ]}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-nature-700 bg-nature-50 px-2 py-0.5 rounded border border-nature-100">
                  Direction des Études & Censure
                </span>
                <span className="text-xs text-slate-400">Année 2026 – 2027</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">Espace Pédagogique & Évaluations</h1>
              <p className="text-xs text-slate-500 mt-0.5">Gérez la saisie des notes, les délibérations de fin de cycle et les bulletins officiels scellés.</p>
            </div>
          </div>

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
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
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
        </main>
      </div>
    </div>
  );
}
