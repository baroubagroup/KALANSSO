'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  House,
  Users,
  Chalkboard,
  NotePencil,
  Certificate,
  CurrencyDollar,
  Gear,
  ChartBar,
  SignOut,
  CaretLeft,
  CaretRight,
  GraduationCap,
  CalendarBlank,
  Clipboard,
  BookOpen,
  UserCircle,
  ChatCircleText,
  FileText,
  CheckSquare,
  ArrowsClockwise,
  SlidersHorizontal,
  ForkKnife,
  Bus,
  FirstAid,
  Bed,
  Ticket,
} from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { getSchoolSettings, SchoolModulesConfig, DEFAULT_MODULES_CONFIG } from '@/lib/schoolSettings';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | null;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface ErpSidebarProps {
  schoolName?: string;
  city?: string;
}

export function ErpSidebar({
  schoolName = 'Complexe Scolaire Wend-Manegda',
  city = 'Ouagadougou',
}: ErpSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [modulesConfig, setModulesConfig] = useState<SchoolModulesConfig>(DEFAULT_MODULES_CONFIG);

  useEffect(() => {
    async function loadConfig() {
      try {
        const s = await getSchoolSettings();
        if (s.modules_config) setModulesConfig(s.modules_config);
      } catch {}
    }
    loadConfig();
    window.addEventListener('kalansso_school_updated', loadConfig);
    return () => window.removeEventListener('kalansso_school_updated', loadConfig);
  }, []);

  useEffect(() => {
    function loadLogo() {
      try {
        const logo = localStorage.getItem('kalansso_school_logo');
        if (logo) setCustomLogo(logo);
      } catch {}
    }
    loadLogo();
    window.addEventListener('kalansso_school_updated', loadLogo);
    return () => window.removeEventListener('kalansso_school_updated', loadLogo);
  }, []);

  useEffect(() => {
    async function loadStudentCount() {
      try {
        const { count } = await supabase.from('students').select('*', { count: 'exact', head: true });
        if (count !== null) setStudentCount(count);
      } catch {}
    }
    loadStudentCount();
  }, []);

  const navSections: NavSection[] = [
    {
      title: 'VUE GLOBALE',
      items: [
        { name: 'Tableau de Bord', href: '/dashboard', icon: <House size={18} weight="bold" /> },
      ],
    },
    {
      title: 'SCOLARITÉ & EFFECTIFS',
      items: [
        { name: 'Élèves Inscrits', href: '/students', icon: <Users size={18} weight="bold" />, badge: studentCount !== null ? String(studentCount) : null },
        { name: 'Feuille d’Appel & Présences', href: '/attendance', icon: <CheckSquare size={18} weight="bold" />, badge: 'Direct' },
        { name: 'Discipline & Billets', href: '/discipline', icon: <Ticket size={18} weight="bold" />, badge: 'Vie Scolaire' },
        { name: 'Classes & Paliers', href: '/classes', icon: <Chalkboard size={18} weight="bold" /> },
        { name: 'Emplois du Temps', href: '/timetable', icon: <CalendarBlank size={18} weight="bold" /> },
      ],
    },
    {
      title: 'PÉDAGOGIE & EXAMENS',
      items: [
        { name: 'Matières & Coeffs', href: '/academics/subjects', icon: <SlidersHorizontal size={18} weight="bold" />, badge: 'Coeffs' },
        { name: 'Éditeur d’Épreuves & Textes', href: '/editor', icon: <FileText size={18} weight="bold" />, badge: 'Word' },
        { name: 'Examens Nationaux (CEP, BEPC, BAC)', href: '/academics/national-exams', icon: <GraduationCap size={18} weight="bold" />, badge: 'DREPS' },
        { name: 'Saisie des Notes', href: '/academics/grades', icon: <NotePencil size={18} weight="bold" /> },
        { name: 'Bulletins Officiels A4', href: '/academics/report-cards', icon: <Certificate size={18} weight="bold" />, badge: 'MENAPLN' },
        { name: 'Conseils & Délibérations', href: '/academics/deliberations', icon: <BookOpen size={18} weight="bold" /> },
        { name: 'Clôture & Passage d’Année', href: '/academics/year-end-transition', icon: <ArrowsClockwise size={18} weight="bold" />, badge: 'Transition' },
        { name: 'Bilan Pédagogique', href: '/academics/reports', icon: <ChartBar size={18} weight="bold" /> },
      ],
    },
    {
      title: 'FINANCES & TRÉSORERIE',
      items: [
        { name: 'Guichet Caisse Express', href: '/cashier', icon: <CurrencyDollar size={18} weight="bold" />, badge: '< 15s' },
        { name: 'Échéanciers & Relances', href: '/finance/schedule', icon: <CalendarBlank size={18} weight="bold" />, badge: '3 Tranches' },
        { name: 'Fiche Contrôle Classe', href: '/finance/class-sheet', icon: <FileText size={18} weight="bold" />, badge: 'Terrain' },
        { name: 'Rapports & Recouvrement', href: '/finance/reports', icon: <ChartBar size={18} weight="bold" /> },
      ],
    },
    {
      title: 'COMMUNICATION & DOCUMENTS',
      items: [
        { name: 'Alertes SMS & WhatsApp', href: '/communications', icon: <ChatCircleText size={18} weight="bold" />, badge: 'Auto' },
        { name: 'Certificats & Cartes', href: '/documents', icon: <FileText size={18} weight="bold" /> },
      ],
    },
    {
      title: 'ADMINISTRATION & RH',
      items: [
        { name: 'Corps Enseignant & RH', href: '/hr', icon: <UserCircle size={18} weight="bold" /> },
        { name: 'Paramètres & Logo', href: '/settings', icon: <Gear size={18} weight="bold" />, badge: 'Logo' },
      ],
    },
  ];

  const serviceItems: NavItem[] = [];
  if (modulesConfig.canteen_enabled) {
    serviceItems.push({ name: 'Cantine Scolaire', href: '/services?tab=canteen', icon: <ForkKnife size={18} weight="bold" /> });
  }
  if (modulesConfig.transport_enabled) {
    serviceItems.push({ name: 'Transport & Bus', href: '/services?tab=transport', icon: <Bus size={18} weight="bold" /> });
  }
  if (modulesConfig.infirmary_enabled) {
    serviceItems.push({ name: 'Infirmerie & Santé', href: '/services?tab=infirmary', icon: <FirstAid size={18} weight="bold" /> });
  }
  if (modulesConfig.boarding_enabled) {
    serviceItems.push({ name: 'Internat & Dortoirs', href: '/services?tab=boarding', icon: <Bed size={18} weight="bold" /> });
  }

  const finalSections: NavSection[] = [...navSections];
  if (serviceItems.length > 0) {
    finalSections.splice(4, 0, {
      title: 'SERVICES & VIE SCOLAIRE',
      items: serviceItems,
    });
  }

  return (
    <aside
      className={`bg-slate-900 text-slate-200 flex flex-col flex-shrink-0 h-full border-r border-slate-800 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[64px]' : 'w-[250px]'
      }`}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden min-w-0">
          {customLogo ? (
            <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs border border-slate-700">
              <img src={customLogo} alt="Logo" className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-nature-700 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
              K
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-nature-400 tracking-widest leading-none">
                kalansso
              </div>
              <div className="text-sm font-bold text-white leading-tight truncate">
                os
              </div>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-smooth flex-shrink-0"
          aria-label={collapsed ? 'Développer' : 'Réduire'}
        >
          {collapsed ? <CaretRight size={14} weight="bold" /> : <CaretLeft size={14} weight="bold" />}
        </button>
      </div>

      {/* School badge */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-1 px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">En Service</span>
          </div>
          <div className="text-xs font-semibold text-white leading-tight truncate" title={schoolName}>
            {schoolName}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{city} · 2026-2027</div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-4 overflow-y-auto">
        {finalSections.map((section, i) => (
          <div key={i}>
            {!collapsed && (
              <p className="px-3 text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-1">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-smooth ${
                      isActive
                        ? 'bg-nature-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1">{item.name}</span>
                        {item.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-nature-300 border border-slate-700 flex-shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer session */}
      <div className="border-t border-slate-800 p-3 flex items-center gap-3 bg-slate-950/40">
        <div className="w-8 h-8 rounded-full bg-nature-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 border border-nature-600">
          DG
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">Directeur Général</div>
            <div className="text-[10px] text-emerald-400">En ligne · Admin</div>
          </div>
        )}
        {!collapsed && (
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-200 transition-smooth" title="Session active">
            <SignOut size={16} />
          </Link>
        )}
      </div>
    </aside>
  );
}
