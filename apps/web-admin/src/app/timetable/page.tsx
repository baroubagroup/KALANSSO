'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { getSchoolSettings, SchoolSettings, DEFAULT_SCHOOL } from '@/lib/schoolSettings';
import { getActiveAcademicYear } from '@/lib/academicYear';
import { supabase } from '@/lib/supabase';
import { BurkinaCoatOfArms } from '@/components/motifs/BurkinaCoatOfArms';
import { AfricanMotif } from '@/components/motifs/AfricanMotif';
import {
  CalendarBlank,
  Clock,
  Printer,
  Plus,
  Chalkboard,
  User,
  WarningCircle,
  CheckCircle,
  X,
  Trash,
  PencilSimple,
  FloppyDisk,
  ArrowsClockwise,
  ShieldCheck,
  Buildings,
  GraduationCap,
  Sparkle,
} from '@phosphor-icons/react';

export type WeekDay = 'LUNDI' | 'MARDI' | 'MERCREDI' | 'JEUDI' | 'VENDREDI' | 'SAMEDI';

export interface TimeSlotDef {
  index: number;
  label: string;
  start: string;
  end: string;
  period: 'MATIN' | 'SOIR';
}

export const TIME_SLOTS: TimeSlotDef[] = [
  { index: 0, label: '07h30 – 08h25', start: '07:30', end: '08:25', period: 'MATIN' },
  { index: 1, label: '08h25 – 09h20', start: '08:25', end: '09:20', period: 'MATIN' },
  // Récréation du Matin : 09h20 – 09h35
  { index: 2, label: '09h35 – 10h30', start: '09:35', end: '10:30', period: 'MATIN' },
  { index: 3, label: '10h30 – 11h25', start: '10:30', end: '11:25', period: 'MATIN' },
  { index: 4, label: '11h25 – 12h20', start: '11:25', end: '12:20', period: 'MATIN' },
  // Pause Méridienne : 12h20 – 15h00
  { index: 5, label: '15h00 – 15h55', start: '15:00', end: '15:55', period: 'SOIR' },
  { index: 6, label: '15h55 – 16h50', start: '15:55', end: '16:50', period: 'SOIR' },
  { index: 7, label: '16h50 – 17h45', start: '16:50', end: '17:45', period: 'SOIR' },
];

export const DAYS: WeekDay[] = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];

export interface CourseSlot {
  id: string;
  classId: string;
  className: string;
  day: WeekDay;
  slotIndex: number;
  subject: string;
  teacherName: string;
  room: string;
  color: string;
}

const COLOR_OPTIONS = [
  { label: 'Bleu (Maths)', value: 'bg-blue-50 border-blue-300 text-blue-900' },
  { label: 'Émeraude (Français)', value: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
  { label: 'Violet (Physique-Chimie)', value: 'bg-purple-50 border-purple-300 text-purple-900' },
  { label: 'Teal (SVT / Biologie)', value: 'bg-teal-50 border-teal-300 text-teal-900' },
  { label: 'Rose (Anglais)', value: 'bg-rose-50 border-rose-300 text-rose-900' },
  { label: 'Ambre (Histoire-Géo / Philo)', value: 'bg-amber-50 border-amber-300 text-amber-900' },
  { label: 'Lime (EPS / Sport)', value: 'bg-lime-50 border-lime-300 text-lime-900' },
  { label: 'Gris Ardoise (Devoir / Surveillance)', value: 'bg-slate-100 border-slate-300 text-slate-800' },
];

const INITIAL_COURSES: CourseSlot[] = [
  // Terminale D (Terminale D)
  { id: 'c-1', classId: 'cls-tle-d', className: 'Terminale D', day: 'LUNDI', slotIndex: 0, subject: 'Mathématiques', teacherName: 'M. ILBOUDO Marc', room: 'Salle 12', color: 'bg-blue-50 border-blue-300 text-blue-900' },
  { id: 'c-2', classId: 'cls-tle-d', className: 'Terminale D', day: 'LUNDI', slotIndex: 1, subject: 'Mathématiques', teacherName: 'M. ILBOUDO Marc', room: 'Salle 12', color: 'bg-blue-50 border-blue-300 text-blue-900' },
  { id: 'c-3', classId: 'cls-tle-d', className: 'Terminale D', day: 'LUNDI', slotIndex: 2, subject: 'Histoire-Géo', teacherName: 'M. DIALLO Oumar', room: 'Salle 12', color: 'bg-amber-50 border-amber-300 text-amber-900' },
  { id: 'c-4', classId: 'cls-tle-d', className: 'Terminale D', day: 'LUNDI', slotIndex: 3, subject: 'Histoire-Géo', teacherName: 'M. DIALLO Oumar', room: 'Salle 12', color: 'bg-amber-50 border-amber-300 text-amber-900' },
  { id: 'c-5', classId: 'cls-tle-d', className: 'Terminale D', day: 'LUNDI', slotIndex: 4, subject: 'Anglais', teacherName: 'M. COMPAORE Paul', room: 'Salle 12', color: 'bg-rose-50 border-rose-300 text-rose-900' },
  { id: 'c-6', classId: 'cls-tle-d', className: 'Terminale D', day: 'LUNDI', slotIndex: 5, subject: 'SVT', teacherName: 'M. TRAORE Adama', room: 'Labo 2', color: 'bg-teal-50 border-teal-300 text-teal-900' },
  { id: 'c-7', classId: 'cls-tle-d', className: 'Terminale D', day: 'LUNDI', slotIndex: 6, subject: 'SVT', teacherName: 'M. TRAORE Adama', room: 'Labo 2', color: 'bg-teal-50 border-teal-300 text-teal-900' },

  { id: 'c-8', classId: 'cls-tle-d', className: 'Terminale D', day: 'MARDI', slotIndex: 0, subject: 'Français', teacherName: 'Mme KABORE Salimata', room: 'Salle 12', color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
  { id: 'c-9', classId: 'cls-tle-d', className: 'Terminale D', day: 'MARDI', slotIndex: 1, subject: 'Français', teacherName: 'Mme KABORE Salimata', room: 'Salle 12', color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
  { id: 'c-10', classId: 'cls-tle-d', className: 'Terminale D', day: 'MARDI', slotIndex: 2, subject: 'Physique-Chimie', teacherName: 'Mme SAWADOGO Patricia', room: 'Labo 1', color: 'bg-purple-50 border-purple-300 text-purple-900' },
  { id: 'c-11', classId: 'cls-tle-d', className: 'Terminale D', day: 'MARDI', slotIndex: 3, subject: 'Physique-Chimie', teacherName: 'Mme SAWADOGO Patricia', room: 'Labo 1', color: 'bg-purple-50 border-purple-300 text-purple-900' },

  { id: 'c-12', classId: 'cls-tle-d', className: 'Terminale D', day: 'MERCREDI', slotIndex: 0, subject: 'Physique-Chimie', teacherName: 'Mme SAWADOGO Patricia', room: 'Labo 1', color: 'bg-purple-50 border-purple-300 text-purple-900' },
  { id: 'c-13', classId: 'cls-tle-d', className: 'Terminale D', day: 'MERCREDI', slotIndex: 1, subject: 'Physique-Chimie', teacherName: 'Mme SAWADOGO Patricia', room: 'Labo 1', color: 'bg-purple-50 border-purple-300 text-purple-900' },
  { id: 'c-14', classId: 'cls-tle-d', className: 'Terminale D', day: 'MERCREDI', slotIndex: 2, subject: 'EPS (Sport)', teacherName: 'M. ZONGO Éric', room: 'Terrain', color: 'bg-lime-50 border-lime-300 text-lime-900' },
  { id: 'c-15', classId: 'cls-tle-d', className: 'Terminale D', day: 'MERCREDI', slotIndex: 3, subject: 'EPS (Sport)', teacherName: 'M. ZONGO Éric', room: 'Terrain', color: 'bg-lime-50 border-lime-300 text-lime-900' },

  { id: 'c-16', classId: 'cls-tle-d', className: 'Terminale D', day: 'JEUDI', slotIndex: 0, subject: 'Philosophie', teacherName: 'Mme KABORE Salimata', room: 'Salle 12', color: 'bg-amber-50 border-amber-300 text-amber-900' },
  { id: 'c-17', classId: 'cls-tle-d', className: 'Terminale D', day: 'JEUDI', slotIndex: 1, subject: 'Philosophie', teacherName: 'Mme KABORE Salimata', room: 'Salle 12', color: 'bg-amber-50 border-amber-300 text-amber-900' },
  { id: 'c-18', classId: 'cls-tle-d', className: 'Terminale D', day: 'JEUDI', slotIndex: 2, subject: 'Mathématiques', teacherName: 'M. ILBOUDO Marc', room: 'Salle 12', color: 'bg-blue-50 border-blue-300 text-blue-900' },
  { id: 'c-19', classId: 'cls-tle-d', className: 'Terminale D', day: 'JEUDI', slotIndex: 3, subject: 'Mathématiques', teacherName: 'M. ILBOUDO Marc', room: 'Salle 12', color: 'bg-blue-50 border-blue-300 text-blue-900' },

  { id: 'c-20', classId: 'cls-tle-d', className: 'Terminale D', day: 'VENDREDI', slotIndex: 0, subject: 'SVT', teacherName: 'M. TRAORE Adama', room: 'Labo 2', color: 'bg-teal-50 border-teal-300 text-teal-900' },
  { id: 'c-21', classId: 'cls-tle-d', className: 'Terminale D', day: 'VENDREDI', slotIndex: 1, subject: 'SVT', teacherName: 'M. TRAORE Adama', room: 'Labo 2', color: 'bg-teal-50 border-teal-300 text-teal-900' },
  { id: 'c-22', classId: 'cls-tle-d', className: 'Terminale D', day: 'VENDREDI', slotIndex: 2, subject: 'Anglais', teacherName: 'M. COMPAORE Paul', room: 'Salle 12', color: 'bg-rose-50 border-rose-300 text-rose-900' },
  { id: 'c-23', classId: 'cls-tle-d', className: 'Terminale D', day: 'VENDREDI', slotIndex: 3, subject: 'Histoire-Géo', teacherName: 'M. DIALLO Oumar', room: 'Salle 12', color: 'bg-amber-50 border-amber-300 text-amber-900' },

  { id: 'c-24', classId: 'cls-tle-d', className: 'Terminale D', day: 'SAMEDI', slotIndex: 0, subject: 'Devoir Surveillé', teacherName: 'Surveillant Général', room: 'Salle 12', color: 'bg-slate-100 border-slate-300 text-slate-800' },
  { id: 'c-25', classId: 'cls-tle-d', className: 'Terminale D', day: 'SAMEDI', slotIndex: 1, subject: 'Devoir Surveillé', teacherName: 'Surveillant Général', room: 'Salle 12', color: 'bg-slate-100 border-slate-300 text-slate-800' },

  // 3ème (Collège)
  { id: 'c-26', classId: 'cls-3eme', className: '3ème', day: 'LUNDI', slotIndex: 0, subject: 'Français', teacherName: 'Mme KABORE Salimata', room: 'Salle 14', color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
  { id: 'c-27', classId: 'cls-3eme', className: '3ème', day: 'LUNDI', slotIndex: 1, subject: 'Français', teacherName: 'Mme KABORE Salimata', room: 'Salle 14', color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
  { id: 'c-28', classId: 'cls-3eme', className: '3ème', day: 'LUNDI', slotIndex: 2, subject: 'Anglais', teacherName: 'M. COMPAORE Paul', room: 'Salle 14', color: 'bg-rose-50 border-rose-300 text-rose-900' },
  { id: 'c-29', classId: 'cls-3eme', className: '3ème', day: 'MARDI', slotIndex: 0, subject: 'Mathématiques', teacherName: 'M. ILBOUDO Marc', room: 'Salle 14', color: 'bg-blue-50 border-blue-300 text-blue-900' },
  { id: 'c-30', classId: 'cls-3eme', className: '3ème', day: 'MARDI', slotIndex: 1, subject: 'Mathématiques', teacherName: 'M. ILBOUDO Marc', room: 'Salle 14', color: 'bg-blue-50 border-blue-300 text-blue-900' },
  { id: 'c-31', classId: 'cls-3eme', className: '3ème', day: 'JEUDI', slotIndex: 2, subject: 'Physique-Chimie', teacherName: 'Mme SAWADOGO Patricia', room: 'Labo 1', color: 'bg-purple-50 border-purple-300 text-purple-900' },

  // CM2 (Primaire - Maître Titulaire)
  { id: 'c-32', classId: 'cls-cm2', className: 'CM2', day: 'LUNDI', slotIndex: 0, subject: 'Calcul & Problèmes', teacherName: 'M. OUEDRAOGO Moussa', room: 'Salle 04', color: 'bg-blue-50 border-blue-300 text-blue-900' },
  { id: 'c-33', classId: 'cls-cm2', className: 'CM2', day: 'LUNDI', slotIndex: 1, subject: 'Grammaire & Vocabulaire', teacherName: 'M. OUEDRAOGO Moussa', room: 'Salle 04', color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
  { id: 'c-34', classId: 'cls-cm2', className: 'CM2', day: 'LUNDI', slotIndex: 2, subject: 'Histoire & Géographie', teacherName: 'M. OUEDRAOGO Moussa', room: 'Salle 04', color: 'bg-amber-50 border-amber-300 text-amber-900' },
  { id: 'c-35', classId: 'cls-cm2', className: 'CM2', day: 'LUNDI', slotIndex: 3, subject: 'Sciences d’Observation', teacherName: 'M. OUEDRAOGO Moussa', room: 'Salle 04', color: 'bg-teal-50 border-teal-300 text-teal-900' },
];

const TEACHERS_LIST = [
  'M. ILBOUDO Marc',
  'Mme KABORE Salimata',
  'Mme SAWADOGO Patricia',
  'M. COMPAORE Paul',
  'M. DIALLO Oumar',
  'M. TRAORE Adama',
  'M. OUEDRAOGO Moussa',
  'Mme ZONGO Mariam',
  'M. ZONGO Éric',
  'Surveillant Général',
];

const ROOMS_LIST = [
  'Salle 12 (Lycée)',
  'Salle 14 (Collège)',
  'Salle 08 (Collège)',
  'Salle 04 (Primaire CM2)',
  'Salle 02 (Primaire CP1)',
  'Labo 1 (Physique-Chimie)',
  'Labo 2 (SVT)',
  'Terrain de Sport',
];

export default function TimetablePage() {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [academicYear, setAcademicYear] = useState(getActiveAcademicYear());
  const [classrooms, setClassrooms] = useState<{ id: string; name: string; cycle: string }[]>([]);

  // Mode de visualisation : PAR CLASSE ou PAR ENSEIGNANT
  const [viewMode, setViewMode] = useState<'CLASS' | 'TEACHER'>('CLASS');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>(TEACHERS_LIST[0]);

  // Tous les cours de l'école (persistés dans localStorage)
  const [courses, setCourses] = useState<CourseSlot[]>(INITIAL_COURSES);

  // Modal d'ajout / modification de créneau
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Champs du formulaire modal
  const [slotDay, setSlotDay] = useState<WeekDay>('LUNDI');
  const [slotTimeIndex, setSlotTimeIndex] = useState<number>(0);
  const [slotSubject, setSlotSubject] = useState('Mathématiques');
  const [slotTeacher, setSlotTeacher] = useState(TEACHERS_LIST[0]);
  const [slotRoom, setSlotRoom] = useState(ROOMS_LIST[0]);
  const [slotColor, setSlotColor] = useState(COLOR_OPTIONS[0].value);

  // 1. Charger paramètres établissement & Année
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

  // 2. Charger les cours enregistrés depuis localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kalansso_timetables_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCourses(parsed);
          return;
        }
      }
    } catch {}
  }, []);

  // 3. Charger les classes réelles depuis Supabase
  useEffect(() => {
    async function loadClasses() {
      try {
        const { data, error } = await supabase
          .from('classrooms')
          .select('id, name, cycle')
          .order('name');

        if (!error && data && data.length > 0) {
          setClassrooms(data);
          // Sélectionne par défaut la Terminale D ou la 1ère classe
          const defaultCls = data.find((c) => c.name.toLowerCase().includes('terminale')) || data[0];
          setSelectedClassId(defaultCls.id);
        }
      } catch (err) {
        console.error('Erreur chargement classes:', err);
      }
    }
    loadClasses();
  }, []);

  // Sauvegarder les cours
  const saveCourses = (newCourses: CourseSlot[]) => {
    setCourses(newCourses);
    try {
      localStorage.setItem('kalansso_timetables_v2', JSON.stringify(newCourses));
    } catch {}
  };

  const activeClass = classrooms.find((c) => c.id === selectedClassId) || {
    id: selectedClassId || 'cls-tle-d',
    name: 'Terminale D',
    cycle: 'LYCEE',
  };

  // 4. MOTEUR DE DÉTECTION DES CONFLITS EN TEMPS RÉEL (Sans chevauchement)
  const conflictsMap = useMemo(() => {
    // Map de clé "day-slotIndex" -> liste de conflits
    const teacherUsage = new Map<string, CourseSlot[]>();
    const roomUsage = new Map<string, CourseSlot[]>();

    courses.forEach((c) => {
      // Clé Enseignant : jour + créneau + enseignant
      const tKey = `${c.day}-${c.slotIndex}-${c.teacherName.trim().toLowerCase()}`;
      if (!teacherUsage.has(tKey)) teacherUsage.set(tKey, []);
      teacherUsage.get(tKey)!.push(c);

      // Clé Salle : jour + créneau + salle
      const rKey = `${c.day}-${c.slotIndex}-${c.room.trim().toLowerCase()}`;
      if (!roomUsage.has(rKey)) roomUsage.set(rKey, []);
      roomUsage.get(rKey)!.push(c);
    });

    const conflicts = new Map<string, { type: 'TEACHER' | 'ROOM'; description: string }[]>();

    // Marquer les conflits enseignants
    teacherUsage.forEach((list, key) => {
      if (list.length > 1) {
        // Deux cours ou plus pour le même enseignant au même moment
        list.forEach((c) => {
          if (!conflicts.has(c.id)) conflicts.set(c.id, []);
          const others = list.filter((x) => x.id !== c.id).map((x) => x.className).join(', ');
          conflicts.get(c.id)!.push({
            type: 'TEACHER',
            description: `Chevauchement Enseignant : ${c.teacherName} a également cours en ${others}`,
          });
        });
      }
    });

    // Marquer les conflits de salle
    roomUsage.forEach((list, key) => {
      if (list.length > 1) {
        list.forEach((c) => {
          if (!conflicts.has(c.id)) conflicts.set(c.id, []);
          const others = list.filter((x) => x.id !== c.id).map((x) => x.className).join(', ');
          conflicts.get(c.id)!.push({
            type: 'ROOM',
            description: `Salle doublement occupée : ${c.room} est aussi réservée pour ${others}`,
          });
        });
      }
    });

    return conflicts;
  }, [courses]);

  // Cours affichés selon le filtre actif (Classe ou Enseignant)
  const displayedCourses = useMemo(() => {
    if (viewMode === 'CLASS') {
      return courses.filter((c) => c.classId === activeClass.id || c.className.toLowerCase() === activeClass.name.toLowerCase());
    } else {
      return courses.filter((c) => c.teacherName.trim().toLowerCase() === selectedTeacher.trim().toLowerCase());
    }
  }, [courses, viewMode, activeClass, selectedTeacher]);

  // Nombre total de conflits globaux dans l'établissement
  const totalConflictsCount = conflictsMap.size;

  // Calcul du volume hebdomadaire dispensé sur la grille affichée
  const totalHoursCount = displayedCourses.length;

  // Ouverture du modal pour ajouter un nouveau créneau
  const handleOpenAddModal = (day: WeekDay, slotIndex: number) => {
    setEditingCourseId(null);
    setSlotDay(day);
    setSlotTimeIndex(slotIndex);
    setSlotSubject('Mathématiques');
    setSlotTeacher(TEACHERS_LIST[0]);
    setSlotRoom(ROOMS_LIST[0]);
    setSlotColor(COLOR_OPTIONS[0].value);
    setModalOpen(true);
  };

  // Ouverture du modal pour modifier un créneau existant
  const handleOpenEditModal = (course: CourseSlot) => {
    setEditingCourseId(course.id);
    setSlotDay(course.day);
    setSlotTimeIndex(course.slotIndex);
    setSlotSubject(course.subject);
    setSlotTeacher(course.teacherName);
    setSlotRoom(course.room);
    setSlotColor(course.color);
    setModalOpen(true);
  };

  // Enregistrer ou mettre à jour un créneau
  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCourseId) {
      // Modification
      const updated = courses.map((c) => {
        if (c.id === editingCourseId) {
          return {
            ...c,
            day: slotDay,
            slotIndex: slotTimeIndex,
            subject: slotSubject.trim(),
            teacherName: slotTeacher,
            room: slotRoom,
            color: slotColor,
          };
        }
        return c;
      });
      saveCourses(updated);
    } else {
      // Nouveau cours
      const newCourse: CourseSlot = {
        id: 'slot-' + Date.now(),
        classId: activeClass.id,
        className: activeClass.name,
        day: slotDay,
        slotIndex: slotTimeIndex,
        subject: slotSubject.trim(),
        teacherName: slotTeacher,
        room: slotRoom,
        color: slotColor,
      };
      saveCourses([...courses, newCourse]);
    }

    setModalOpen(false);
  };

  // Supprimer un cours
  const handleDeleteCourse = (id: string) => {
    const updated = courses.filter((c) => c.id !== id);
    saveCourses(updated);
    setModalOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <div className="print:hidden h-full">
        <ErpSidebar schoolName={schoolSettings.name} city={schoolSettings.city} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:p-0">
        <div className="print:hidden">
          <ErpHeader
            schoolName={schoolSettings.name}
            title="Emplois du Temps & Planning Hebdomadaire"
            breadcrumbs={[
              { label: 'Tableau de Bord', href: '/dashboard' },
              { label: 'Pédagogie', href: '/academics' },
              { label: 'Emplois du Temps' },
            ]}
          />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 print:p-0 print:overflow-visible">
          {/* BANDEAU DE CONTRÔLE & FILTRES (Masqué à l'impression) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-nature-700 bg-nature-50 px-2 py-0.5 rounded border border-nature-100 flex items-center gap-1">
                  <ShieldCheck size={12} weight="fill" />
                  Direction Pédagogique & Censure
                </span>
                <span className="text-xs text-slate-400">Année Académique {academicYear}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">Générateur d’Emplois du Temps Sans Conflit</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Vérification automatique des disponibilités des professeurs et des salles de cours en temps réel.
              </p>
            </div>

            {/* Actions & Impression */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Statut Conflits */}
              {totalConflictsCount === 0 ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold shadow-2xs">
                  <CheckCircle size={15} weight="fill" className="text-emerald-600" />
                  <span>0 Conflit · Planning 100% Conforme</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs font-bold animate-pulse shadow-2xs">
                  <WarningCircle size={15} weight="fill" className="text-red-600" />
                  <span>{totalConflictsCount} Chevauchement(s) détecté(s)</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-nature-700 hover:bg-nature-800 text-white font-bold text-xs rounded-xl transition-smooth flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer size={16} weight="bold" />
                <span>Imprimer Emploi du Temps (A4 Paysage)</span>
              </button>
            </div>
          </div>

          {/* BARRE D'OUTILS DE SÉLECTION (Vue par Classe vs Vue par Professeur) */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Mode d&apos;Affichage :</span>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode('CLASS')}
                  className={`px-3 py-1 rounded transition-smooth cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'CLASS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Chalkboard size={14} weight="bold" />
                  <span>Par Classe</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('TEACHER')}
                  className={`px-3 py-1 rounded transition-smooth cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'TEACHER' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User size={14} weight="bold" />
                  <span>Par Enseignant</span>
                </button>
              </div>
            </div>

            {/* Sélecteur de Classe ou d'Enseignant */}
            <div className="flex items-center gap-2">
              {viewMode === 'CLASS' ? (
                <>
                  <span className="font-bold text-slate-700">Classe Sélectionnée :</span>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-nature-600 cursor-pointer min-w-[220px]"
                  >
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.cycle})
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <span className="font-bold text-slate-700">Enseignant :</span>
                  <select
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-nature-600 cursor-pointer min-w-[220px]"
                  >
                    {TEACHERS_LIST.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <span className="text-[11px] font-mono font-bold bg-nature-50 border border-nature-200 text-nature-800 px-2 py-1 rounded">
                Total : {totalHoursCount} h / semaine
              </span>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ZONE IMPRIMABLE A4 PAYSAGE DU PLANNING                        */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <div id="printable-timetable-sheet" className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 print:border-none print:shadow-none print:p-0">
              {/* En-tête officiel à l'impression */}
              <div className="border-b-2 border-slate-900 pb-3 mb-4">
                <div className="flex justify-between items-start">
                  <div className="w-[32%] text-left">
                    <div className="font-black uppercase text-[10px] tracking-wider text-slate-900">BURKINA FASO</div>
                    <div className="text-[9px] italic text-slate-600">Unité – Progrès – Justice</div>
                    <div className="text-[8.5pt] font-bold uppercase text-slate-800 mt-1">
                      MINISTÈRE DE L’ÉDUCATION NATIONALE (MENAPLN)
                    </div>
                    <div className="text-[8pt] text-slate-600">DREPS DU CENTRE — DPENA KADIOGO</div>
                  </div>

                  <div className="w-[36%] flex flex-col items-center text-center">
                    <div className="flex items-center gap-2 mb-1">
                      {schoolSettings.logo_url ? (
                        <div className="w-10 h-10 flex items-center justify-center">
                          <img src={schoolSettings.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                        </div>
                      ) : (
                        <BurkinaCoatOfArms size={38} />
                      )}
                      <div>
                        <div className="font-black text-sm uppercase text-nature-900 leading-tight">
                          {schoolSettings.name}
                        </div>
                        <div className="text-[8pt] text-slate-500 font-mono">
                          Agrément N° {schoolSettings.approval_number || '2019-042/MENAPLN'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-[32%] text-right space-y-0.5">
                    <div className="text-[10pt] font-black uppercase text-nature-800">
                      ANNÉE SCOLAIRE {academicYear}
                    </div>
                    <div className="text-[8pt] text-slate-600">
                      {viewMode === 'CLASS' ? `CLASSE : ${activeClass.name.toUpperCase()}` : `PROFESSEUR : ${selectedTeacher.toUpperCase()}`}
                    </div>
                    <div className="text-[7.5pt] font-mono text-slate-500">
                      Édition officielle du {new Date().toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>

                {/* Titre central solennel de la grille */}
                <div className="text-center mt-2 pt-2 border-t border-slate-200">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-950">
                    {viewMode === 'CLASS'
                      ? `EMPLOI DU TEMPS OFFICIEL DE LA CLASSE DE ${activeClass.name.toUpperCase()}`
                      : `PLANNING HORAIRE HEBDOMADAIRE — ${selectedTeacher.toUpperCase()}`}
                  </h2>
                  <div className="text-[8.5pt] text-slate-600 italic">
                    {viewMode === 'CLASS'
                      ? `Charge pédagogique globale : ${totalHoursCount} heures par semaine · Conforme au volume horaire national`
                      : `Service hebdomadaire attribué : ${totalHoursCount} heures de cours dispensées`}
                  </div>
                </div>
              </div>

              {/* GRILLE D'EMPLOI DU TEMPS */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 uppercase font-black text-[9.5pt] tracking-wider text-center">
                      <th className="p-2 w-28 text-left border-r border-slate-300 bg-slate-200/70">
                        Créneaux
                      </th>
                      {DAYS.map((day) => (
                        <th key={day} className="p-2 border-r border-slate-300 last:border-r-0">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {TIME_SLOTS.map((slot) => {
                      // Insertion de la récréation du matin après le créneau 1 (08h25-09h20)
                      const isAfterMorningBreak = slot.index === 2;
                      // Insertion de la pause déjeuner après le créneau 4 (11h25-12h20)
                      const isAfterLunchBreak = slot.index === 5;

                      return (
                        <React.Fragment key={`slot-row-${slot.index}`}>
                          {/* Ligne Récréation du Matin */}
                          {isAfterMorningBreak && (
                            <tr className="bg-amber-50/80 text-center border-y border-amber-200 print:bg-slate-100">
                              <td className="p-1 font-mono font-bold text-[8pt] text-amber-900 border-r border-slate-300">
                                09h20 – 09h35
                              </td>
                              <td colSpan={6} className="p-1 text-[8.5pt] font-black uppercase tracking-widest text-amber-900">
                                ☕ RÉCRÉATION DU MATIN (15 MINUTES)
                              </td>
                            </tr>
                          )}

                          {/* Ligne Pause Méridienne */}
                          {isAfterLunchBreak && (
                            <tr className="bg-slate-100 text-center border-y border-slate-300">
                              <td className="p-1 font-mono font-bold text-[8pt] text-slate-600 border-r border-slate-300">
                                12h20 – 15h00
                              </td>
                              <td colSpan={6} className="p-1 text-[8.5pt] font-black uppercase tracking-widest text-slate-700">
                                🍽️ PAUSE MÉRIDIENNE & DÉJEUNER
                              </td>
                            </tr>
                          )}

                          {/* Ligne normale du créneau */}
                          <tr className="hover:bg-slate-50/50">
                            {/* Heure */}
                            <td className="p-2 font-mono font-bold text-[9pt] text-slate-800 border-r border-slate-300 bg-slate-50/80 text-center align-middle">
                              <div>{slot.label}</div>
                              <span className="text-[7pt] text-slate-400 uppercase font-semibold">
                                {slot.period === 'MATIN' ? 'Matin' : 'Après-midi'}
                              </span>
                            </td>

                            {/* Colonnes des 6 jours */}
                            {DAYS.map((day) => {
                              // Recherche du cours sur ce jour et ce créneau
                              const course = displayedCourses.find((c) => c.day === day && c.slotIndex === slot.index);
                              const hasConflict = course && conflictsMap.has(course.id);
                              const conflictDetails = course && conflictsMap.get(course.id);

                              // Samedi après-midi libre
                              const isSaturdayAfternoon = day === 'SAMEDI' && slot.period === 'SOIR';

                              if (isSaturdayAfternoon) {
                                return (
                                  <td
                                    key={day}
                                    className="p-1.5 border-r border-slate-300 last:border-r-0 bg-slate-50/60 text-center align-middle"
                                  >
                                    <span className="text-[8pt] text-slate-400 italic">Libre</span>
                                  </td>
                                );
                              }

                              return (
                                <td
                                  key={day}
                                  className="p-1.5 border-r border-slate-300 last:border-r-0 align-top min-w-[130px] h-[52px] relative"
                                >
                                  {course ? (
                                    <div
                                      onClick={() => handleOpenEditModal(course)}
                                      className={`p-2 rounded-lg border text-left cursor-pointer transition-smooth group relative ${
                                        hasConflict
                                          ? 'border-red-500 bg-red-50 text-red-950 shadow-xs'
                                          : course.color
                                      } print:border-slate-800 print:bg-white print:text-black`}
                                      title={
                                        hasConflict
                                          ? conflictDetails?.map((d) => d.description).join('\n')
                                          : 'Cliquer pour modifier ce cours'
                                      }
                                    >
                                      {/* Alerte Conflit Clignotante */}
                                      {hasConflict && (
                                        <div className="absolute top-1 right-1 text-red-600 print:hidden animate-pulse">
                                          <WarningCircle size={15} weight="fill" />
                                        </div>
                                      )}

                                      <div className="font-bold text-[10pt] leading-tight truncate">
                                        {course.subject}
                                      </div>

                                      <div className="text-[8.5pt] opacity-90 truncate mt-0.5 font-medium">
                                        {viewMode === 'CLASS' ? course.teacherName : course.className}
                                      </div>

                                      <div className="flex items-center justify-between text-[7.5pt] font-mono mt-1 pt-0.5 border-t border-black/10">
                                        <span className="font-semibold">{course.room}</span>
                                        <span className="print:hidden text-[7pt] text-slate-400 group-hover:text-slate-800">
                                          Modifier ✎
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Créneau Libre -> Bouton d'ajout */
                                    <div
                                      onClick={() => handleOpenAddModal(day, slot.index)}
                                      className="h-full min-h-[46px] rounded-lg border border-dashed border-slate-200 hover:border-nature-500 hover:bg-nature-50/40 flex items-center justify-center text-[8pt] text-slate-300 hover:text-nature-700 cursor-pointer transition-smooth print:border-none print:text-transparent"
                                      title="Cliquer pour programmer un cours"
                                    >
                                      <span className="print:hidden">+ Ajouter</span>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Signatures officielles pour l'affichage de classe A4 Paysage */}
              <div className="pt-6 border-t border-slate-300 mt-6 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="font-bold uppercase text-[9pt]">Le Délégué de Classe</div>
                  <div className="text-[8pt] italic text-slate-500">Pour notification aux élèves</div>
                  <div className="h-14"></div>
                  <div className="text-[8.5pt] font-semibold text-slate-700">Le Responsable</div>
                </div>

                <div>
                  <div className="font-bold uppercase text-[9pt]">Le Censeur des Études</div>
                  <div className="text-[8pt] italic text-slate-500">Visa d’ordonnancement pédagogique</div>
                  <div className="h-14"></div>
                  <div className="text-[8.5pt] font-semibold text-slate-700">M. COMPAORE Paul</div>
                </div>

                <div>
                  <div className="font-bold uppercase text-[9pt]">Le Chef d’Établissement / Proviseur</div>
                  <div className="text-[8pt] italic text-slate-500">
                    Fait à {schoolSettings.city}, le {new Date().toLocaleDateString('fr-FR')}
                  </div>
                  <div className="h-14 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border border-dashed border-slate-400 flex items-center justify-center text-[7pt] text-slate-400 uppercase tracking-widest text-center">
                      Cachet Officiel
                    </div>
                  </div>
                  <div className="text-[8.5pt] font-bold text-nature-900">
                    {schoolSettings.director_name || 'M. ILBOUDO Marc'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* MODAL AJOUT / MODIFICATION D'UN CRÉNEAU DE COURS              */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="font-bold text-sm flex items-center gap-2">
                    <CalendarBlank size={18} weight="bold" />
                    <span>{editingCourseId ? 'Modifier le Créneau' : 'Programmer un Nouveau Cours'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="text-slate-400 hover:text-white transition-smooth"
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>

                <form onSubmit={handleSaveCourse} className="p-6 space-y-4 text-xs">
                  {/* Conflits prévisionnels dans le formulaire */}
                  {(() => {
                    const previewTeacherConflict = courses.find(
                      (c) =>
                        c.id !== editingCourseId &&
                        c.day === slotDay &&
                        c.slotIndex === slotTimeIndex &&
                        c.teacherName.trim().toLowerCase() === slotTeacher.trim().toLowerCase()
                    );
                    const previewRoomConflict = courses.find(
                      (c) =>
                        c.id !== editingCourseId &&
                        c.day === slotDay &&
                        c.slotIndex === slotTimeIndex &&
                        c.room.trim().toLowerCase() === slotRoom.trim().toLowerCase()
                    );

                    if (previewTeacherConflict || previewRoomConflict) {
                      return (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-red-900">
                          {previewTeacherConflict && (
                            <div className="flex items-center gap-1.5 font-bold text-[11px]">
                              <WarningCircle size={14} weight="fill" className="text-red-600 flex-shrink-0" />
                              <span>Attention : {slotTeacher} a déjà cours en {previewTeacherConflict.className} sur ce créneau !</span>
                            </div>
                          )}
                          {previewRoomConflict && (
                            <div className="flex items-center gap-1.5 font-bold text-[11px]">
                              <WarningCircle size={14} weight="fill" className="text-red-600 flex-shrink-0" />
                              <span>Attention : La salle {slotRoom} est déjà occupée par {previewRoomConflict.className} !</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Jour de cours *
                      </label>
                      <select
                        value={slotDay}
                        onChange={(e) => setSlotDay(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-nature-600 bg-white font-bold"
                      >
                        {DAYS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Horaire *
                      </label>
                      <select
                        value={slotTimeIndex}
                        onChange={(e) => setSlotTimeIndex(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-nature-600 bg-white font-mono font-bold"
                      >
                        {TIME_SLOTS.map((s) => (
                          <option key={s.index} value={s.index}>
                            {s.label} ({s.period})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Matière enseignée *
                    </label>
                    <input
                      type="text"
                      required
                      value={slotSubject}
                      onChange={(e) => setSlotSubject(e.target.value)}
                      placeholder="Ex : Mathématiques, Français, SVT..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-nature-600 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Professeur / Enseignant *
                    </label>
                    <select
                      value={slotTeacher}
                      onChange={(e) => setSlotTeacher(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-nature-600 bg-white font-semibold"
                    >
                      {TEACHERS_LIST.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Salle de classe attribuée *
                    </label>
                    <select
                      value={slotRoom}
                      onChange={(e) => setSlotRoom(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-nature-600 bg-white font-semibold"
                    >
                      {ROOMS_LIST.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Couleur du badge
                    </label>
                    <select
                      value={slotColor}
                      onChange={(e) => setSlotColor(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-nature-600 bg-white"
                    >
                      {COLOR_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                    {editingCourseId ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteCourse(editingCourseId)}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-bold flex items-center gap-1 transition-smooth cursor-pointer"
                      >
                        <Trash size={14} />
                        <span>Supprimer</span>
                      </button>
                    ) : (
                      <div></div>
                    )}

                    <div className="flex items-center gap-2">
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
                        <span>{editingCourseId ? 'Mettre à jour' : 'Enregistrer Créneau'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* RÈGLES STRICTES D'IMPRESSION A4 PAYSAGE */}
      <style jsx global>{`
        @page {
          size: A4 landscape;
          margin: 6mm;
        }

        @media print {
          body * {
            visibility: hidden !important;
          }

          #printable-timetable-sheet,
          #printable-timetable-sheet * {
            visibility: visible !important;
          }

          #printable-timetable-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 297mm !important;
            min-height: 210mm !important;
            margin: 0 !important;
            padding: 4mm 6mm !important;
            background: white !important;
            box-sizing: border-box !important;
          }

          html,
          body {
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
