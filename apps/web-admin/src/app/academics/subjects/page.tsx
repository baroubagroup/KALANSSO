'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { getSchoolSettings, SchoolSettings, DEFAULT_SCHOOL } from '@/lib/schoolSettings';
import { getActiveAcademicYear } from '@/lib/academicYear';
import { supabase } from '@/lib/supabase';
import {
  getAllSubjects,
  saveAllSubjects,
  resetToBurkinaDefaultSubjects,
  SubjectItem,
  EducationCycle,
  SubjectCategory,
} from '@/lib/subjectsConfig';
import { BurkinaCoatOfArms } from '@/components/motifs/BurkinaCoatOfArms';
import { AfricanMotif } from '@/components/motifs/AfricanMotif';
import {
  BookOpen,
  Plus,
  Trash,
  PencilSimple,
  CheckCircle,
  XCircle,
  ArrowsClockwise,
  Printer,
  ShieldCheck,
  GraduationCap,
  Sparkle,
  X,
  FloppyDisk,
  Chalkboard,
  SlidersHorizontal,
  Check,
} from '@phosphor-icons/react';

export default function SubjectsPage() {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [academicYear, setAcademicYear] = useState(getActiveAcademicYear());
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [classrooms, setClassrooms] = useState<{ id: string; name: string; cycle: string }[]>([]);

  // Filtres
  const [cycleFilter, setCycleFilter] = useState<'ALL' | EducationCycle>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Modale d'ajout / édition
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Formulaire modal
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCycle, setFormCycle] = useState<EducationCycle>('LYCEE');
  const [formCategory, setFormCategory] = useState<SubjectCategory>('SCIENTIFIQUE');
  const [formCoefficient, setFormCoefficient] = useState<number>(4);
  const [formMaxScore, setFormMaxScore] = useState<number>(20);

  // 1. Charger réglages & année
  useEffect(() => {
    async function load() {
      const s = await getSchoolSettings();
      setSchoolSettings(s);
    }
    load();
    window.addEventListener('kalansso_school_updated', load);

    function handleYear(e: any) {
      if (e.detail?.year) setAcademicYear(e.detail.year);
    }
    window.addEventListener('kalansso_academic_year_changed', handleYear);

    return () => {
      window.removeEventListener('kalansso_school_updated', load);
      window.removeEventListener('kalansso_academic_year_changed', handleYear);
    };
  }, []);

  // 2. Charger les matières
  useEffect(() => {
    function loadSubs() {
      setSubjects(getAllSubjects());
    }
    loadSubs();
    window.addEventListener('kalansso_subjects_updated', loadSubs);
    return () => window.removeEventListener('kalansso_subjects_updated', loadSubs);
  }, []);

  // 3. Charger les classes de Supabase
  useEffect(() => {
    async function loadClasses() {
      try {
        const { data } = await supabase.from('classrooms').select('id, name, cycle').order('name');
        if (data && data.length > 0) {
          setClassrooms(data);
        }
      } catch {}
    }
    loadClasses();
  }, []);

  // Filtrage des matières
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      // 1. Filtre par cycle
      if (cycleFilter !== 'ALL' && s.cycle !== cycleFilter) return false;

      // 2. Filtre par catégorie
      if (categoryFilter !== 'ALL' && s.category !== categoryFilter) return false;

      // 3. Filtre par classe sélectionnée
      if (selectedClassId !== 'ALL') {
        const targetClass = classrooms.find((c) => c.id === selectedClassId);
        if (targetClass) {
          if (targetClass.cycle !== s.cycle) return false;
        }
      }

      // 4. Recherche textuelle
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchCode = s.code.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }

      return true;
    });
  }, [subjects, cycleFilter, categoryFilter, selectedClassId, classrooms, search]);

  // Sauvegarde des matières
  const handleSaveList = (newList: SubjectItem[]) => {
    setSubjects(newList);
    saveAllSubjects(newList);
  };

  // Toggle Actif / Inactif
  const toggleSubjectActive = (id: string) => {
    const updated = subjects.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s));
    handleSaveList(updated);
  };

  // Mise à jour rapide du coefficient
  const handleQuickCoeffChange = (id: string, newCoeff: number) => {
    if (newCoeff < 1 || newCoeff > 20) return;
    const updated = subjects.map((s) => (s.id === id ? { ...s, coefficient: newCoeff } : s));
    handleSaveList(updated);
  };

  // Suppression d'une matière
  const handleDelete = (id: string) => {
    const updated = subjects.filter((s) => s.id !== id);
    handleSaveList(updated);
  };

  // Réinitialiser au barème officiel MENAPLN
  const handleResetDefault = () => {
    if (window.confirm('Voulez-vous rétablir l’ensemble des matières et coefficients officiels du MENAPLN Burkina Faso ? Vos personnalisations seront réinitialisées.')) {
      const def = resetToBurkinaDefaultSubjects();
      setSubjects(def);
    }
  };

  // Ouvrir modal ajout
  const openAddModal = () => {
    setEditingId(null);
    setFormName('');
    setFormCode('');
    setFormCycle(cycleFilter === 'ALL' ? 'LYCEE' : cycleFilter);
    setFormCategory('SCIENTIFIQUE');
    setFormCoefficient(formCycle === 'PRIMAIRE' ? 2 : 4);
    setFormMaxScore(formCycle === 'PRIMAIRE' ? 10 : 20);
    setModalOpen(true);
  };

  // Ouvrir modal édition
  const openEditModal = (item: SubjectItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormCode(item.code);
    setFormCycle(item.cycle);
    setFormCategory(item.category);
    setFormCoefficient(item.coefficient);
    setFormMaxScore(item.maxScore);
    setModalOpen(true);
  };

  // Soumission modal
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingId) {
      const updated = subjects.map((s) => {
        if (s.id === editingId) {
          return {
            ...s,
            name: formName.trim(),
            code: formCode.trim().toUpperCase() || formName.trim().substring(0, 4).toUpperCase(),
            cycle: formCycle,
            category: formCategory,
            coefficient: Number(formCoefficient) || 1,
            maxScore: Number(formMaxScore) || 20,
          };
        }
        return s;
      });
      handleSaveList(updated);
    } else {
      const newSub: SubjectItem = {
        id: 'sub-custom-' + Date.now(),
        name: formName.trim(),
        code: formCode.trim().toUpperCase() || formName.trim().substring(0, 4).toUpperCase(),
        cycle: formCycle,
        category: formCategory,
        classrooms: ['ALL'],
        coefficient: Number(formCoefficient) || 1,
        maxScore: Number(formMaxScore) || (formCycle === 'PRIMAIRE' ? 10 : 20),
        isActive: true,
        isCustom: true,
      };
      handleSaveList([newSub, ...subjects]);
    }

    setModalOpen(false);
  };

  // Calcul du total des coefficients affichés
  const totalCoefficients = filteredSubjects.filter((s) => s.isActive).reduce((acc, s) => acc + Number(s.coefficient), 0);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <div className="print:hidden h-full">
        <ErpSidebar schoolName={schoolSettings.name} city={schoolSettings.city} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:p-0">
        <div className="print:hidden">
          <ErpHeader
            schoolName={schoolSettings.name}
            title="Matières, Barèmes & Coefficients Officiels"
            breadcrumbs={[
              { label: 'Tableau de Bord', href: '/dashboard' },
              { label: 'Pédagogie', href: '/academics' },
              { label: 'Matières & Coefficients' },
            ]}
          />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 print:p-0 print:overflow-visible">
          {/* Bandeau d'en-tête */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-nature-700 bg-nature-50 px-2 py-0.5 rounded border border-nature-100 flex items-center gap-1">
                  <ShieldCheck size={12} weight="fill" />
                  Conforme Barème Officiel MENAPLN (Burkina Faso)
                </span>
                <span className="text-xs text-slate-400">Année Académique {academicYear}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">Programme des Matières & Coefficients</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Personnalisez les disciplines, les pondérations par classe et le barème de notation (sur 20 ou sur 10).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefault}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-smooth cursor-pointer shadow-2xs"
                title="Rétablir les coefficients types nationaux"
              >
                <ArrowsClockwise size={14} weight="bold" />
                <span>Rétablir Barème MENAPLN</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-smooth cursor-pointer shadow-xs"
              >
                <Printer size={15} weight="bold" />
                <span>Imprimer Tableau Officiel A4</span>
              </button>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-nature-700 hover:bg-nature-800 text-white font-bold text-xs rounded-lg transition-smooth cursor-pointer shadow-xs"
              >
                <Plus size={15} weight="bold" />
                <span>Nouvelle Matière</span>
              </button>
            </div>
          </div>

          {/* 3 Cartes Métriques */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Matières Actives</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {filteredSubjects.filter((s) => s.isActive).length} disciplines
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Pondérées pour le calcul des moyennes et rangs
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cumul des Coefficients</span>
              <div className="text-2xl font-black text-nature-800 mt-1">
                Total : {totalCoefficients}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Diviseur officiel des moyennes pondérées
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cycle Sélectionné</span>
              <div className="text-xl font-black text-blue-700 mt-1 uppercase">
                {cycleFilter === 'ALL' ? 'Tous les Cycles' : cycleFilter}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {cycleFilter === 'PRIMAIRE' ? 'Notation sur 10 · 6 Paliers' : 'Notation sur 20 · Examens BEPC/BAC'}
              </span>
            </div>
          </div>

          {/* Barre de filtrage avancée */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Sélecteur de Cycle */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg font-bold">
                {[
                  { id: 'ALL', label: 'Tous les Cycles' },
                  { id: 'PRIMAIRE', label: 'Primaire (CP-CM2)' },
                  { id: 'COLLEGE', label: 'Collège (6ème-3ème)' },
                  { id: 'LYCEE', label: 'Lycée (2nde-Tle D)' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCycleFilter(c.id as any)}
                    className={`px-3 py-1.5 rounded transition-smooth cursor-pointer ${
                      cycleFilter === c.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Filtre par Classe Réelle */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 uppercase text-[10px]">Classe :</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-nature-600 cursor-pointer"
                >
                  <option value="ALL">Toutes les classes du cycle</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.cycle})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre par Catégorie */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 uppercase text-[10px]">Domaine :</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-nature-600 cursor-pointer"
                >
                  <option value="ALL">Tous les domaines</option>
                  <option value="SCIENTIFIQUE">Disciplines Scientifiques</option>
                  <option value="LITTERAIRE">Disciplines Littéraires & Langues</option>
                  <option value="SCIENCES_HUMAINES">Sciences Humaines & Sociales</option>
                  <option value="ARTS_SPORT">Éducation Physique & Arts</option>
                </select>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TABLEAU DES MATIÈRES & COEFFS (Aussi imprimable A4)           */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <div id="printable-subjects-sheet" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
            {/* En-tête officiel imprimable A4 */}
            <div className="hidden print:block p-6 border-b-2 border-slate-900 font-serif text-slate-900 text-xs">
              <div className="flex items-start justify-between">
                <div className="w-56 text-left space-y-0.5">
                  <div className="text-[10px] font-bold uppercase">BURKINA FASO</div>
                  <div className="text-[9px] italic text-slate-600">Unité – Progrès – Justice</div>
                  <div className="text-[8.5pt] uppercase font-bold mt-1">MINISTÈRE DE L’ÉDUCATION NATIONALE (MENAPLN)</div>
                  <div className="text-[8pt] text-slate-600">DREPS DU CENTRE — DPENA KADIOGO</div>
                </div>

                <div className="flex flex-col items-center text-center">
                  <BurkinaCoatOfArms size={40} />
                  <div className="text-[12pt] font-black uppercase text-nature-900 mt-1">{schoolSettings.name}</div>
                  <div className="text-[8pt] text-slate-500 font-mono">Agrément N° {schoolSettings.approval_number || '2019-042/MENAPLN'}</div>
                </div>

                <div className="w-56 text-right space-y-0.5">
                  <div className="text-[10pt] font-bold uppercase text-nature-800">ANNÉE SCOLAIRE {academicYear}</div>
                  <div className="text-[8.5pt] font-bold">RÉPERTOIRE OFFICIEL DES MATIÈRES & COEFFICIENTS</div>
                  <div className="text-[8pt] text-slate-500">Ouagadougou, le {new Date().toLocaleDateString('fr-FR')}</div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                    <th className="px-4 py-3 w-16">Code</th>
                    <th className="px-4 py-3">Intitulé de la Matière / Discipline</th>
                    <th className="px-4 py-3">Domaine / Catégorie</th>
                    <th className="px-4 py-3">Cycle d&apos;Enseignement</th>
                    <th className="px-4 py-3 text-center">Barème Max</th>
                    <th className="px-4 py-3 text-center w-36">Coefficient</th>
                    <th className="px-4 py-3 text-center w-28 print:hidden">Statut</th>
                    <th className="px-4 py-3 text-right print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                        Aucune matière ne correspond à ce filtre.
                      </td>
                    </tr>
                  ) : (
                    filteredSubjects.map((sub) => (
                      <tr key={sub.id} className={`hover:bg-slate-50 transition-smooth ${!sub.isActive ? 'opacity-50 bg-slate-50/50' : ''}`}>
                        <td className="px-4 py-3 font-mono font-bold text-slate-600">{sub.code}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{sub.name}</div>
                          {sub.isCustom && (
                            <span className="inline-block mt-0.5 text-[9px] uppercase font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 rounded">
                              Matière Personnalisée
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              sub.category === 'SCIENTIFIQUE'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : sub.category === 'LITTERAIRE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : sub.category === 'SCIENCES_HUMAINES'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {sub.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{sub.cycle}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                          sur {sub.maxScore}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-1.5 justify-center print:hidden">
                            <button
                              type="button"
                              onClick={() => handleQuickCoeffChange(sub.id, sub.coefficient - 1)}
                              disabled={sub.coefficient <= 1}
                              className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs disabled:opacity-30 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-mono font-black text-sm text-nature-800">
                              {sub.coefficient}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuickCoeffChange(sub.id, sub.coefficient + 1)}
                              className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          {/* Affichage pour impression */}
                          <span className="hidden print:inline font-mono font-black text-sm">
                            Coeff {sub.coefficient}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => toggleSubjectActive(sub.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-smooth ${
                              sub.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {sub.isActive ? 'Active' : 'Désactivée'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right print:hidden">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(sub)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-smooth cursor-pointer"
                              title="Modifier la matière"
                            >
                              <PencilSimple size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(sub.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-smooth cursor-pointer"
                              title="Supprimer cette matière"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pied officiel à l'impression */}
            <div className="hidden print:block p-6 border-t-2 border-slate-900 font-serif text-slate-900 text-xs">
              <div className="grid grid-cols-2 gap-8 text-center pt-4">
                <div>
                  <div className="font-bold uppercase">Le Censeur des Études</div>
                  <div className="text-[9px] italic text-slate-500 mt-0.5">Visa de conformité des programmes</div>
                  <div className="h-16"></div>
                  <div className="font-semibold">M. COMPAORE Paul</div>
                </div>

                <div>
                  <div className="font-bold uppercase">Le Chef d’Établissement / Proviseur</div>
                  <div className="text-[9px] italic text-slate-500 mt-0.5">Pour homologation et scellement</div>
                  <div className="h-16 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border border-dashed border-slate-400 flex items-center justify-center text-[8px] text-slate-400 uppercase tracking-widest text-center">
                      Cachet Officiel
                    </div>
                  </div>
                  <div className="font-bold text-nature-900">{schoolSettings.director_name || 'M. ILBOUDO Marc'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* MODAL NOUVELLE MATIÈRE / MODIFICATION                         */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="font-bold text-sm flex items-center gap-2">
                    <BookOpen size={18} weight="bold" />
                    <span>{editingId ? 'Modifier la Matière' : 'Ajouter une Nouvelle Matière'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="text-slate-400 hover:text-white transition-smooth"
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>

                <form onSubmit={handleModalSubmit} className="p-6 space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Intitulé officiel de la Matière *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex : Informatique & TICE, Arabe, Musique..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-nature-600 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Code Abrégé *
                      </label>
                      <input
                        type="text"
                        required
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="Ex : INFO, ARAB"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-nature-600 font-mono font-bold uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Cycle d&apos;Enseignement *
                      </label>
                      <select
                        value={formCycle}
                        onChange={(e) => {
                          const c = e.target.value as EducationCycle;
                          setFormCycle(c);
                          if (c === 'PRIMAIRE') setFormMaxScore(10);
                          else setFormMaxScore(20);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-nature-600 bg-white font-bold"
                      >
                        <option value="PRIMAIRE">Primaire (CP-CM2)</option>
                        <option value="COLLEGE">Collège (6ème-3ème)</option>
                        <option value="LYCEE">Lycée (2nde-Tle)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Coefficient *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        required
                        value={formCoefficient}
                        onChange={(e) => setFormCoefficient(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-nature-600 font-mono font-bold"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Barème Max *
                      </label>
                      <select
                        value={formMaxScore}
                        onChange={(e) => setFormMaxScore(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-nature-600 bg-white font-mono font-bold"
                      >
                        <option value="20">sur 20</option>
                        <option value="10">sur 10</option>
                      </select>
                    </div>

                    <div className="col-span-1">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Domaine
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-nature-600 bg-white text-[11px] font-bold"
                      >
                        <option value="SCIENTIFIQUE">Sciences</option>
                        <option value="LITTERAIRE">Lettres</option>
                        <option value="SCIENCES_HUMAINES">Humaines</option>
                        <option value="ARTS_SPORT">Arts & EPS</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-nature-700 hover:bg-nature-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <FloppyDisk size={16} weight="bold" />
                      <span>{editingId ? 'Mettre à jour' : 'Enregistrer la Matière'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* RÈGLES D'IMPRESSION A4 PORTRAIT */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        @media print {
          body * {
            visibility: hidden !important;
          }

          #printable-subjects-sheet,
          #printable-subjects-sheet * {
            visibility: visible !important;
          }

          #printable-subjects-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          html,
          body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
