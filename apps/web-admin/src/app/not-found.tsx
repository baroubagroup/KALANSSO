'use client';

import React from 'react';
import Link from 'next/link';
import {
  House,
  Users,
  Chalkboard,
  CurrencyDollar,
  Gear,
  ArrowLeft,
  Question,
} from '@phosphor-icons/react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans text-slate-900">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-6 animate-fade-in">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-nature-700 text-white font-black text-base flex items-center justify-center shadow-xs">
            K
          </div>
          <div className="text-left">
            <div className="text-[10px] uppercase font-bold text-nature-600 tracking-widest leading-none">
              kalansso
            </div>
            <div className="text-sm font-bold text-slate-900 leading-tight">
              os
            </div>
          </div>
        </div>

        {/* 404 Icon & Heading */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
          <Question size={32} weight="bold" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-slate-900">Page Introuvable</h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            L&apos;adresse demandée n&apos;existe pas ou a été déplacée. Utilisez les raccourcis ci-dessous pour reprendre votre travail.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-2 text-left pt-2">
          <Link
            href="/dashboard"
            className="p-3 rounded-xl border border-slate-200 hover:border-nature-500 hover:bg-nature-50/50 transition-smooth group"
          >
            <House size={18} weight="bold" className="text-slate-400 group-hover:text-nature-700 mb-1" />
            <div className="text-xs font-bold text-slate-900">Tableau de Bord</div>
            <div className="text-[10px] text-slate-400">Vue d&apos;ensemble</div>
          </Link>

          <Link
            href="/students"
            className="p-3 rounded-xl border border-slate-200 hover:border-nature-500 hover:bg-nature-50/50 transition-smooth group"
          >
            <Users size={18} weight="bold" className="text-slate-400 group-hover:text-nature-700 mb-1" />
            <div className="text-xs font-bold text-slate-900">Élèves Inscrits</div>
            <div className="text-[10px] text-slate-400">Dossiers & effectifs</div>
          </Link>

          <Link
            href="/classes"
            className="p-3 rounded-xl border border-slate-200 hover:border-nature-500 hover:bg-nature-50/50 transition-smooth group"
          >
            <Chalkboard size={18} weight="bold" className="text-slate-400 group-hover:text-nature-700 mb-1" />
            <div className="text-xs font-bold text-slate-900">Classes & Cycles</div>
            <div className="text-[10px] text-slate-400">Gestion des niveaux</div>
          </Link>

          <Link
            href="/cashier"
            className="p-3 rounded-xl border border-slate-200 hover:border-nature-500 hover:bg-nature-50/50 transition-smooth group"
          >
            <CurrencyDollar size={18} weight="bold" className="text-slate-400 group-hover:text-nature-700 mb-1" />
            <div className="text-xs font-bold text-slate-900">Caisse Express</div>
            <div className="text-[10px] text-slate-400">Encaissements</div>
          </Link>
        </div>

        {/* Primary CTA */}
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-nature-700 hover:bg-nature-800 text-white font-bold text-xs rounded-xl shadow-xs transition-smooth"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Retourner au Tableau de Bord</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
