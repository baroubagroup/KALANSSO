'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { supabase } from '@/lib/supabase';
import { getSchoolSettings, SchoolSettings, DEFAULT_SCHOOL } from '@/lib/schoolSettings';
import {
  Chalkboard,
  Plus,
  PencilSimple,
  Trash,
  Users,
  CurrencyDollar,
  GraduationCap,
  MagnifyingGlass,
  CheckCircle,
  X,
  CaretRight,
  NotePencil,
  CalendarBlank,
  Buildings,
} from '@phosphor-icons/react';

interface ClassroomRecord {
  id: string;
  school_id: string;
  name: string;
  level: string;
  cycle: string;
  capacity: number;
  tuition_fee: number;
  enrolled_count?: number;
}

const CYCLE_OPTIONS = [
  { value: 'ALL', label: 'Tous les cycles' },
  { value: 'PRIMAIRE', label: 'Primaire (CP1 - CM2)' },
  { value: 'COLLEGE', label: 'Collège / Post-Primaire (6ème - 3ème)' },
  { value: 'LYCEE', label: 'Lycée / Secondaire (2nde - Tle)' },
  { value: 'MATERNELLE', label: 'Maternelle (Petite - Grande)' },
];

const LEVEL_PRESETS: Record<string, { label: string; cycle: string }> = {
  PS: { label: 'Petite Section', cycle: 'MATERNELLE' },
  MS: { label: 'Moyenne Section', cycle: 'MATERNELLE' },
  GS: { label: 'Grande Section', cycle: 'MATERNELLE' },
  CP1: { label: 'CP1 (Cours Préparatoire 1)', cycle: 'PRIMAIRE' },
  CP2: { label: 'CP2 (Cours Préparatoire 2)', cycle: 'PRIMAIRE' },
  CE1: { label: 'CE1 (Cours Élémentaire 1)', cycle: 'PRIMAIRE' },
  CE2: { label: 'CE2 (Cours Élémentaire 2)', cycle: 'PRIMAIRE' },
  CM1: { label: 'CM1 (Cours Moyen 1)', cycle: 'PRIMAIRE' },
  CM2: { label: 'CM2 (Candidats Examen CEP)', cycle: 'PRIMAIRE' },
  '6EME': { label: '6ème', cycle: 'COLLEGE' },
  '5EME': { label: '5ème', cycle: 'COLLEGE' },
  '4EME': { label: '4ème', cycle: 'COLLEGE' },
  '3EME': { label: '3ème (Candidats Examen BEPC)', cycle: 'COLLEGE' },
  '2NDE_A': { label: 'Seconde A', cycle: 'LYCEE' },
  '2NDE_C': { label: 'Seconde C', cycle: 'LYCEE' },
  '1ERE_A': { label: 'Première A', cycle: 'LYCEE' },
  '1ERE_D': { label: 'Première D', cycle: 'LYCEE' },
  TLE_A: { label: 'Terminale A', cycle: 'LYCEE' },
  TLE_D: { label: 'Terminale D (Candidats BAC D)', cycle: 'LYCEE' },
};

function fmt(n: number) {
  return Number(n || 0).toLocaleString('fr-FR') + ' FCFA';
}

export default function ClassesPage() {
  const [school, setSchool] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [classrooms, setClassrooms] = useState<ClassroomRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCycle, setActiveCycle] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassroomRecord | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalLevel, setModalLevel] = useState('CP1');
  const [modalCycle, setModalCycle] = useState('PRIMAIRE');
  const [modalCapacity, setModalCapacity] = useState('55');
  const [modalTuition, setModalTuition] = useState('60000');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const s = await getSchoolSettings();
      setSchool(s);

      // Fetch live classrooms
      const { data: clsRows, error: clsErr } = await supabase
        .from('classrooms')
        .select('*')
        .order('created_at', { ascending: true });

      if (clsErr) {
        console.error('Error fetching classrooms:', clsErr);
      }

      // Fetch enrolled counts per class
      const { data: stRows } = await supabase.from('students').select('classroom_id');
      const countMap: Record<string, number> = {};
      if (stRows) {
        stRows.forEach((r) => {
          if (r.classroom_id) {
            countMap[r.classroom_id] = (countMap[r.classroom_id] || 0) + 1;
          }
        });
      }

      if (clsRows) {
        const enriched = clsRows.map((c) => ({
          ...c,
          enrolled_count: countMap[c.id] || 0,
        }));
        setClassrooms(enriched);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingClass(null);
    setModalLevel('CP1');
    setModalName('CP1 (Cours Préparatoire 1)');
    setModalCycle('PRIMAIRE');
    setModalCapacity('55');
    setModalTuition('55000');
    setIsModalOpen(true);
  }

  function openEditModal(cls: ClassroomRecord) {
    setEditingClass(cls);
    setModalName(cls.name);
    setModalLevel(cls.level || 'CP1');
    setModalCycle(cls.cycle || 'PRIMAIRE');
    setModalCapacity(String(cls.capacity || 50));
    setModalTuition(String(cls.tuition_fee || 60000));
    setIsModalOpen(true);
  }

  function handleLevelChange(lvl: string) {
    setModalLevel(lvl);
    if (LEVEL_PRESETS[lvl]) {
      setModalName(LEVEL_PRESETS[lvl].label);
      setModalCycle(LEVEL_PRESETS[lvl].cycle);
    }
  }

  async function handleSaveClass(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingClass) {
        // Update existing class
        const { error } = await supabase
          .from('classrooms')
          .update({
            name: modalName.trim(),
            level: modalLevel,
            cycle: modalCycle,
            capacity: parseInt(modalCapacity) || 50,
            tuition_fee: parseInt(modalTuition) || 60000,
          })
          .eq('id', editingClass.id);

        if (error) throw error;
        setNotification(`Classe « ${modalName} » mise à jour avec succès.`);
      } else {
        // Create new class
        const { error } = await supabase.from('classrooms').insert({
          school_id: school.id || '7c2d3108-2ac7-4ff5-a344-0803cedac026',
          name: modalName.trim(),
          level: modalLevel,
          cycle: modalCycle,
          capacity: parseInt(modalCapacity) || 50,
          tuition_fee: parseInt(modalTuition) || 60000,
        });

        if (error) throw error;
        setNotification(`Nouvelle classe « ${modalName} » enregistrée dans la base.`);
      }

      setIsModalOpen(false);
      await loadData();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(`Erreur d'enregistrement : ${err.message || 'Échec de connexion Supabase'}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteClass(cls: ClassroomRecord) {
    if (cls.enrolled_count && cls.enrolled_count > 0) {
      alert(`Impossible de supprimer cette classe car ${cls.enrolled_count} élève(s) y sont actuellement inscrits. Veuillez d'abord réaffecter ces élèves.`);
      return;
    }

    if (!confirm(`Confirmez-vous la suppression définitive de la classe « ${cls.name} » ?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('classrooms').delete().eq('id', cls.id);
      if (error) throw error;
      setNotification(`Classe « ${cls.name} » supprimée.`);
      await loadData();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(`Erreur de suppression : ${err.message}`);
    }
  }

  // Filter classrooms
  const filtered = classrooms.filter((c) => {
    const matchesCycle = activeCycle === 'ALL' || c.cycle === activeCycle;
    const matchesSearch =
      search === '' ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.level?.toLowerCase().includes(search.toLowerCase());
    return matchesCycle && matchesSearch;
  });

  const totalCapacity = classrooms.reduce((acc, c) => acc + (c.capacity || 50), 0);
  const totalEnrolled = classrooms.reduce((acc, c) => acc + (c.enrolled_count || 0), 0);
  const totalPotentialTuition = classrooms.reduce((acc, c) => acc + (c.capacity || 50) * (c.tuition_fee || 0), 0);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <ErpSidebar schoolName={school.name} city={school.city} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ErpHeader
          schoolName={school.name}
          title="Gestion des Classes & Paliers Pédagogiques"
          breadcrumbs={[
            { label: 'Tableau de Bord', href: '/dashboard' },
            { label: 'Scolarité & Effectifs' },
            { label: 'Classes & Paliers' },
          ]}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* Top Banner & Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Chalkboard size={24} weight="bold" className="text-nature-700" />
                <span>Classes, Cycles & Grilles Tarifaires</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Gérez la structure pédagogique de l’établissement, les plafonds d&apos;effectifs et la scolarité annuelle.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-nature-700 hover:bg-nature-800 text-white font-bold text-xs rounded-xl shadow-xs transition-smooth cursor-pointer"
              >
                <Plus size={16} weight="bold" />
                <span>Ajouter une Classe</span>
              </button>
            </div>
          </div>

          {/* Success Notification */}
          {notification && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
              <CheckCircle size={18} weight="fill" className="text-emerald-600 flex-shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* KPI Summary Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                Classes Ouvertes
              </p>
              <div className="text-2xl font-black text-slate-900 leading-none">
                {classrooms.length}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Structure active 2026-2027</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                Capacité d&apos;Accueil
              </p>
              <div className="text-2xl font-black text-nature-700 leading-none">
                {totalCapacity}
                <span className="text-xs font-semibold text-slate-400 ml-1">places</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Plafond total autorisé</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                Élèves Enregistrés
              </p>
              <div className="text-2xl font-black text-blue-700 leading-none">
                {totalEnrolled}
                <span className="text-xs font-semibold text-slate-400 ml-1">inscrits</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Remplissage : {totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0}%
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                Potentiel Scolarités
              </p>
              <div className="text-xl font-black text-slate-900 leading-none truncate" title={fmt(totalPotentialTuition)}>
                {fmt(totalPotentialTuition)}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Projection budgétaire brute</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {CYCLE_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setActiveCycle(c.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth cursor-pointer ${
                    activeCycle === c.value
                      ? 'bg-nature-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrer une classe (ex: CP1, 3ème)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
              />
            </div>
          </div>

          {/* Classes Grid */}
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              Chargement des classes depuis Supabase...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
              <Chalkboard size={36} className="mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">Aucune classe ne correspond aux filtres.</p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-nature-700 hover:bg-nature-800 text-white text-xs font-semibold rounded-lg transition-smooth"
              >
                <Plus size={14} weight="bold" />
                <span>Créer une nouvelle classe</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((cls) => {
                const fillRatio = cls.capacity > 0 ? Math.min(100, Math.round(((cls.enrolled_count || 0) / cls.capacity) * 100)) : 0;
                const cycleColor =
                  cls.cycle === 'MATERNELLE'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : cls.cycle === 'COLLEGE'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : cls.cycle === 'LYCEE'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                return (
                  <div
                    key={cls.id}
                    className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs p-5 transition-smooth flex flex-col justify-between"
                  >
                    <div>
                      {/* Badge and action buttons */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cycleColor}`}>
                          {cls.cycle} · {cls.level}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(cls)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-nature-700 hover:bg-slate-100 transition-smooth cursor-pointer"
                            title="Modifier cette classe"
                          >
                            <PencilSimple size={15} weight="bold" />
                          </button>
                          <button
                            onClick={() => handleDeleteClass(cls)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-smooth cursor-pointer"
                            title="Supprimer cette classe"
                          >
                            <Trash size={15} weight="bold" />
                          </button>
                        </div>
                      </div>

                      {/* Class Title */}
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {cls.name}
                      </h3>

                      {/* Tuition */}
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Scolarité Annuelle</span>
                        <span className="font-bold text-slate-900">{fmt(cls.tuition_fee)}</span>
                      </div>

                      {/* Enrollment meter */}
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">
                            Effectif : <strong className="text-slate-900">{cls.enrolled_count || 0}</strong> / {cls.capacity} élèves
                          </span>
                          <span className="font-bold text-nature-700">{fillRatio}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              fillRatio >= 100
                                ? 'bg-red-500'
                                : fillRatio >= 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                            }`}
                            style={{ width: `${Math.min(fillRatio, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick navigation actions */}
                    <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-center">
                      <Link
                        href={`/students?classId=${cls.id}`}
                        className="py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition-smooth flex items-center justify-center gap-1"
                        title="Voir la liste des élèves"
                      >
                        <Users size={13} weight="bold" />
                        <span>Élèves</span>
                      </Link>

                      <Link
                        href={`/academics/grades?classId=${cls.id}`}
                        className="py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition-smooth flex items-center justify-center gap-1"
                        title="Saisir les notes"
                      >
                        <NotePencil size={13} weight="bold" />
                        <span>Notes</span>
                      </Link>

                      <Link
                        href={`/timetable?classId=${cls.id}`}
                        className="py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition-smooth flex items-center justify-center gap-1"
                        title="Emploi du temps"
                      >
                        <CalendarBlank size={13} weight="bold" />
                        <span>Planning</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* MODAL AJOUT / ÉDITION DE CLASSE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Chalkboard size={18} weight="bold" className="text-nature-700" />
                <span>{editingClass ? 'Modifier la Classe' : 'Créer une Nouvelle Classe'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-smooth cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Niveau standard de référence
                </label>
                <select
                  value={modalLevel}
                  onChange={(e) => handleLevelChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                >
                  <optgroup label="Primaire">
                    <option value="CP1">CP1</option>
                    <option value="CP2">CP2</option>
                    <option value="CE1">CE1</option>
                    <option value="CE2">CE2</option>
                    <option value="CM1">CM1</option>
                    <option value="CM2">CM2</option>
                  </optgroup>
                  <optgroup label="Collège (Post-Primaire)">
                    <option value="6EME">6ème</option>
                    <option value="5EME">5ème</option>
                    <option value="4EME">4ème</option>
                    <option value="3EME">3ème</option>
                  </optgroup>
                  <optgroup label="Lycée (Secondaire)">
                    <option value="2NDE_A">2nde A</option>
                    <option value="2NDE_C">2nde C</option>
                    <option value="1ERE_A">1ère A</option>
                    <option value="1ERE_D">1ère D</option>
                    <option value="TLE_A">Terminale A</option>
                    <option value="TLE_D">Terminale D</option>
                  </optgroup>
                  <optgroup label="Maternelle">
                    <option value="PS">Petite Section</option>
                    <option value="MS">Moyenne Section</option>
                    <option value="GS">Grande Section</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Libellé officiel de la classe *
                </label>
                <input
                  type="text"
                  required
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="Ex: CP1 (Cours Préparatoire 1) ou 6ème A"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cycle d&apos;enseignement
                  </label>
                  <select
                    value={modalCycle}
                    onChange={(e) => setModalCycle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  >
                    <option value="PRIMAIRE">PRIMAIRE</option>
                    <option value="COLLEGE">COLLEGE</option>
                    <option value="LYCEE">LYCEE</option>
                    <option value="MATERNELLE">MATERNELLE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Capacité max (élèves)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    required
                    value={modalCapacity}
                    onChange={(e) => setModalCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Frais de scolarité annuels (FCFA) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={modalTuition}
                  onChange={(e) => setModalTuition(e.target.value)}
                  placeholder="Ex : 60000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Ce montant sera appliqué automatiquement lors de l&apos;inscription et au guichet de caisse.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-smooth cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-nature-700 hover:bg-nature-800 text-white text-xs font-bold rounded-lg transition-smooth cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Enregistrement...' : editingClass ? 'Enregistrer les Modifications' : 'Créer la Classe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
