'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { supabase } from '@/lib/supabase';
import {
  getSchoolSettings,
  SchoolSettings,
  DEFAULT_SCHOOL,
  DEFAULT_MODULES_CONFIG,
  SchoolModulesConfig,
} from '@/lib/schoolSettings';
import { getActiveAcademicYear } from '@/lib/academicYear';
import {
  ForkKnife,
  Bus,
  FirstAid,
  Bed,
  CheckCircle,
  WarningCircle,
  XCircle,
  Gear,
  Clock,
  User,
  MagnifyingGlass,
  Plus,
  ChatCircleText,
  ShieldCheck,
  QrCode,
  ArrowRight,
} from '@phosphor-icons/react';

type ServiceTab = 'canteen' | 'transport' | 'infirmary' | 'boarding';

function ServicesContent() {
  const searchParams = useSearchParams();
  const requestedTab = (searchParams.get('tab') as ServiceTab) || 'canteen';

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [modulesConfig, setModulesConfig] = useState<SchoolModulesConfig>(DEFAULT_MODULES_CONFIG);
  const [activeTab, setActiveTab] = useState<ServiceTab>(requestedTab);
  const [academicYear, setAcademicYear] = useState(getActiveAcademicYear());

  // ── ÉTATS CANTINE ──
  const [canteenScanInput, setCanteenScanInput] = useState('');
  const [canteenScanResult, setCanteenScanResult] = useState<{
    status: 'SUCCESS' | 'FRAUD_DOUBLE' | 'NOT_SUBSCRIBED';
    studentName: string;
    classroom: string;
    time: string;
    message: string;
  } | null>(null);

  const [canteenLog, setCanteenLog] = useState([
    { id: 'c-1', matricule: 'KLS-2026-0042', name: 'OUEDRAOGO Fatimata', classroom: 'Terminale D', time: '12:08', status: 'VALIDE' },
    { id: 'c-2', matricule: 'KLS-2026-0014', name: 'COMPAORE Inès', classroom: 'Terminale D', time: '12:12', status: 'VALIDE' },
    { id: 'c-3', matricule: 'KLS-2026-0001', name: 'BAMBARA Christian', classroom: 'Terminale D', time: '12:14', status: 'VALIDE' },
  ]);

  // ── ÉTATS INFIRMERIE ──
  const [infirmaryLog, setInfirmaryLog] = useState([
    {
      id: 'inf-1',
      date: 'Aujourd’hui à 10:15',
      studentName: 'SAWADOGO Wendy',
      classroom: 'CM2',
      guardianPhone: '+226 70 20 30 40',
      motif: 'Céphalées & Fièvre légère (38.2°C)',
      treatment: 'Paracétamol 500mg + Repos 30 min',
      decision: 'Retour en classe après observation',
    },
    {
      id: 'inf-2',
      date: 'Hier à 15:30',
      studentName: 'TRAORE Abdoul-Kader',
      classroom: 'CM2',
      guardianPhone: '+226 76 55 44 33',
      motif: 'Égratignure genou droit en cours d’EPS',
      treatment: 'Désinfection Bétadine + Pansement stérile',
      decision: 'Retour en classe immédiat',
    },
  ]);

  const [infirmaryForm, setInfirmaryForm] = useState({
    studentName: '',
    classroom: '6ème A',
    motif: 'Céphalées / Maux de tête',
    temperature: '37.4',
    treatment: 'Paracétamol 500mg',
    decision: 'Retour en classe',
  });
  const [infirmarySuccess, setInfirmarySuccess] = useState(false);

  // Charger les paramètres
  useEffect(() => {
    async function load() {
      const s = await getSchoolSettings();
      setSchoolSettings(s);
      if (s.modules_config) {
        setModulesConfig(s.modules_config);
        // Si l'onglet demandé n'est pas actif, basculer vers le premier actif
        const conf = s.modules_config;
        if (!conf[`${requestedTab}_enabled` as keyof SchoolModulesConfig]) {
          if (conf.canteen_enabled) setActiveTab('canteen');
          else if (conf.transport_enabled) setActiveTab('transport');
          else if (conf.infirmary_enabled) setActiveTab('infirmary');
          else if (conf.boarding_enabled) setActiveTab('boarding');
        } else {
          setActiveTab(requestedTab);
        }
      }
    }
    load();

    window.addEventListener('kalansso_school_updated', load);
    return () => window.removeEventListener('kalansso_school_updated', load);
  }, [requestedTab]);

  // Vérifier si au moins 1 module est actif
  const hasAnyActive =
    modulesConfig.canteen_enabled ||
    modulesConfig.transport_enabled ||
    modulesConfig.infirmary_enabled ||
    modulesConfig.boarding_enabled;

  // Simulation scan cantine
  const handleCanteenScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canteenScanInput.trim()) return;

    const query = canteenScanInput.trim().toUpperCase();
    const existing = canteenLog.find((log) => log.matricule === query || log.name.toUpperCase().includes(query));

    if (existing) {
      setCanteenScanResult({
        status: 'FRAUD_DOUBLE',
        studentName: existing.name,
        classroom: existing.classroom,
        time: existing.time,
        message: `ALERTE FRAUDE : Cet élève a DÉJÀ reçu son plateau repas à ${existing.time} aujourd’hui !`,
      });
    } else if (query.includes('NON') || query === 'KLS-999') {
      setCanteenScanResult({
        status: 'NOT_SUBSCRIBED',
        studentName: 'Élève Non Abonné',
        classroom: 'N/A',
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        message: 'ATTENTION : Cet élève n’a pas souscrit au forfait cantine ce mois-ci.',
      });
    } else {
      const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const newEntry = {
        id: 'c-' + Date.now(),
        matricule: query.startsWith('KLS-') ? query : 'KLS-2026-00' + Math.floor(10 + Math.random() * 80),
        name: query.startsWith('KLS-') ? 'OUEDRAOGO Fatimata' : query,
        classroom: 'Terminale D',
        time: now,
        status: 'VALIDE',
      };
      setCanteenLog([newEntry, ...canteenLog]);
      setCanteenScanResult({
        status: 'SUCCESS',
        studentName: newEntry.name,
        classroom: newEntry.classroom,
        time: now,
        message: `VALIDÉ : Repas autorisé pour ${newEntry.name} (${newEntry.classroom}). Bon appétit !`,
      });
      setCanteenScanInput('');
    }
  };

  // Ajout consultation infirmerie
  const handleAddInfirmary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!infirmaryForm.studentName.trim()) return;

    const newRecord = {
      id: 'inf-' + Date.now(),
      date: `Aujourd’hui à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      studentName: infirmaryForm.studentName,
      classroom: infirmaryForm.classroom,
      guardianPhone: '+226 70 20 30 40',
      motif: `${infirmaryForm.motif} (${infirmaryForm.temperature}°C)`,
      treatment: infirmaryForm.treatment,
      decision: infirmaryForm.decision,
    };

    setInfirmaryLog([newRecord, ...infirmaryLog]);
    setInfirmarySuccess(true);
    setInfirmaryForm({
      studentName: '',
      classroom: '6ème A',
      motif: 'Céphalées / Maux de tête',
      temperature: '37.4',
      treatment: 'Paracétamol 500mg',
      decision: 'Retour en classe',
    });
    setTimeout(() => setInfirmarySuccess(false), 4000);
  };

  const getWhatsAppAlertMedical = (rec: any) => {
    const text = encodeURIComponent(
      `Bonjour M./Mme,\n\n` +
      `L'Infirmerie du ${schoolSettings.name} vous informe que votre enfant ${rec.studentName} (${rec.classroom}) a été reçu(e) ce jour pour : ${rec.motif}.\n\n` +
      `Soin administré : ${rec.treatment}.\n` +
      `Décision : ${rec.decision}.\n\n` +
      `Infirmerie de l'établissement : ${schoolSettings.phone}`
    );
    const cleanPhone = rec.guardianPhone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <ErpSidebar schoolName={schoolSettings.name} city={schoolSettings.city} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ErpHeader
          schoolName={schoolSettings.name}
          title="Pôle Services Péri-Scolaires & Intendance"
          breadcrumbs={[
            { label: 'Tableau de Bord', href: '/dashboard' },
            { label: 'Services & Vie Scolaire' },
          ]}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* HEADER STRIP */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-nature-700 bg-nature-50 border border-nature-200 px-2 py-0.5 rounded">
                  Vie Scolaire & Intendance
                </span>
                <span className="text-xs text-slate-500 font-medium">Année {academicYear}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">Gestion des Services Péri-Scolaires</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Ces modules sont activables à la demande dans les paramètres pour s&apos;adapter précisément à l&apos;offre de votre école.
              </p>
            </div>

            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-smooth self-start sm:self-auto"
            >
              <Gear size={15} weight="bold" />
              <span>Activer / Désactiver les Services</span>
            </Link>
          </div>

          {/* SI AUCUN SERVICE N'EST ACTIVÉ (Défaut propre) */}
          {!hasAnyActive ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm my-8">
              <div className="w-16 h-16 rounded-2xl bg-nature-50 border border-nature-200 flex items-center justify-center mx-auto text-nature-700 shadow-xs">
                <ShieldCheck size={32} weight="bold" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Aucun Service Péri-Scolaire Activé</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Votre interface reste volontairement épurée et sans encombrement. Si votre établissement dispose d&apos;une <strong>Cantine</strong>, de <strong>Navettes de bus</strong>, d&apos;une <strong>Infirmerie</strong> ou d&apos;un <strong>Internat</strong>, vous pouvez les activer en 1 clic dans les paramètres.
              </p>
              <div className="pt-2">
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-nature-700 hover:bg-nature-800 text-white font-bold text-xs rounded-xl shadow-xs transition-smooth"
                >
                  <Gear size={16} weight="bold" />
                  <span>Configurer les Services dans les Paramètres</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ONGLETS DES SERVICES ACTIFS */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                {modulesConfig.canteen_enabled && (
                  <button
                    onClick={() => setActiveTab('canteen')}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-smooth cursor-pointer ${
                      activeTab === 'canteen'
                        ? 'bg-nature-700 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <ForkKnife size={16} weight="bold" />
                    <span>Cantine Scolaire</span>
                  </button>
                )}

                {modulesConfig.transport_enabled && (
                  <button
                    onClick={() => setActiveTab('transport')}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-smooth cursor-pointer ${
                      activeTab === 'transport'
                        ? 'bg-nature-700 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <Bus size={16} weight="bold" />
                    <span>Transport & Navettes</span>
                  </button>
                )}

                {modulesConfig.infirmary_enabled && (
                  <button
                    onClick={() => setActiveTab('infirmary')}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-smooth cursor-pointer ${
                      activeTab === 'infirmary'
                        ? 'bg-nature-700 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <FirstAid size={16} weight="bold" />
                    <span>Infirmerie Scolaire</span>
                  </button>
                )}

                {modulesConfig.boarding_enabled && (
                  <button
                    onClick={() => setActiveTab('boarding')}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-smooth cursor-pointer ${
                      activeTab === 'boarding'
                        ? 'bg-nature-700 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <Bed size={16} weight="bold" />
                    <span>Internat & Dortoirs</span>
                  </button>
                )}
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  CONTENU ONGLET 1 : CANTINE SCOLAIRE
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === 'canteen' && modulesConfig.canteen_enabled && (
                <div className="space-y-6">
                  {/* Stats cantine */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Repas Servis Ce Midi</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">{canteenLog.length} repas</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Pointage en direct à l&apos;entrée</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">Élèves Abonnés Mensuels</span>
                      <div className="text-2xl font-black text-emerald-700 mt-1">142 élèves</div>
                      <div className="text-[11px] text-emerald-800 mt-0.5">Forfait déjeuner validé</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-nature-800 block">Contrôle Anti-Fraude</span>
                      <div className="text-2xl font-black text-nature-700 mt-1">Actif</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Double-repas bloqué le même midi</div>
                    </div>
                  </div>

                  {/* Borne de pointage cantine */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <QrCode size={20} className="text-nature-700" />
                        <h3 className="text-sm font-bold text-slate-900">Borne de Pointage des Repas (Scan Carte ou Saisie)</h3>
                      </div>
                      <span className="text-[10px] font-bold text-nature-800 bg-nature-50 border border-nature-200 px-2 py-0.5 rounded">
                        Guichet Déjeuner Ouvert
                      </span>
                    </div>

                    <form onSubmit={handleCanteenScan} className="flex gap-2">
                      <input
                        type="text"
                        value={canteenScanInput}
                        onChange={(e) => setCanteenScanInput(e.target.value)}
                        placeholder="Scanner QR code ou taper matricule (ex: KLS-2026-0042)..."
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-nature-500 focus:bg-white"
                      />
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-nature-700 hover:bg-nature-800 text-white font-bold text-xs rounded-xl shadow-xs transition-smooth cursor-pointer"
                      >
                        Valider le Repas
                      </button>
                    </form>

                    {/* Résultat du scan */}
                    {canteenScanResult && (
                      <div
                        className={`p-4 rounded-xl border text-xs font-semibold flex items-start gap-3 animate-fade-in ${
                          canteenScanResult.status === 'SUCCESS'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : canteenScanResult.status === 'FRAUD_DOUBLE'
                            ? 'bg-rose-50 border-rose-300 text-rose-900'
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                      >
                        {canteenScanResult.status === 'SUCCESS' ? (
                          <CheckCircle size={22} weight="fill" className="text-emerald-600 flex-shrink-0 mt-0.5" />
                        ) : canteenScanResult.status === 'FRAUD_DOUBLE' ? (
                          <XCircle size={22} weight="fill" className="text-rose-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <WarningCircle size={22} weight="fill" className="text-amber-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-sm">{canteenScanResult.message}</div>
                          <div className="text-[11px] opacity-80 mt-0.5">
                            Élève : {canteenScanResult.studentName} • Classe : {canteenScanResult.classroom} • Heure : {canteenScanResult.time}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Journal des passages */}
                    <div className="pt-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Passages Réalisés Ce Midi ({canteenLog.length})
                      </h4>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200">
                            <tr>
                              <th className="p-2.5">Heure</th>
                              <th className="p-2.5">Matricule</th>
                              <th className="p-2.5">Élève</th>
                              <th className="p-2.5">Classe</th>
                              <th className="p-2.5 text-right">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {canteenLog.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50/50">
                                <td className="p-2.5 font-mono text-slate-500 font-semibold">{log.time}</td>
                                <td className="p-2.5 font-mono font-bold text-slate-800">{log.matricule}</td>
                                <td className="p-2.5 font-bold text-slate-900">{log.name}</td>
                                <td className="p-2.5 text-slate-600">{log.classroom}</td>
                                <td className="p-2.5 text-right">
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    Servi
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  CONTENU ONGLET 2 : TRANSPORT SCOLAIRE & NAVETTES
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === 'transport' && modulesConfig.transport_enabled && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Circuit 1 */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bus size={20} className="text-nature-700" />
                          <h3 className="text-sm font-bold text-slate-900">Ligne 1 : Somgandé ↔ Kossodo ↔ Centre</h3>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          Bus N°01 (32 places)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Chauffeur référent : M. TRAORE Moussa (+226 70 11 22 33)
                      </p>
                      <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="font-semibold text-slate-700">Arrêt 1 : Rond-Point Somgandé</span>
                          <span className="font-mono text-slate-500">06h45 • 12 élèves</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="font-semibold text-slate-700">Arrêt 2 : Pharmacie Kossodo</span>
                          <span className="font-mono text-slate-500">07h00 • 8 élèves</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="font-semibold text-slate-700">Arrêt 3 : Arrivée Établissement</span>
                          <span className="font-mono text-emerald-700 font-bold">07h20 • Terminus</span>
                        </div>
                      </div>
                    </div>

                    {/* Circuit 2 */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bus size={20} className="text-blue-700" />
                          <h3 className="text-sm font-bold text-slate-900">Ligne 2 : Ouaga 2000 ↔ Patte d’Oie</h3>
                        </div>
                        <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                          Bus N°02 (45 places)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Chauffeur référent : M. CONGO Salif (+226 78 44 00 11)
                      </p>
                      <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="font-semibold text-slate-700">Arrêt 1 : Monument des Héros (Ouaga 2000)</span>
                          <span className="font-mono text-slate-500">06h40 • 18 élèves</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="font-semibold text-slate-700">Arrêt 2 : Échangeur Patte d’Oie</span>
                          <span className="font-mono text-slate-500">06h55 • 14 élèves</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="font-semibold text-slate-700">Arrêt 3 : Arrivée Établissement</span>
                          <span className="font-mono text-emerald-700 font-bold">07h20 • Terminus</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  CONTENU ONGLET 3 : INFIRMERIE SCOLAIRE
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === 'infirmary' && modulesConfig.infirmary_enabled && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Formulaire nouvelle consultation */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <FirstAid size={20} className="text-rose-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Enregistrer une Consultation Médicale
                      </h3>
                    </div>

                    {infirmarySuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle size={16} weight="fill" className="text-emerald-600" />
                        <span>Passage à l&apos;infirmerie enregistré avec succès !</span>
                      </div>
                    )}

                    <form onSubmit={handleAddInfirmary} className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Nom de l&apos;Élève *</label>
                        <input
                          type="text"
                          required
                          value={infirmaryForm.studentName}
                          onChange={(e) => setInfirmaryForm({ ...infirmaryForm, studentName: e.target.value })}
                          placeholder="Ex : OUEDRAOGO Fatimata"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 outline-none focus:border-nature-500 focus:bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Classe *</label>
                          <select
                            value={infirmaryForm.classroom}
                            onChange={(e) => setInfirmaryForm({ ...infirmaryForm, classroom: e.target.value })}
                            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 outline-none"
                          >
                            <option value="CP1">CP1</option>
                            <option value="CM2">CM2</option>
                            <option value="6ème A">6ème A</option>
                            <option value="3ème">3ème</option>
                            <option value="Terminale D">Terminale D</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Température (°C)</label>
                          <input
                            type="text"
                            value={infirmaryForm.temperature}
                            onChange={(e) => setInfirmaryForm({ ...infirmaryForm, temperature: e.target.value })}
                            placeholder="37.5"
                            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Symptôme / Motif</label>
                        <input
                          type="text"
                          value={infirmaryForm.motif}
                          onChange={(e) => setInfirmaryForm({ ...infirmaryForm, motif: e.target.value })}
                          placeholder="Ex: Maux de ventre, Chute cour de récréation"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Soin ou Médicament</label>
                        <input
                          type="text"
                          value={infirmaryForm.treatment}
                          onChange={(e) => setInfirmaryForm({ ...infirmaryForm, treatment: e.target.value })}
                          placeholder="Ex: Paracétamol, Pansement, Repos"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Décision Médicale</label>
                        <select
                          value={infirmaryForm.decision}
                          onChange={(e) => setInfirmaryForm({ ...infirmaryForm, decision: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 outline-none"
                        >
                          <option value="Retour en classe">Retour en classe</option>
                          <option value="Repos à l’infirmerie (1h)">Repos à l’infirmerie (1h)</option>
                          <option value="Évacuation vers le centre médical">Évacuation médicale</option>
                          <option value="Appel aux parents pour retour domicile">Appel aux parents (retour maison)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-nature-700 hover:bg-nature-800 text-white font-bold rounded-xl shadow-xs transition-smooth cursor-pointer"
                      >
                        Enregistrer au Registre
                      </button>
                    </form>
                  </div>

                  {/* Registre des consultations */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <span>Registre des Passages & Soins Récents</span>
                      <span className="text-[10px] text-slate-500 font-normal">Confidentiel médical</span>
                    </h3>

                    <div className="space-y-3">
                      {infirmaryLog.map((rec) => (
                        <div key={rec.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{rec.studentName}</span>
                              <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                {rec.classroom}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">{rec.date}</span>
                          </div>

                          <div className="text-xs text-slate-700 space-y-0.5">
                            <div>• <strong>Motif :</strong> {rec.motif}</div>
                            <div>• <strong>Traitement :</strong> {rec.treatment}</div>
                            <div>• <strong>Décision :</strong> <span className="font-semibold text-nature-800">{rec.decision}</span></div>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">Parent : {rec.guardianPhone}</span>
                            <a
                              href={getWhatsAppAlertMedical(rec)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-lg border border-emerald-200 transition-smooth"
                            >
                              <ChatCircleText size={13} weight="bold" />
                              <span>Alerter le Parent (WhatsApp)</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  CONTENU ONGLET 4 : INTERNAT & DORTOIRS
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === 'boarding' && modulesConfig.boarding_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bed size={20} className="text-rose-700" />
                        <h3 className="text-sm font-bold text-slate-900">Pavillon A (Filles)</h3>
                      </div>
                      <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded">
                        28 / 32 lits occupés
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Surveillante générale : Mme KABORE Mariam (+226 70 88 99 00)
                    </p>
                    <div className="space-y-1.5 pt-1 border-t border-slate-100 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span>Chambre 101 (4 lits)</span>
                        <span className="font-mono text-emerald-700 font-bold">Complet (4/4)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span>Chambre 102 (4 lits)</span>
                        <span className="font-mono text-slate-600">3/4 occupés (1 libre)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Chambre 103 (4 lits)</span>
                        <span className="font-mono text-emerald-700 font-bold">Complet (4/4)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bed size={20} className="text-blue-700" />
                        <h3 className="text-sm font-bold text-slate-900">Pavillon B (Garçons)</h3>
                      </div>
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                        35 / 40 lits occupés
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Surveillant général : M. SAWADOGO Paul (+226 76 11 22 44)
                    </p>
                    <div className="space-y-1.5 pt-1 border-t border-slate-100 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span>Chambre 201 (6 lits)</span>
                        <span className="font-mono text-emerald-700 font-bold">Complet (6/6)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span>Chambre 202 (6 lits)</span>
                        <span className="font-mono text-slate-600">5/6 occupés (1 libre)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Chambre 203 (6 lits)</span>
                        <span className="font-mono text-slate-600">4/6 occupés (2 libres)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Chargement des services...</div>}>
      <ServicesContent />
    </Suspense>
  );
}
