'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import {
  getSchoolSettings,
  saveSchoolSettings,
  getDefaultMatriculePrefix,
  SchoolSettings,
  DEFAULT_SCHOOL,
  PhoneContact,
  GradingScaleItem,
  DEFAULT_GRADING_SCALE,
  DEFAULT_PHONES,
  DEFAULT_MODULES_CONFIG,
  SchoolModulesConfig,
} from '@/lib/schoolSettings';
import { WATERMARK_CATALOG, AfricanMotif, WatermarkPattern } from '@/components/motifs/AfricanMotif';
import {
  Gear,
  UploadSimple,
  Trash,
  CheckCircle,
  FloppyDisk,
  Image,
  Buildings,
  IdentificationCard,
  Phone,
  Certificate,
  ArrowsClockwise,
  ArrowRight,
  BookOpen,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Sparkle,
  ForkKnife,
  Bus,
  FirstAid,
  Bed,
} from '@phosphor-icons/react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const data = await getSchoolSettings();
      // Assurer la présence des téléphones multiples et du barème
      if (!data.phones || data.phones.length === 0) {
        data.phones = DEFAULT_PHONES;
      }
      if (!data.grading_scale || data.grading_scale.length === 0) {
        data.grading_scale = DEFAULT_GRADING_SCALE;
      }
      if (!data.modules_config) {
        data.modules_config = DEFAULT_MODULES_CONFIG;
      }
      setSettings(data);
      if (data.logo_url) {
        setLogoPreview(data.logo_url);
      }
    }
    load();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('L’image ne doit pas dépasser 2 Mo.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setSettings((prev) => ({ ...prev, logo_url: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setSettings((prev) => ({ ...prev, logo_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Gestion des téléphones multiples
  const handleAddPhone = () => {
    const newPhone: PhoneContact = {
      id: 'ph-' + Date.now(),
      label: 'Ligne secondaire',
      phone: '+226 ',
    };
    const updatedPhones = [...(settings.phones || []), newPhone];
    setSettings((prev) => ({
      ...prev,
      phones: updatedPhones,
      phone: updatedPhones[0]?.phone || prev.phone,
    }));
  };

  const handleUpdatePhone = (id: string, field: 'label' | 'phone', value: string) => {
    const updated = (settings.phones || []).map((p) => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setSettings((prev) => ({
      ...prev,
      phones: updated,
      phone: updated[0]?.phone || prev.phone,
    }));
  };

  const handleRemovePhone = (id: string) => {
    const updated = (settings.phones || []).filter((p) => p.id !== id);
    setSettings((prev) => ({
      ...prev,
      phones: updated,
      phone: updated[0]?.phone || prev.phone,
    }));
  };

  // Gestion du barème des mentions
  const handleUpdateGradingItem = (id: string, field: keyof GradingScaleItem, value: any) => {
    const updated = (settings.grading_scale || []).map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setSettings((prev) => ({ ...prev, grading_scale: updated }));
  };

  const handleResetGradingScale = () => {
    if (window.confirm('Voulez-vous rétablir le barème et les mentions officiels MENAPLN ?')) {
      setSettings((prev) => ({ ...prev, grading_scale: DEFAULT_GRADING_SCALE }));
    }
  };

  const handleToggleModule = (key: keyof SchoolModulesConfig) => {
    const current = settings.modules_config || DEFAULT_MODULES_CONFIG;
    setSettings((prev) => ({
      ...prev,
      modules_config: {
        ...current,
        [key]: !current[key],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await saveSchoolSettings(settings);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <ErpSidebar schoolName={settings.name} city={settings.city} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ErpHeader
          schoolName={settings.name}
          title="Paramètres de l’Établissement & Personnalisation Complète"
          breadcrumbs={[
            { label: 'Tableau de Bord', href: '/dashboard' },
            { label: 'Administration' },
            { label: 'Paramètres & Identité' },
          ]}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Header strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Gear size={22} weight="bold" className="text-nature-700" />
                  <span>Personnalisation & Identité Officielle</span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ces informations, téléphones, filigranes et barèmes s’appliquent en direct sur tous vos bulletins, certificats, reçus et cartes scolaires.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/academics/subjects"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-smooth"
                >
                  <BookOpen size={16} weight="bold" />
                  <span>Matières & Coeffs</span>
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-nature-700 hover:bg-nature-800 text-white font-bold text-xs rounded-xl shadow-sm transition-smooth cursor-pointer disabled:opacity-50"
                >
                  <FloppyDisk size={16} weight="bold" />
                  <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les Modifications'}</span>
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
                <CheckCircle size={18} weight="fill" className="text-emerald-600 flex-shrink-0" />
                <span>Paramètres, téléphones, filigrane et barème de l’établissement enregistrés et synchronisés avec succès !</span>
              </div>
            )}

            {/* SECTION 1 : Logo de l'établissement */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Image size={16} weight="bold" className="text-nature-700" />
                <span>1. Logo Officiel de l&apos;Établissement</span>
              </h2>

              <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                {/* Zone d'affichage du logo */}
                <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center p-2 relative overflow-hidden flex-shrink-0 shadow-xs">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo établissement"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400 p-2">
                      <Image size={32} className="mx-auto mb-1 opacity-50" />
                      <span className="text-[10px] font-semibold block leading-tight">Aucun logo</span>
                    </div>
                  )}
                </div>

                {/* Actions upload */}
                <div className="space-y-3 flex-1 text-center sm:text-left">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Importer le blason ou logo de l&apos;école</h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Format recommandé : PNG transparent ou JPG haute résolution. S&apos;intègre automatiquement sur les bulletins de notes, cartes d&apos;identité scolaires et reçus de scolarité.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-smooth cursor-pointer"
                    >
                      <UploadSimple size={14} weight="bold" />
                      <span>{logoPreview ? 'Changer le logo' : 'Sélectionner une image'}</span>
                    </button>

                    {logoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-lg border border-red-200 transition-smooth cursor-pointer"
                      >
                        <Trash size={14} />
                        <span>Supprimer</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2 : Coordonnées & Agrément MENAPLN + Numéros de Téléphone Multiples */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Buildings size={16} weight="bold" className="text-nature-700" />
                <span>2. Identité Administrative & Numéros de Contact Officiels</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom officiel complet de l&apos;établissement *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code d&apos;Agrément MENAPLN / Arrêté ministériel
                  </label>
                  <input
                    type="text"
                    value={settings.code_menapln}
                    onChange={(e) => setSettings({ ...settings, code_menapln: e.target.value })}
                    placeholder="Ex : MENAPLN-BF-0042 / N°2018-042"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Préfixe des Matricules Élèves *
                    </label>
                    <span className="text-[10px] font-mono font-bold text-nature-800 bg-nature-50 border border-nature-200 px-2 py-0.5 rounded">
                      Aperçu : {(settings.matricule_prefix || getDefaultMatriculePrefix(settings.name)).toUpperCase()}-2026-0001
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={settings.matricule_prefix || ''}
                    onChange={(e) => setSettings({ ...settings, matricule_prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                    placeholder={`Ex : ${getDefaultMatriculePrefix(settings.name)}`}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 uppercase focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Déduit par défaut du nom de votre établissement (ex: {getDefaultMatriculePrefix(settings.name)}). Personnalisable (3 à 5 lettres).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Devise officielle de l&apos;école
                  </label>
                  <input
                    type="text"
                    value={settings.motto}
                    onChange={(e) => setSettings({ ...settings, motto: e.target.value })}
                    placeholder="Ex : Discipline - Travail - Succès"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ville & Pays
                  </label>
                  <input
                    type="text"
                    value={settings.city}
                    onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adresse postale / Boîte Postale (BP)
                  </label>
                  <input
                    type="text"
                    value={settings.address || ''}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    placeholder="Ex : BP 1024 Ouagadougou 01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adresse Email officielle
                  </label>
                  <input
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder="direction@ecole.bf"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>
              </div>

              {/* GESTION MULTI-TÉLÉPHONES (Standard, Direction, Caisse, etc.) */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Phone size={14} weight="bold" className="text-nature-700" />
                      <span>Numéros de Téléphone de l’Établissement (Multi-lignes)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Vous pouvez enregistrer plusieurs numéros (Direction, Secrétariat WhatsApp, Caisse/Comptabilité, etc.).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPhone}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-nature-50 hover:bg-nature-100 text-nature-800 font-bold text-xs rounded-lg border border-nature-200 transition-smooth cursor-pointer"
                  >
                    <Plus size={13} weight="bold" />
                    <span>Ajouter un numéro</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(settings.phones || []).map((ph, idx) => (
                    <div key={ph.id || idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="w-1/3">
                        <input
                          type="text"
                          value={ph.label}
                          onChange={(e) => handleUpdatePhone(ph.id, 'label', e.target.value)}
                          placeholder="Intitulé (ex: Direction WhatsApp)"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:border-nature-500 outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={ph.phone}
                          onChange={(e) => handleUpdatePhone(ph.id, 'phone', e.target.value)}
                          placeholder="+226 70 00 00 00"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-slate-900 focus:border-nature-500 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePhone(ph.id)}
                        disabled={(settings.phones?.length || 0) <= 1}
                        className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-slate-400 rounded transition-smooth cursor-pointer"
                        title="Supprimer ce numéro"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 3 : Signataire Officiel & Direction */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                <IdentificationCard size={16} weight="bold" className="text-nature-700" />
                <span>3. Signataire des Documents (Bulletins & Certificats)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom et Prénom du Chef d&apos;Établissement *
                  </label>
                  <input
                    type="text"
                    value={settings.director_name || ''}
                    onChange={(e) => setSettings({ ...settings, director_name: e.target.value })}
                    placeholder="Ex : M. ILBOUDO Marc"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Titre officiel figurant au bas des actes
                  </label>
                  <input
                    type="text"
                    value={settings.director_title || ''}
                    onChange={(e) => setSettings({ ...settings, director_title: e.target.value })}
                    placeholder="Ex : Le Proviseur / Le Directeur Général"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4 : Les 10 Filigranes de Sécurité avec Aperçu Visuel Réel */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Certificate size={16} weight="bold" className="text-nature-700" />
                    <span>4. Filigrane de Sécurité & Patrimoine Visuel (10 Motifs Officiels)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sélectionnez le motif authentique qui s&apos;imprime en filigrane sécurisé sur vos bulletins et cartes scolaires.
                  </p>
                </div>
                <div className="text-[11px] font-bold text-nature-800 bg-nature-50 border border-nature-200 px-2.5 py-1 rounded-full whitespace-nowrap self-start">
                  Actif : {WATERMARK_CATALOG.find((w) => w.id === settings.watermark_pattern)?.name.split(' (')[0] || settings.watermark_pattern}
                </div>
              </div>

              {/* Grille interactive des 10 filigranes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 pt-2">
                {WATERMARK_CATALOG.map((item) => {
                  const isSelected = settings.watermark_pattern === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSettings({ ...settings, watermark_pattern: item.id })}
                      className={`relative p-3.5 rounded-xl border-2 transition-smooth cursor-pointer flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-nature-600 bg-nature-50/50 shadow-sm ring-1 ring-nature-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Vignette d'aperçu du motif */}
                      <div className="w-16 h-16 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center relative overflow-hidden flex-shrink-0 shadow-xs">
                        <AfricanMotif pattern={item.id} opacity={0.4} color="#1B4D3E" className="absolute inset-0" />
                        <span className="text-[9px] font-mono text-nature-900 font-bold z-10 px-1 py-0.5 bg-white/80 rounded backdrop-blur-xs">
                          {item.id.substring(0, 7)}
                        </span>
                      </div>

                      {/* Description & radio */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-bold text-slate-900 truncate">{item.name}</span>
                          <input
                            type="radio"
                            name="watermark_pattern"
                            checked={isSelected}
                            onChange={() => setSettings({ ...settings, watermark_pattern: item.id })}
                            className="accent-nature-700 flex-shrink-0"
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded inline-block mb-1">
                          {item.category}
                        </span>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 5 : Barème des Mentions & Décisions du Conseil (100% Personnalisable) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <SlidersHorizontal size={16} weight="bold" className="text-nature-700" />
                    <span>5. Barème d’Évaluation des Moyennes, Mentions & Appréciations</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Personnalisez les tranches de notes, mentions d’honneur (Félicitations, Tableau d&apos;Honneur) et appréciations automatiques des bulletins.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetGradingScale}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-smooth cursor-pointer self-start sm:self-auto"
                >
                  <ArrowsClockwise size={13} weight="bold" />
                  <span>Rétablir barème MENAPLN</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 border-b border-slate-200">Note Min / 20</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Note Max / 20</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Mention Officielle</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Appréciation Conseil de Classe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-medium">
                    {(settings.grading_scale || DEFAULT_GRADING_SCALE).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 w-28">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="20"
                            value={item.minAverage}
                            onChange={(e) => handleUpdateGradingItem(item.id, 'minAverage', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-slate-800"
                          />
                        </td>
                        <td className="py-2 px-3 w-28">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="20"
                            value={item.maxAverage}
                            onChange={(e) => handleUpdateGradingItem(item.id, 'maxAverage', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-slate-800"
                          />
                        </td>
                        <td className="py-2 px-3 w-44">
                          <input
                            type="text"
                            value={item.mention}
                            onChange={(e) => handleUpdateGradingItem(item.id, 'mention', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-900"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.appreciation}
                            onChange={(e) => handleUpdateGradingItem(item.id, 'appreciation', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 6 : Lien Rapide vers la Gestion des Matières & Coefficients */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-xl border border-emerald-200 shadow-sm p-6 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                    <BookOpen size={18} weight="bold" className="text-nature-700" />
                    <span>6. Configuration des Matières, Cycles & Coefficients</span>
                  </h2>
                  <p className="text-xs text-emerald-800 mt-1 max-w-2xl">
                    Personnalisez vos programmes scolaires : barème sur 10 (Primaire) ou sur 20 (Secondaire), coefficients officiels BEPC et BAC D, ajout de matières spécifiques ou bilingues.
                  </p>
                </div>
                <Link
                  href="/academics/subjects"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-nature-700 hover:bg-nature-800 text-white font-bold text-xs rounded-xl shadow-xs transition-smooth whitespace-nowrap self-start sm:self-auto"
                >
                  <span>Configurer les Matières</span>
                  <ArrowRight size={14} weight="bold" />
                </Link>
              </div>
            </div>

            {/* SECTION 7 : Modules Péri-Scolaires Optionnels (Activables à la Demande) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <ShieldCheck size={16} weight="bold" className="text-nature-700" />
                    <span>7. Modules Péri-Scolaires & Services Optionnels</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Activez uniquement les services réellement proposés par votre école (Cantine, Bus, Infirmerie, Internat) pour ne pas encombrer vos menus.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap self-start">
                  Désactivés par défaut
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* 1. Cantine */}
                <div
                  onClick={() => handleToggleModule('canteen_enabled')}
                  className={`p-4 rounded-xl border-2 transition-smooth cursor-pointer flex items-start justify-between gap-3 ${
                    settings.modules_config?.canteen_enabled
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      settings.modules_config?.canteen_enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <ForkKnife size={20} weight="bold" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Cantine Scolaire & Restauration</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Pointage des badges le midi, abonnements, détection anti-fraude double-passage.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!settings.modules_config?.canteen_enabled}
                    onChange={() => {}}
                    className="accent-nature-700 w-4 h-4 cursor-pointer mt-1"
                  />
                </div>

                {/* 2. Transport */}
                <div
                  onClick={() => handleToggleModule('transport_enabled')}
                  className={`p-4 rounded-xl border-2 transition-smooth cursor-pointer flex items-start justify-between gap-3 ${
                    settings.modules_config?.transport_enabled
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      settings.modules_config?.transport_enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <Bus size={20} weight="bold" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Transport Scolaire & Navettes</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Circuits de ramassage (lignes de bus), arrêts, pointage de la montée et descente.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!settings.modules_config?.transport_enabled}
                    onChange={() => {}}
                    className="accent-nature-700 w-4 h-4 cursor-pointer mt-1"
                  />
                </div>

                {/* 3. Infirmerie */}
                <div
                  onClick={() => handleToggleModule('infirmary_enabled')}
                  className={`p-4 rounded-xl border-2 transition-smooth cursor-pointer flex items-start justify-between gap-3 ${
                    settings.modules_config?.infirmary_enabled
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      settings.modules_config?.infirmary_enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <FirstAid size={20} weight="bold" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Infirmerie Scolaire & Soins</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Registre confidentiel des consultations, médicaments, alerte WhatsApp d&apos;urgence.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!settings.modules_config?.infirmary_enabled}
                    onChange={() => {}}
                    className="accent-nature-700 w-4 h-4 cursor-pointer mt-1"
                  />
                </div>

                {/* 4. Internat */}
                <div
                  onClick={() => handleToggleModule('boarding_enabled')}
                  className={`p-4 rounded-xl border-2 transition-smooth cursor-pointer flex items-start justify-between gap-3 ${
                    settings.modules_config?.boarding_enabled
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      settings.modules_config?.boarding_enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <Bed size={20} weight="bold" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Internat & Dortoirs</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Gestion des pavillons, attribution des lits, registre des sorties autorisées du weekend.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!settings.modules_config?.boarding_enabled}
                    onChange={() => {}}
                    className="accent-nature-700 w-4 h-4 cursor-pointer mt-1"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 8 : Transition et Clôture Annuelle */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-2">
                    <ArrowsClockwise size={16} weight="bold" className="text-teal-700" />
                    <span>8. Clôture & Passage d’Année Académique</span>
                  </h2>
                  <p className="text-xs text-teal-800 mt-1 max-w-2xl">
                    Module officiel pour promouvoir les admis selon le barème MENAPLN, reconduire les redoublants, sceller le registre d’archives et basculer l’établissement vers 2027–2028.
                  </p>
                </div>
                <Link
                  href="/academics/year-end-transition"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-smooth whitespace-nowrap self-start sm:self-auto"
                >
                  <span>Lancer la Clôture</span>
                  <ArrowRight size={14} weight="bold" />
                </Link>
              </div>
            </div>

            {/* Submit button bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-smooth"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-nature-700 hover:bg-nature-800 text-white font-bold text-xs rounded-xl shadow-sm transition-smooth flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <FloppyDisk size={16} weight="bold" />
                <span>{isSaving ? 'Enregistrement en cours...' : 'Enregistrer les Paramètres'}</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
