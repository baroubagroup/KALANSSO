'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlass,
  Bell,
  Plus,
  CashRegister,
  CalendarBlank,
} from '@phosphor-icons/react';
import {
  getActiveAcademicYear,
  setActiveAcademicYear,
  ACADEMIC_YEARS,
} from '@/lib/academicYear';

interface ErpHeaderProps {
  schoolName?: string;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function ErpHeader({
  schoolName = 'Complexe Scolaire Wend-Manegda',
  title = 'Tableau de Bord',
  breadcrumbs = [{ label: 'Accueil', href: '/dashboard' }],
}: ErpHeaderProps) {
  const [academicYear, setAcademicYearState] = useState(getActiveAcademicYear());
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    function handleYearChange(e: any) {
      if (e.detail?.year) {
        setAcademicYearState(e.detail.year);
      }
    }
    window.addEventListener('kalansso_academic_year_changed', handleYearChange);
    return () => window.removeEventListener('kalansso_academic_year_changed', handleYearChange);
  }, []);

  const handleSelectYear = (year: string) => {
    setAcademicYearState(year);
    setActiveAcademicYear(year);
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 z-40">
      {/* Breadcrumb + Title */}
      <div>
        <nav className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-300">/</span>}
              {bc.href ? (
                <Link href={bc.href} className="hover:text-slate-600 transition-smooth">
                  {bc.label}
                </Link>
              ) : (
                <span className="text-slate-600 font-medium">{bc.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
        <h1 className="text-base font-bold text-slate-900 leading-none">{title}</h1>
      </div>

      {/* Center — search + year */}
      <div className="hidden md:flex items-center gap-3">
        {/* Global search */}
        <div className="relative">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher… (Ctrl+K)"
            className="w-56 pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-nature-500 focus:bg-white transition-smooth"
          />
        </div>

        {/* Academic year */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg shadow-2xs">
          <CalendarBlank size={14} className="text-nature-700" weight="bold" />
          <select
            value={academicYear}
            onChange={(e) => handleSelectYear(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            title="Changer l'année académique active"
          >
            {ACADEMIC_YEARS.map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 relative">
        <Link
          href="/students/new"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-nature-700 hover:bg-nature-800 text-white text-xs font-semibold rounded-lg transition-smooth cursor-pointer shadow-xs"
        >
          <Plus size={13} weight="bold" />
          Inscrire
        </Link>

        <Link
          href="/cashier"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-smooth cursor-pointer shadow-xs"
        >
          <CashRegister size={13} weight="bold" />
          Caisse
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative w-8 h-8 flex items-center justify-center rounded-lg border transition-smooth cursor-pointer ${
              showNotifications
                ? 'bg-nature-50 border-nature-300 text-nature-700'
                : 'border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700'
            }`}
            title="Notifications du système"
          >
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 text-xs z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-bold text-slate-900">
                <span>Notifications & Alertes</span>
                <span className="text-[10px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Système Connecté
                </span>
              </div>
              <div className="py-2 space-y-2 text-slate-600">
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <div className="font-semibold text-slate-900">Base Supabase Synchronisée</div>
                  <div className="text-[11px] text-slate-500">14 apprenants certifiés · 9 classes actives</div>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <div className="font-semibold text-slate-900">Année Scolaire {academicYear}</div>
                  <div className="text-[11px] text-slate-500">Conforme au calendrier officiel MENAPLN</div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 text-center">
                <Link
                  href="/settings"
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] font-semibold text-nature-700 hover:underline"
                >
                  Gérer les paramètres officiels →
                </Link>
              </div>
            </div>
          )}
        </div>

        <Link
          href="/settings"
          title="Paramètres de l'établissement"
          className="w-8 h-8 rounded-full bg-nature-700 text-white text-[11px] font-bold flex items-center justify-center cursor-pointer hover:bg-nature-800 transition-smooth border border-nature-600 ml-1"
        >
          DG
        </Link>
      </div>
    </header>
  );
}
