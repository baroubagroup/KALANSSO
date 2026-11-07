'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Users,
  CurrencyDollar,
  Certificate,
  Gear,
  NotePencil,
  CheckCircle,
  Chalkboard,
} from '@phosphor-icons/react';

export default function HomePage() {
  const [configuredSchool, setConfiguredSchool] = useState<{
    schoolName: string;
    classroomsCount: number;
    city: string;
  } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kalansso_school_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.schoolName) {
          setConfiguredSchool({
            schoolName: parsed.schoolName,
            classroomsCount: Array.isArray(parsed.classrooms) ? parsed.classrooms.length : 0,
            city: parsed.city || 'Ouagadougou',
          });
        }
      }
    } catch {}
  }, []);

  const modules = [
    {
      href: '/students',
      tag: 'Scolarité',
      title: 'Inscriptions & Effectifs',
      desc: 'Gestion complète des élèves, inscriptions, transferts et archivage par cycle.',
      icon: <Users size={20} weight="bold" className="text-nature-700" />,
    },
    {
      href: '/cashier',
      tag: 'Finance',
      title: 'Guichet Caisse Express',
      desc: 'Encaissement Moov Money, Orange Money et espèces en moins de 15 secondes.',
      icon: <CurrencyDollar size={20} weight="bold" className="text-nature-700" />,
    },
    {
      href: '/academics/grades',
      tag: 'Pédagogie',
      title: 'Saisie Matricielle des Notes',
      desc: 'Tableur haute cadence avec gestion ABS/ABJ et verrouillage SHA-256.',
      icon: <NotePencil size={20} weight="bold" className="text-nature-700" />,
    },
    {
      href: '/academics/report-cards',
      tag: 'Bulletins',
      title: 'Bulletins Scellés QR Code',
      desc: 'Format officiel MENAPLN, rangs automatiques, QR anti-fraude, diffusion WhatsApp.',
      icon: <Certificate size={20} weight="bold" className="text-nature-700" />,
    },
    {
      href: '/classes',
      tag: 'Pédagogie',
      title: 'Classes & Grilles Tarifaires',
      desc: 'Gestion des classes, cycles, plafonds d\'effectifs et scolarités annuelles.',
      icon: <Chalkboard size={20} weight="bold" className="text-nature-700" />,
    },
    {
      href: '/timetable',
      tag: 'Emploi du temps',
      title: 'Planning des Classes',
      desc: 'Grille horaire hebdomadaire par classe, enseignants et salles.',
      icon: <Gear size={20} weight="bold" className="text-nature-700" />,
    },
  ];

  const certifications = [
    'Conforme MENAPLN (Bulletins A4)',
    'CIL Burkina Faso',
    'QR Code anti-fraude',
    'Chiffrement SHA-256',
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Header ── */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-nature-700 text-white font-black text-sm flex items-center justify-center">
              K
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-nature-600 tracking-widest block leading-none">
                Système d&apos;Exploitation
              </span>
              <span className="text-sm font-bold text-slate-900 leading-tight block">
                kalansso os
              </span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-500">
            <Link href="/dashboard" className="hover:text-slate-900 transition-smooth">Tableau de bord</Link>
            <Link href="/classes" className="hover:text-slate-900 transition-smooth">Classes</Link>
            <Link href="/cashier" className="hover:text-slate-900 transition-smooth">Caisse</Link>
            <Link href="/settings" className="hover:text-slate-900 transition-smooth">Paramètres</Link>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-nature-700 hover:bg-nature-800 text-white text-sm font-semibold rounded-lg transition-smooth"
            >
              Accéder au Tableau de Bord <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── School configured banner ── */}
      {configuredSchool && (
        <div className="bg-nature-50 border-b border-nature-200">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-sm text-slate-700">
                <span className="font-semibold">{configuredSchool.schoolName}</span>
                {' '}— {configuredSchool.classroomsCount} classes configurées · {configuredSchool.city}
              </span>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-nature-700 hover:text-nature-900 transition-smooth flex-shrink-0"
            >
              Accéder <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-nature-200 bg-nature-50 text-nature-700 text-xs font-semibold mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-nature-500" />
            Burkina Faso · Afrique Francophone · Crèche → Lycée → Supérieur
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1] max-w-3xl mb-6">
            Le Système d&apos;Exploitation de votre
            <span className="text-nature-700"> École Africaine.</span>
          </h1>

          <p className="text-lg text-slate-500 max-w-2xl leading-relaxed mb-10">
            Configurez vos classes, encaissez par Moov et Orange Money en 15 secondes,
            et certifiez vos bulletins avec un QR code inviolable. Tout-en-un, hors ligne.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 mb-16">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-nature-700 hover:bg-nature-800 text-white font-semibold rounded-xl transition-smooth text-sm shadow-sm"
            >
              Accéder au Tableau de Bord <ArrowRight size={16} weight="bold" />
            </Link>
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-smooth text-sm"
            >
              Classes & Grilles
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-4">
            {certifications.map((cert, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle size={14} className="text-nature-600" weight="fill" />
                <span>{cert}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Modules grid ── */}
        <section className="border-t border-slate-100 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="mb-10">
              <p className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
                Modules intégrés
              </p>
              <h2 className="text-2xl font-bold text-slate-900">
                Tout ce dont votre établissement a besoin.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((mod, i) => (
                <Link
                  key={i}
                  href={mod.href}
                  className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-nature-300 hover:shadow-md transition-smooth"
                >
                  {/* Icon + tag */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-nature-50 border border-nature-100 flex items-center justify-center">
                      {mod.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                      {mod.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5 group-hover:text-nature-700 transition-smooth">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {mod.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA band ── */}
        <section className="border-t border-slate-100 bg-nature-700">
          <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                Prêt à lancer votre école ?
              </h2>
              <p className="text-nature-200 text-sm">
                Initialisation complète en 5 étapes. Aucune carte bancaire requise.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-nature-50 text-nature-700 font-bold rounded-xl transition-smooth text-sm flex-shrink-0"
            >
              Accéder au Tableau de Bord <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-nature-700 text-white text-[9px] font-black flex items-center justify-center">K</div>
            <span>© 2026 <strong className="text-slate-600">kalansso os</strong> — Système d&apos;Exploitation de l&apos;École Africaine</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Conforme CIL & MENAPLN (Burkina Faso)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
