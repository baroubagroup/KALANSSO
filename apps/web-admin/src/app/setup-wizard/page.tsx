'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Buildings,
  GraduationCap,
  CalendarBlank,
  CurrencyDollar,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash,
  Sparkle,
  ShieldCheck,
  Check,
} from '@phosphor-icons/react';

// Classes officielles par cycle en Afrique de l'Ouest
interface DefaultClassDef {
  name: string;
  level: string;
  capacity: number;
  defaultTuition: number;
}

const CYCLE_DEFINITIONS: Record<string, {
  label: string;
  sub: string;
  defaultClasses: DefaultClassDef[];
}> = {
  CRECHE_MATERNELLE: {
    label: 'Crèche & Maternelle',
    sub: 'Petite Section (PS), Moyenne Section (MS), Grande Section (GS)',
    defaultClasses: [
      { name: 'Petite Section (PS)', level: 'PS', capacity: 35, defaultTuition: 45000 },
      { name: 'Moyenne Section (MS)', level: 'MS', capacity: 35, defaultTuition: 45000 },
      { name: 'Grande Section (GS)', level: 'GS', capacity: 40, defaultTuition: 50000 },
    ],
  },
  PRIMAIRE: {
    label: 'Enseignement Primaire',
    sub: 'CP1, CP2, CE1, CE2, CM1, CM2 (Examen CEP)',
    defaultClasses: [
      { name: 'CP1 (Cours Préparatoire 1)', level: 'CP1', capacity: 50, defaultTuition: 55000 },
      { name: 'CP2 (Cours Préparatoire 2)', level: 'CP2', capacity: 50, defaultTuition: 55000 },
      { name: 'CE1 (Cours Élémentaire 1)', level: 'CE1', capacity: 55, defaultTuition: 60000 },
      { name: 'CE2 (Cours Élémentaire 2)', level: 'CE2', capacity: 55, defaultTuition: 60000 },
      { name: 'CM1 (Cours Moyen 1)', level: 'CM1', capacity: 60, defaultTuition: 65000 },
      { name: 'CM2 (Candidats Examen CEP)', level: 'CM2', capacity: 60, defaultTuition: 75000 },
    ],
  },
  POST_PRIMAIRE_COLLEGE: {
    label: 'Post-Primaire / Collège',
    sub: '6ème, 5ème, 4ème, 3ème (Examen BEPC)',
    defaultClasses: [
      { name: '6ème', level: '6EME', capacity: 60, defaultTuition: 85000 },
      { name: '5ème', level: '5EME', capacity: 60, defaultTuition: 85000 },
      { name: '4ème', level: '4EME', capacity: 65, defaultTuition: 95000 },
      { name: '3ème (Candidats Examen BEPC)', level: '3EME', capacity: 65, defaultTuition: 110000 },
    ],
  },
  SECONDAIRE_LYCEE: {
    label: 'Secondaire Général / Lycée',
    sub: '2nde A/C, 1ère A/D, Terminale A/D (Examen BAC)',
    defaultClasses: [
      { name: 'Seconde A (Littéraire)', level: '2NDE_A', capacity: 60, defaultTuition: 125000 },
      { name: 'Seconde C (Scientifique)', level: '2NDE_C', capacity: 60, defaultTuition: 130000 },
      { name: 'Première A4 (Lettres & Philo)', level: '1ERE_A4', capacity: 60, defaultTuition: 135000 },
      { name: 'Première D (Sciences de la Vie)', level: '1ERE_D', capacity: 60, defaultTuition: 140000 },
      { name: 'Terminale A4 (Candidats BAC A)', level: 'TLE_A4', capacity: 65, defaultTuition: 160000 },
      { name: 'Terminale D (Candidats BAC D)', level: 'TLE_D', capacity: 65, defaultTuition: 170000 },
    ],
  },
  TECHNIQUE_PROFESSIONNEL: {
    label: 'Enseignement Technique & Pro',
    sub: 'BEP Comptabilité, Séries G2, F3, F4 (BAC Technique)',
    defaultClasses: [
      { name: '1ère Année BEP Comptabilité', level: 'BEP1_COMPTA', capacity: 50, defaultTuition: 140000 },
      { name: '2ème Année BEP Comptabilité', level: 'BEP2_COMPTA', capacity: 50, defaultTuition: 150000 },
      { name: '1ère G2 (Gestion & Secrétariat)', level: '1ERE_G2', capacity: 55, defaultTuition: 160000 },
      { name: 'Terminale G2 (Candidats BAC G2)', level: 'TLE_G2', capacity: 55, defaultTuition: 175000 },
    ],
  },
  SUPERIEUR_UNIVERSITE: {
    label: 'Enseignement Supérieur',
    sub: 'BTS 1 & 2, Licences Professionnelles LMD',
    defaultClasses: [
      { name: 'BTS 1ère Année (Gestion & Finance)', level: 'BTS_1', capacity: 45, defaultTuition: 260000 },
      { name: 'BTS 2ème Année (Diplôme d’État)', level: 'BTS_2', capacity: 45, defaultTuition: 290000 },
      { name: 'Licence 3 (Management & Audit)', level: 'LICENCE_3', capacity: 40, defaultTuition: 360000 },
    ],
  },
};

interface ClassroomItem {
  id: string;
  name: string;
  level: string;
  cycle: string;
  capacity: number;
  tuition: number;
}

export default function SetupWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Étape 1 : Profil de l'Établissement
  const [schoolName, setSchoolName] = useState('Complexe Scolaire Wend-Manegda');
  const [schoolType, setSchoolType] = useState('PRIVATE_LAIC');
  const [codeMenapln, setCodeMenapln] = useState('MENAPLN-BF-0042');
  const [city, setCity] = useState('Ouagadougou');
  const [phone, setPhone] = useState('+226 70 20 30 40');
  const [email, setEmail] = useState('direction@wendmanegda.bf');
  const [motto, setMotto] = useState('Discipline - Travail - Succès');

  // Étape 2 : Cycles et Classes Dynamiques
  const [activeCycles, setActiveCycles] = useState<string[]>(['CRECHE_MATERNELLE', 'PRIMAIRE']);
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);

  // Étape 3 : Découpage temporel & Évaluations
  const [periodType, setPeriodType] = useState<'TRIMESTER' | 'SEMESTER'>('TRIMESTER');
  const [gradingScale, setGradingScale] = useState<number>(20);
  const [examWeightedCoeff, setExamWeightedCoeff] = useState(true);

  // Étape 4 : Frais annexes & Échéanciers
  const [registrationFee, setRegistrationFee] = useState<number>(35000);
  const [canteenFee, setCanteenFee] = useState<number>(30000);
  const [uniformFee, setUniformFee] = useState<number>(15000);
  const [installments, setInstallments] = useState<number>(3);

  // Génération dynamique des classes selon les cycles cochés
  const generateClassesFromCycles = (selectedCycles: string[]): ClassroomItem[] => {
    const list: ClassroomItem[] = [];
    selectedCycles.forEach((cycleKey) => {
      const cycleDef = CYCLE_DEFINITIONS[cycleKey];
      if (cycleDef) {
        cycleDef.defaultClasses.forEach((c, idx) => {
          list.push({
            id: `${cycleKey}_${c.level}_${idx}`,
            name: c.name,
            level: c.level,
            cycle: cycleKey,
            capacity: c.capacity,
            tuition: c.defaultTuition,
          });
        });
      }
    });
    return list;
  };

  // Au premier chargement : initialiser ou rediriger si déjà configuré
  useEffect(() => {
    try {
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const isReconfigure = urlParams?.get('reconfigure') === 'true';
      const saved = localStorage.getItem('kalansso_school_config');
      if (saved) {
        if (!isReconfigure) {
          // Établissement déjà configuré : redirection immédiate vers le tableau de bord
          router.replace('/dashboard');
          return;
        }
        const parsed = JSON.parse(saved);
        if (parsed.schoolName) setSchoolName(parsed.schoolName);
        if (parsed.city) setCity(parsed.city);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.motto) setMotto(parsed.motto);
        if (Array.isArray(parsed.activeCycles) && parsed.activeCycles.length > 0) {
          setActiveCycles(parsed.activeCycles);
          if (Array.isArray(parsed.classrooms) && parsed.classrooms.length > 0) {
            setClassrooms(parsed.classrooms.map((c: any, i: number) => ({
              id: c.id || `cls_${i}`,
              name: c.name,
              level: c.level || 'CUSTOM',
              cycle: c.cycle || 'PRIMAIRE',
              capacity: Number(c.capacity) || 50,
              tuition: Number(c.tuition) || 60000,
            })));
            return;
          }
        }
      }
    } catch {}
    // Par défaut
    setClassrooms(generateClassesFromCycles(['CRECHE_MATERNELLE', 'PRIMAIRE']));
  }, [router]);

  // Cocher / Décocher un cycle : mise à jour instantanée et dynamique des classes
  const handleToggleCycle = (cycleKey: string) => {
    let nextCycles: string[];
    if (activeCycles.includes(cycleKey)) {
      nextCycles = activeCycles.filter((c) => c !== cycleKey);
    } else {
      nextCycles = [...activeCycles, cycleKey];
    }
    setActiveCycles(nextCycles);
    setClassrooms(generateClassesFromCycles(nextCycles));
  };

  // Préréglages rapides en un clic
  const handleSelectPreset = (presetCycles: string[]) => {
    setActiveCycles(presetCycles);
    setClassrooms(generateClassesFromCycles(presetCycles));
  };

  // Gestion des classes
  const handleUpdateTuition = (id: string, val: number) => {
    setClassrooms((prev) =>
      prev.map((c) => (c.id === id ? { ...c, tuition: Math.max(0, val) } : c))
    );
  };

  const handleUpdateCapacity = (id: string, val: number) => {
    setClassrooms((prev) =>
      prev.map((c) => (c.id === id ? { ...c, capacity: Math.max(1, val) } : c))
    );
  };

  const handleUpdateName = (id: string, val: string) => {
    setClassrooms((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: val } : c))
    );
  };

  const handleRemoveClass = (id: string) => {
    setClassrooms((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddCustomClass = () => {
    const newId = `custom_${Date.now()}`;
    const defaultCycle = activeCycles[0] || 'PRIMAIRE';
    setClassrooms((prev) => [
      ...prev,
      {
        id: newId,
        name: `Nouvelle Division ${prev.length + 1}`,
        level: 'CUSTOM',
        cycle: defaultCycle,
        capacity: 50,
        tuition: 65000,
      },
    ]);
  };

  // Calculs synthétiques
  const totalCapacity = classrooms.reduce((s, c) => s + (c.capacity || 0), 0);
  const totalTheoreticalRevenue = classrooms.reduce((s, c) => s + (c.capacity * c.tuition), 0);

  // Enregistrement final
  const handleSaveAndLaunch = async () => {
    setIsSubmitting(true);

    const fullConfig = {
      schoolName,
      schoolType,
      codeMenapln,
      city,
      phone,
      email,
      motto,
      activeCycles,
      activeCyclesCount: activeCycles.length,
      classrooms,
      periodType,
      gradingScale,
      examWeightedCoeff,
      registrationFee,
      canteenFee,
      uniformFee,
      installments,
      configuredAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem('kalansso_school_config', JSON.stringify(fullConfig));
      window.dispatchEvent(new Event('kalansso_school_updated'));

      // Persistance Supabase en arrière-plan
      const { data: existingSchool } = await supabase.from('schools').select('id').limit(1);
      let schoolId = existingSchool && existingSchool[0] ? existingSchool[0].id : null;

      if (schoolId) {
        await supabase.from('schools').update({
          name: schoolName,
          code_menapln: codeMenapln,
          city: city,
          phone: phone,
          motto: motto,
        }).eq('id', schoolId);
      }
    } catch (e) {
      console.error('Supabase wizard sync error', e);
    }

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  // ── ÉCRAN DE SUCCÈS ÉPURÉ & MODERNE ──
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-lg w-full rounded-2xl border border-slate-200 shadow-sm p-8 text-center animate-fade-in">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-200">
            <Check size={28} weight="bold" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Configuration Terminée !
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Votre établissement <strong className="text-slate-900">{schoolName}</strong> est prêt sur kalansso os.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500">Établissement & Ville</span>
              <span className="font-semibold text-slate-900">{schoolName} ({city})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Cycles scolaires actifs</span>
              <span className="font-semibold text-slate-900">{activeCycles.length} cycle(s) configuré(s)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Classes actives & places</span>
              <span className="font-semibold text-slate-900">{classrooms.length} classes ({totalCapacity} places)</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-500">Budget prévisionnel scolarité</span>
              <span className="font-bold text-nature-700 bg-nature-50 border border-nature-200 px-2 py-0.5 rounded">
                {totalTheoreticalRevenue.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={goToDashboard}
            className="w-full py-3 bg-nature-700 hover:bg-nature-800 text-white font-semibold rounded-xl transition-smooth shadow-sm text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Accéder au Tableau de Bord</span>
            <ArrowRight size={16} weight="bold" />
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { num: 1, title: 'Identité', icon: <Buildings size={16} weight="bold" /> },
    { num: 2, title: 'Cycles & Classes', icon: <GraduationCap size={16} weight="bold" /> },
    { num: 3, title: 'Évaluations', icon: <CalendarBlank size={16} weight="bold" /> },
    { num: 4, title: 'Grille Tarifaire', icon: <CurrencyDollar size={16} weight="bold" /> },
    { num: 5, title: 'Lancement', icon: <ShieldCheck size={16} weight="bold" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* ── En-tête moderne ── */}
      <header className="bg-white border-b border-slate-200 h-14 px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-nature-700 text-white font-black text-sm flex items-center justify-center">
              K
            </div>
            <span className="font-bold text-slate-900 text-sm">kalansso os</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-medium text-slate-500">Configuration en 5 étapes</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-smooth"
          >
            Passer au tableau de bord
          </Link>
        </div>
      </header>

      {/* ── Stepper horizontal épuré ── */}
      <div className="bg-white border-b border-slate-200 py-3 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {steps.map((st, i) => {
            const isActive = currentStep === st.num;
            const isCompleted = currentStep > st.num;
            return (
              <React.Fragment key={st.num}>
                {i > 0 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded-full transition-smooth ${
                      currentStep > i ? 'bg-nature-700' : 'bg-slate-200'
                    }`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setCurrentStep(st.num)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth cursor-pointer ${
                    isActive
                      ? 'bg-nature-700 text-white shadow-sm'
                      : isCompleted
                      ? 'text-nature-700 bg-nature-50'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <span className="flex-shrink-0">{isCompleted ? <CheckCircle size={14} weight="fill" /> : st.icon}</span>
                  <span className="hidden sm:inline">{st.title}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Contenu principal du formulaire ── */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8">
        {/* ÉTAPE 1 : Identité de l'établissement */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">1. Identité de l&apos;Établissement</h2>
              <p className="text-xs text-slate-500 mt-0.5">Renseignez les coordonnées officielles de votre école.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nom officiel de l&apos;établissement *
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Ex : Complexe Scolaire Wend-Manegda"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Statut juridique
                </label>
                <select
                  value={schoolType}
                  onChange={(e) => setSchoolType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                >
                  <option value="PRIVATE_LAIC">Privé Laïc</option>
                  <option value="PRIVATE_CATHOLIC">Privé Catholique</option>
                  <option value="PRIVATE_PROTESTANT">Privé Protestant</option>
                  <option value="PRIVATE_ISLAMIC">Privé Franco-Arabe / Islamique</option>
                  <option value="PUBLIC">Public d&apos;État</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Code MENAPLN / Agrément
                </label>
                <input
                  type="text"
                  value={codeMenapln}
                  onChange={(e) => setCodeMenapln(e.target.value)}
                  placeholder="Ex : MENAPLN-BF-0042"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ville & Pays
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex : Ouagadougou, Burkina Faso"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Téléphone du secrétariat
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+226 70 20 30 40"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Devise de l&apos;école
                </label>
                <input
                  type="text"
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  placeholder="Ex : Discipline - Travail - Succès"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                />
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 : Cycles & Classes Dynamiques */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">2. Cycles d&apos;Études & Classes Dynamiques</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cochez les cycles de votre établissement. Les classes officielles et leurs paliers se créent instantanément.
                </p>
              </div>

              {/* Raccourcis modèles en 1 clic */}
              <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Modèles rapides :</span>
                <button
                  type="button"
                  onClick={() => handleSelectPreset(['PRIMAIRE'])}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-smooth cursor-pointer"
                >
                  Primaire seul (CP1-CM2)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset(['CRECHE_MATERNELLE', 'PRIMAIRE'])}
                  className="px-3 py-1 bg-nature-50 border border-nature-200 text-nature-800 text-xs font-semibold rounded-lg transition-smooth cursor-pointer"
                >
                  Maternelle + Primaire
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset(['POST_PRIMAIRE_COLLEGE', 'SECONDAIRE_LYCEE'])}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-smooth cursor-pointer"
                >
                  Collège + Lycée
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset(['CRECHE_MATERNELLE', 'PRIMAIRE', 'POST_PRIMAIRE_COLLEGE', 'SECONDAIRE_LYCEE'])}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-smooth cursor-pointer"
                >
                  Groupe Complet (Maternelle au BAC)
                </button>
              </div>

              {/* Sélecteur des 6 cycles officiels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(CYCLE_DEFINITIONS).map(([cycleKey, def]) => {
                  const isChecked = activeCycles.includes(cycleKey);
                  return (
                    <label
                      key={cycleKey}
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-smooth cursor-pointer ${
                        isChecked
                          ? 'border-nature-600 bg-nature-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCycle(cycleKey)}
                        className="mt-0.5 w-4 h-4 rounded accent-nature-700 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900">{def.label}</span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {def.defaultClasses.length} classes
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{def.sub}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Liste générée dynamiquement des classes */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Classes Configurées ({classrooms.length} classes actives · {totalCapacity} places au total)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chaque classe a sa propre capacité et son tarif de scolarité propre. Vous pouvez les renommer ou en ajouter.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomClass}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-smooth cursor-pointer"
                >
                  <Plus size={13} weight="bold" />
                  Ajouter une division
                </button>
              </div>

              {classrooms.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Aucun cycle sélectionné. Cochez au moins un cycle ci-dessus pour générer vos classes.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {classrooms.map((cls) => (
                    <div key={cls.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-smooth">
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={cls.name}
                          onChange={(e) => handleUpdateName(cls.id, e.target.value)}
                          className="font-semibold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-nature-500 outline-none w-full max-w-md py-0.5 transition-smooth"
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-nature-700 bg-nature-50 px-2 py-0.5 rounded border border-nature-100">
                            {cls.cycle.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">Code: {cls.level}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] text-slate-500 font-medium">Capacité :</label>
                          <input
                            type="number"
                            value={cls.capacity}
                            onChange={(e) => handleUpdateCapacity(cls.id, parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 text-center font-semibold"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] text-slate-500 font-medium">Scolarité :</label>
                          <input
                            type="number"
                            step="5000"
                            value={cls.tuition}
                            onChange={(e) => handleUpdateTuition(cls.id, parseInt(e.target.value) || 0)}
                            className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 text-right font-semibold"
                          />
                          <span className="text-[11px] text-slate-400 font-medium">F</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveClass(cls.id)}
                          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-smooth cursor-pointer"
                          title="Supprimer cette classe"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : Découpage temporel & Évaluations */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">3. Découpage Temporel & Système de Notation</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configurez le calendrier scolaire et les barèmes de calcul des moyennes officielles.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Découpage temporel officiel
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-smooth cursor-pointer ${
                      periodType === 'TRIMESTER'
                        ? 'border-nature-600 bg-nature-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="periodType"
                      checked={periodType === 'TRIMESTER'}
                      onChange={() => setPeriodType('TRIMESTER')}
                      className="mt-0.5 accent-nature-700 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-bold text-slate-900">Trimestriel (3 Trimestres)</span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Format officiel MENAPLN primaire et secondaire : T1, T2, T3 et Bilan Annuel récapitulatif.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-smooth cursor-pointer ${
                      periodType === 'SEMESTER'
                        ? 'border-nature-600 bg-nature-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="periodType"
                      checked={periodType === 'SEMESTER'}
                      onChange={() => setPeriodType('SEMESTER')}
                      className="mt-0.5 accent-nature-700 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-bold text-slate-900">Semestriel (2 Semestres)</span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Système LMD et enseignement technique supérieur : S1, S2 et session de rattrapage.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Barème de notation officiel
                  </label>
                  <select
                    value={gradingScale}
                    onChange={(e) => setGradingScale(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  >
                    <option value={20}>Sur 20 (Standard Francophone / MENAPLN)</option>
                    <option value={10}>Sur 10 (Élémentaire / Maternelle)</option>
                    <option value={100}>Sur 100 (Système Bilingue / International)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Pondération Devoirs / Compositions
                  </label>
                  <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-semibold">
                    (Devoirs + 2 × Compo) / 3 — Formule MENAPLN
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 4 : Grille Tarifaire Détaillée & Échéanciers */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">4. Frais Généraux & Échéancier de Recouvrement</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Définissez le calendrier d&apos;encaissement par tranches pour la caisse et Mobile Money.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Frais d&apos;inscription (FCFA)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={registrationFee}
                    onChange={(e) => setRegistrationFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cantine trimestrielle (FCFA)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={canteenFee}
                    onChange={(e) => setCanteenFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tenue scolaire / Tissu (FCFA)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={uniformFee}
                    onChange={(e) => setUniformFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nombre de tranches d&apos;échéances autorisées
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { count: 1, label: 'Paiement unique', desc: '100% à l’inscription' },
                    { count: 2, label: '2 Tranches', desc: '50% à la rentrée · 50% en janvier' },
                    { count: 3, label: '3 Tranches (Recommandé)', desc: 'Octobre · Janvier · Avril' },
                  ].map((tr) => (
                    <button
                      key={tr.count}
                      type="button"
                      onClick={() => setInstallments(tr.count)}
                      className={`p-3 text-left rounded-xl border transition-smooth cursor-pointer ${
                        installments === tr.count
                          ? 'border-nature-600 bg-nature-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{tr.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{tr.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Récapitulatif des tarifs par classe configurée */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                Synthèse des Tarifs Différenciés par Niveau
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {classrooms.map((cls) => (
                  <div key={cls.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{cls.name}</div>
                      <div className="text-[10px] text-slate-400">{cls.capacity} élèves prévus</div>
                    </div>
                    <div className="text-xs font-bold text-nature-700">
                      {cls.tuition.toLocaleString('fr-FR')} F
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 5 : Lancement & Récapitulatif */}
        {currentStep === 5 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">5. Prêt à Déployer votre École !</h2>
              <p className="text-xs text-slate-500 mt-1">
                Toutes les données sont vérifiées. Cliquez pour enregistrer et ouvrir votre tableau de bord.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Établissement</div>
                <div className="text-sm font-bold text-slate-900 mt-1 truncate" title={schoolName}>{schoolName}</div>
                <div className="text-[11px] text-slate-500">{city}</div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cycles Actifs</div>
                <div className="text-xl font-bold text-slate-900 mt-1">{activeCycles.length}</div>
                <div className="text-[11px] text-slate-500">Maternelle à Lycée</div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Classes & Places</div>
                <div className="text-xl font-bold text-slate-900 mt-1">{classrooms.length}</div>
                <div className="text-[11px] text-slate-500">{totalCapacity} apprenants</div>
              </div>

              <div className="p-4 bg-nature-50 border border-nature-200 rounded-xl text-center">
                <div className="text-xs text-nature-700 font-bold uppercase tracking-wider">Budget Annuel</div>
                <div className="text-lg font-bold text-nature-800 mt-1">
                  {(totalTheoreticalRevenue / 1000000).toFixed(1)} M FCFA
                </div>
                <div className="text-[10px] text-nature-600">Scolarité théorique</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveAndLaunch}
                className="flex-1 py-3.5 bg-nature-700 hover:bg-nature-800 text-white font-bold rounded-xl transition-smooth shadow-sm text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Initialisation du système...</span>
                ) : (
                  <>
                    <ShieldCheck size={18} weight="bold" />
                    <span>Lancer et Enregistrer mon Établissement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Boutons de navigation Précédent / Suivant ── */}
        <div className="mt-6 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg border border-slate-200 transition-smooth cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Précédent</span>
            </button>
          ) : <div />}

          {currentStep < 5 && (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-nature-700 hover:bg-nature-800 text-white text-sm font-semibold rounded-lg transition-smooth shadow-sm cursor-pointer ml-auto"
            >
              <span>Continuer</span>
              <ArrowRight size={15} weight="bold" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
