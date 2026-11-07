'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { supabase } from '@/lib/supabase';
import { getSchoolSettings, SchoolSettings, DEFAULT_SCHOOL } from '@/lib/schoolSettings';
import { getActiveAcademicYear } from '@/lib/academicYear';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  FunnelSimple,
  Export,
  Plus,
  Eye,
  CurrencyDollar,
  FileText,
  UserCircle,
  Chalkboard,
  IdentificationBadge,
} from '@phosphor-icons/react';
import { getAllStudentPhotos } from '@/lib/studentPhotos';

type EnrollStatus = 'VALIDE' | 'EN_ATTENTE' | 'NON_VALIDE';

interface Student {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  classroom_id?: string;
  classe: string;
  cycle: string;
  regime: 'Externat' | 'Internat' | 'Demi-Pension';
  statut: EnrollStatus;
}

interface ClassroomItem {
  id: string;
  name: string;
  cycle: string;
}

function StatusBadge({ statut }: { statut: EnrollStatus }) {
  if (statut === 'VALIDE') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
        <CheckCircle size={10} weight="fill" />
        Validée
      </span>
    );
  }
  if (statut === 'EN_ATTENTE') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
        <Clock size={10} weight="fill" />
        En attente
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
      <XCircle size={10} weight="fill" />
      Non validée
    </span>
  );
}

function StudentsContent() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId') || 'ALL';

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClassroom, setFilterClassroom] = useState<string>(initialClassId);
  const [filterStatut, setFilterStatut] = useState<'ALL' | EnrollStatus>('ALL');
  const [selected, setSelected] = useState<string[]>([]);
  const [academicYear, setAcademicYear] = useState(getActiveAcademicYear());
  const [photosMap, setPhotosMap] = useState<Record<string, string>>({});

  useEffect(() => {
    function loadPhotos() {
      setPhotosMap(getAllStudentPhotos());
    }
    loadPhotos();
    window.addEventListener('kalansso_student_photo_updated', loadPhotos);
    return () => window.removeEventListener('kalansso_student_photo_updated', loadPhotos);
  }, []);

  useEffect(() => {
    async function loadSettings() {
      const s = await getSchoolSettings();
      setSchoolSettings(s);
    }
    loadSettings();

    function handleYear(e: any) {
      if (e.detail?.year) {
        setAcademicYear(e.detail.year);
      }
    }
    window.addEventListener('kalansso_academic_year_changed', handleYear);
    return () => window.removeEventListener('kalansso_academic_year_changed', handleYear);
  }, []);

  const fetchClassroomsAndStudents = async () => {
    setLoading(true);
    try {
      // 1. Fetch classrooms
      const { data: clsData } = await supabase
        .from('classrooms')
        .select('id, name, cycle')
        .order('name');
      if (clsData) setClassrooms(clsData);

      // 2. Fetch students
      const { data: stdData, error } = await supabase
        .from('students')
        .select('id, matricule, last_name, first_name, regime, status, classroom_id, classrooms(id, name, cycle)')
        .order('created_at', { ascending: false });

      if (!error && stdData) {
        const mapped: Student[] = stdData.map((s: any) => ({
          id: s.id,
          matricule: s.matricule,
          nom: s.last_name,
          prenom: s.first_name,
          classroom_id: s.classroom_id,
          classe: s.classrooms?.name || 'Non assigné',
          cycle: s.classrooms?.cycle || 'Général',
          regime: (s.regime as any) || 'Externat',
          statut: (s.status as EnrollStatus) || 'VALIDE',
        }));
        setStudents(mapped);
      }
    } catch (e) {
      console.error('Supabase fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassroomsAndStudents();
  }, [academicYear]);

  const filtered = students.filter((s) => {
    const matchSearch =
      s.nom.toLowerCase().includes(search.toLowerCase()) ||
      s.prenom.toLowerCase().includes(search.toLowerCase()) ||
      s.matricule.toLowerCase().includes(search.toLowerCase()) ||
      s.classe.toLowerCase().includes(search.toLowerCase());

    const matchClass = filterClassroom === 'ALL' || s.classroom_id === filterClassroom;
    const matchStatut = filterStatut === 'ALL' || s.statut === filterStatut;
    return matchSearch && matchClass && matchStatut;
  });

  const toggleAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map((s) => s.id));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <ErpSidebar schoolName={schoolSettings.name} city={schoolSettings.city} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ErpHeader
          schoolName={schoolSettings.name}
          title="Élèves & Inscriptions Scolaires"
          breadcrumbs={[
            { label: 'Tableau de Bord', href: '/dashboard' },
            { label: 'Scolarité & Effectifs' },
            { label: 'Élèves Inscrits' },
          ]}
        />

        <main className="flex-1 overflow-y-auto">
          {/* Page header */}
          <div className="bg-white border-b border-slate-200 px-8 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 rounded-full bg-nature-700 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">Liste des élèves inscrits</h2>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Supabase Connecté ({students.length})
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Année : <strong className="text-slate-800">{academicYear}</strong> · Base de données synchronisée en temps réel.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg border border-slate-200 transition-smooth cursor-pointer"
                >
                  <Export size={15} />
                  Exporter
                </button>
                <Link
                  href="/students/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-nature-700 hover:bg-nature-800 text-white text-sm font-semibold rounded-lg transition-smooth cursor-pointer shadow-xs"
                >
                  <Plus size={15} weight="bold" />
                  Nouvelle inscription
                </Link>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
                <div className="text-slate-400 flex justify-center mb-1"><Users size={18} weight="bold" /></div>
                <div className="text-xl font-black text-slate-900">{students.length}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Total Inscrits</div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
                <div className="text-emerald-600 flex justify-center mb-1"><CheckCircle size={18} weight="bold" /></div>
                <div className="text-xl font-black text-emerald-700">
                  {students.filter((s) => s.statut === 'VALIDE').length}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Dossiers Validés</div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
                <div className="text-blue-600 flex justify-center mb-1"><Chalkboard size={18} weight="bold" /></div>
                <div className="text-xl font-black text-blue-700">
                  {classrooms.length}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Classes Actives</div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
                <div className="text-nature-700 flex justify-center mb-1"><UserCircle size={18} weight="bold" /></div>
                <div className="text-xl font-black text-nature-700">
                  {filtered.length}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Affichés (Filtre)</div>
              </div>
            </div>

            {/* Filters & Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <FunnelSimple size={15} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">Filtres</span>

                {/* Recherche textuelle */}
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, prénom, matricule…"
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-nature-500 transition-smooth"
                />

                {/* Filtre Classe */}
                <select
                  value={filterClassroom}
                  onChange={(e) => setFilterClassroom(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-nature-500 cursor-pointer"
                >
                  <option value="ALL">Toutes les classes</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Filtre Statut */}
                <div className="flex items-center gap-1 ml-auto">
                  {(['ALL', 'VALIDE', 'EN_ATTENTE'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatut(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth cursor-pointer ${
                        filterStatut === s ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {s === 'ALL' ? 'Tous' : s === 'VALIDE' ? 'Validés' : 'En attente'}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  Chargement des élèves depuis Supabase...
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Users size={36} className="mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-800">Aucun élève trouvé pour cette sélection.</p>
                  <p className="text-xs text-slate-400">Modifiez vos filtres ou inscrivez un nouvel élève.</p>
                  <Link
                    href="/students/new"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-nature-700 text-white text-xs font-semibold rounded-lg"
                  >
                    <Plus size={14} weight="bold" />
                    <span>Inscrire un élève</span>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        <th className="w-10 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selected.length === filtered.length && filtered.length > 0}
                            onChange={toggleAll}
                            className="rounded border-slate-300 text-nature-700"
                          />
                        </th>
                        <th className="px-4 py-3 text-left">Matricule</th>
                        <th className="px-4 py-3 text-left">Nom & Prénom</th>
                        <th className="px-4 py-3 text-left">Classe & Cycle</th>
                        <th className="px-4 py-3 text-left">Régime</th>
                        <th className="px-4 py-3 text-center">Statut</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((student) => {
                        const isChecked = selected.includes(student.id);
                        return (
                          <tr
                            key={student.id}
                            className={`hover:bg-slate-50/80 transition-smooth ${isChecked ? 'bg-nature-50/40' : ''}`}
                          >
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleOne(student.id)}
                                className="rounded border-slate-300 text-nature-700"
                              />
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-700">
                              {student.matricule}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <Link
                                  href={`/documents?type=card&studentId=${student.id}`}
                                  className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0 text-slate-400 hover:border-nature-500 transition-smooth"
                                  title="Voir / Modifier la photo sur la carte scolaire"
                                >
                                  {photosMap[student.id] ? (
                                    <img src={photosMap[student.id]} alt={student.nom} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="font-bold text-[10px] text-slate-500">
                                      {student.nom.charAt(0)}{student.prenom.charAt(0)}
                                    </span>
                                  )}
                                </Link>
                                <Link
                                  href={`/students/${student.id}`}
                                  className="font-bold text-slate-900 hover:text-nature-700 hover:underline transition-smooth"
                                >
                                  {student.nom} {student.prenom}
                                </Link>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-800">{student.classe}</div>
                              <div className="text-[10px] text-slate-400">{student.cycle}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-medium">{student.regime}</td>
                            <td className="px-4 py-3 text-center">
                              <StatusBadge statut={student.statut} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Link
                                  href={`/students/${student.id}`}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-smooth"
                                  title="Consulter le dossier complet"
                                >
                                  <Eye size={15} />
                                </Link>
                                <Link
                                  href={`/documents?type=card&studentId=${student.id}`}
                                  className="p-1.5 rounded-lg text-nature-700 hover:text-nature-900 hover:bg-nature-50 transition-smooth font-semibold"
                                  title="Carte Scolaire (Format CNI / Bancaire)"
                                >
                                  <IdentificationBadge size={15} weight="bold" />
                                </Link>
                                <Link
                                  href={`/cashier?studentId=${student.id}`}
                                  className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-smooth font-semibold"
                                  title="Guichet caisse"
                                >
                                  <CurrencyDollar size={15} weight="bold" />
                                </Link>
                                <Link
                                  href={`/documents?type=certificate&studentId=${student.id}`}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-smooth"
                                  title="Certificat de scolarité"
                                >
                                  <FileText size={15} />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Chargement des élèves...</div>}>
      <StudentsContent />
    </Suspense>
  );
}
