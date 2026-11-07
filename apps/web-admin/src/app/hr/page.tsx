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
  SubjectItem,
  DEFAULT_BURKINA_SUBJECTS,
} from '@/lib/subjectsConfig';
import { BurkinaCoatOfArms } from '@/components/motifs/BurkinaCoatOfArms';
import { AfricanMotif } from '@/components/motifs/AfricanMotif';
import {
  Users,
  UserPlus,
  MagnifyingGlass,
  CheckCircle,
  Phone,
  EnvelopeSimple,
  IdentificationCard,
  Briefcase,
  Printer,
  DownloadSimple,
  Plus,
  PencilSimple,
  Trash,
  Chalkboard,
  GraduationCap,
  Clock,
  CalendarBlank,
  FileText,
  X,
  FloppyDisk,
  ArrowRight,
  ShieldCheck,
  Check,
  CurrencyDollar,
  Sparkle,
} from '@phosphor-icons/react';

// Contact téléphonique multiple
export interface StaffPhoneContact {
  id: string;
  label: string;
  phone: string;
}

// Affectation de cours avec taux horaire spécifique négociable par matière/classe
export interface TeachingAssignment {
  id: string;
  classroomId: string;
  className: string;
  subject: string;
  weeklyHours: number;
  hourlyRate?: number; // Taux négociable par matière/classe (ex: 4 500 FCFA/h en Tle D Maths)
}

export interface StaffMember {
  id: string;
  matricule: string;
  name: string;
  gender: 'M' | 'F';
  role: string; // Personnalisable et dynamique
  diploma: string;
  contractType: 'TITULAIRE' | 'CONTRACTUEL' | 'VACATAIRE';
  hourlyRate?: number; // FCFA / heure standard pour les vacataires
  salaryBase?: number; // FCFA / mois pour titulaires et contractuels
  mainSubject: string; // Reliée au référentiel des matières
  phone: string; // Téléphone principal
  phones: StaffPhoneContact[]; // Numéros multiples
  email?: string;
  dateJoined: string;
  status: 'ACTIF' | 'CONGE' | 'DEMISSION';
  assignments: TeachingAssignment[];
}

export interface TimesheetEntry {
  id: string;
  date: string;
  day: string;
  className: string;
  subject: string;
  timeSlot: string;
  hours: number;
  rateApplied: number;
  lineTotal: number;
  signedByTeacher: boolean;
  signedByCensor: boolean;
}

// Liste initiale de rôles standards pour l'établissement
const DEFAULT_STAFF_ROLES: string[] = [
  'Professeur du Secondaire (Lycée & Collège)',
  'Instituteur du Primaire (Maître Titulaire)',
  'Directeur des Études / Censeur',
  'Chef d’Établissement / Proviseur',
  'Surveillant Général / Éducateur',
  'Comptable / Économe',
  'Secrétaire d’Administration',
  'Superviseur d’Internat',
  'Laborantin de SVT / Physique',
  'Infirmier Scolaire',
  'Chauffeur de Transport Scolaire',
  'Agent de Sécurité / Vigile',
];

const INITIAL_STAFF: StaffMember[] = [];

// Créneaux horaires standards des lycées burkinabè
const TIMETABLE_SLOTS = [
  '07h30 - 08h25',
  '08h25 - 09h20',
  '09h35 - 10h30',
  '10h30 - 11h25',
  '11h25 - 12h20',
  '15h00 - 15h55',
  '15h55 - 16h50',
  '16h50 - 17h45',
];

const WEEK_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function HrPage() {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [academicYear, setAcademicYear] = useState(getActiveAcademicYear());
  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF);
  const [customRoles, setCustomRoles] = useState<string[]>(DEFAULT_STAFF_ROLES);
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'ASSIGNMENTS' | 'TIMESHEET_PAYROLL' | 'TEACHER_SCHEDULE' | 'MENAPLN_REPORT'>('DIRECTORY');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [contractFilter, setContractFilter] = useState<string>('ALL');

  // Classes et matières issues de Supabase / Config
  const [availableClasses, setAvailableClasses] = useState<{ id: string; name: string; cycle: string }[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<SubjectItem[]>([]);

  // Modales
  const [modalNewStaff, setModalNewStaff] = useState(false);
  const [modalEditStaff, setModalEditStaff] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [modalAssignClass, setModalAssignClass] = useState(false);
  const [selectedStaffForAssignment, setSelectedStaffForAssignment] = useState<StaffMember | null>(null);

  // Fiche Individuelle active (pour aperçu & impression A4)
  const [activeTeacherForSheet, setActiveTeacherForSheet] = useState<StaffMember | null>(null);

  // Enseignant sélectionné pour la Fiche d'Émargement / Vacations ('ALL' = Pack global complet)
  const [selectedTeacherForTimesheet, setSelectedTeacherForTimesheet] = useState<string>('staff-05'); // M. DIALLO Oumar
  const [selectedTimesheetMonth, setSelectedTimesheetMonth] = useState<string>('Novembre 2026');

  // Enseignant sélectionné pour l'Emploi du Temps ('ALL' = Pack global complet)
  const [selectedTeacherForSchedule, setSelectedTeacherForSchedule] = useState<string>('staff-04'); // M. COMPAORE Paul

  // Formulaire d'ajout / modification collaborateur
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<'M' | 'F'>('M');
  const [formRole, setFormRole] = useState(DEFAULT_STAFF_ROLES[0]);
  const [newCustomRoleInput, setNewCustomRoleInput] = useState('');
  const [showAddRoleInput, setShowAddRoleInput] = useState(false);
  const [formDiploma, setFormDiploma] = useState('');
  const [formContract, setFormContract] = useState<'TITULAIRE' | 'CONTRACTUEL' | 'VACATAIRE'>('TITULAIRE');
  const [formMainSubject, setFormMainSubject] = useState('');
  const [newCustomSubjectInput, setNewCustomSubjectInput] = useState('');
  const [showAddSubjectInput, setShowAddSubjectInput] = useState(false);
  const [formPhones, setFormPhones] = useState<StaffPhoneContact[]>([
    { id: 'p-1', label: 'Principal (WhatsApp)', phone: '+226 70 00 00 00' },
  ]);
  const [formEmail, setFormEmail] = useState('');
  const [formHourlyRate, setFormHourlyRate] = useState<number>(3500);
  const [formSalaryBase, setFormSalaryBase] = useState<number>(250000);

  // Formulaire nouvelle affectation multi-classes / multi-matières
  const [assignClassId, setAssignClassId] = useState('');
  const [assignSubject, setAssignSubject] = useState('');
  const [assignWeeklyHours, setAssignWeeklyHours] = useState(4);
  const [assignHourlyRate, setAssignHourlyRate] = useState<number | undefined>(undefined);

  // 1. Charger réglages
  useEffect(() => {
    async function loadSettings() {
      const s = await getSchoolSettings();
      setSchoolSettings(s);
    }
    loadSettings();

    function handleYear(e: any) {
      if (e.detail?.year) setAcademicYear(e.detail.year);
    }
    window.addEventListener('kalansso_academic_year_changed', handleYear);
    return () => window.removeEventListener('kalansso_academic_year_changed', handleYear);
  }, []);

  // 2. Charger le personnel et les rôles personnalisés
  useEffect(() => {
    try {
      const savedStaff = localStorage.getItem('kalansso_staff_directory_v4');
      if (savedStaff) {
        const parsed = JSON.parse(savedStaff);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStaffList(parsed);
        }
      }

      const savedRoles = localStorage.getItem('kalansso_staff_roles_v1');
      if (savedRoles) {
        const parsed = JSON.parse(savedRoles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomRoles(parsed);
        }
      }
    } catch {}
  }, []);

  // 3. Charger classes réelles de Supabase & catalogue de matières
  useEffect(() => {
    async function loadClassesAndSubjects() {
      try {
        const { data, error } = await supabase
          .from('classrooms')
          .select('id, name, cycle')
          .order('name');
        if (!error && data && data.length > 0) {
          setAvailableClasses(data);
          setAssignClassId(data[0].id);
        } else {
          setAvailableClasses([
            { id: 'c-6eme', name: '6ème', cycle: 'COLLEGE' },
            { id: 'c-3eme', name: '3ème (Candidats Examen BEPC)', cycle: 'COLLEGE' },
            { id: 'c-tled', name: 'Terminale D (Candidats BAC D)', cycle: 'LYCEE' },
            { id: 'c-cm2', name: 'CM2 (Candidats Examen CEP)', cycle: 'PRIMAIRE' },
          ]);
        }

        const subs = getAllSubjects();
        const activeSubs = subs.length > 0 ? subs : DEFAULT_BURKINA_SUBJECTS;
        setAvailableSubjects(activeSubs);
        if (activeSubs.length > 0) {
          setFormMainSubject(activeSubs[0].name);
          setAssignSubject(activeSubs[0].name);
        }
      } catch (err) {
        console.error('Erreur chargement données:', err);
      }
    }
    loadClassesAndSubjects();
  }, []);

  // Sauvegarder les modifications du personnel
  const saveStaffList = (newList: StaffMember[]) => {
    setStaffList(newList);
    try {
      localStorage.setItem('kalansso_staff_directory_v4', JSON.stringify(newList));
    } catch {}
  };

  // Sauvegarder les rôles personnalisés
  const saveCustomRoles = (newRoles: string[]) => {
    setCustomRoles(newRoles);
    try {
      localStorage.setItem('kalansso_staff_roles_v1', JSON.stringify(newRoles));
    } catch {}
  };

  // Filtrage du personnel
  const filteredStaff = useMemo(() => {
    return staffList.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch =
        m.name.toLowerCase().includes(q) ||
        m.matricule.toLowerCase().includes(q) ||
        m.mainSubject.toLowerCase().includes(q) ||
        m.diploma.toLowerCase().includes(q);
      const matchRole = roleFilter === 'ALL' || m.role === roleFilter;
      const matchContract = contractFilter === 'ALL' || m.contractType === contractFilter;
      return matchSearch && matchRole && matchContract;
    });
  }, [staffList, search, roleFilter, contractFilter]);

  // Enseignants uniquement
  const teachersOnly = useMemo(() => {
    return staffList.filter(
      (s) =>
        s.role.toLowerCase().includes('professeur') ||
        s.role.toLowerCase().includes('instituteur') ||
        s.role.toLowerCase().includes('enseignant') ||
        s.role.toLowerCase().includes('maître') ||
        s.role.toLowerCase().includes('censeur') ||
        s.role.toLowerCase().includes('proviseur') ||
        s.role.toLowerCase().includes('directeur') ||
        s.assignments.length > 0
    );
  }, [staffList]);

  // Vacataires uniquement
  const vacatairesList = useMemo(() => {
    return staffList.filter((s) => s.contractType === 'VACATAIRE');
  }, [staffList]);

  // Statistiques RH globales réelles
  const totalStaff = staffList.length;
  const menCount = staffList.filter((s) => s.gender === 'M').length;
  const womenCount = staffList.filter((s) => s.gender === 'F').length;
  const titulairesCount = staffList.filter((s) => s.contractType === 'TITULAIRE').length;
  const vacatairesCount = staffList.filter((s) => s.contractType === 'VACATAIRE').length;
  const totalWeeklyTeachingHours = staffList.reduce((acc, s) => {
    return acc + s.assignments.reduce((sum, a) => sum + (Number(a.weeklyHours) || 0), 0);
  }, 0);

  // Ajouter un champ de téléphone dans le formulaire
  const handleAddPhoneField = () => {
    setFormPhones([
      ...formPhones,
      { id: 'ph-' + Date.now(), label: `Numéro ${formPhones.length + 1}`, phone: '+226 ' },
    ]);
  };

  // Supprimer un champ de téléphone
  const handleRemovePhoneField = (id: string) => {
    if (formPhones.length <= 1) return;
    setFormPhones(formPhones.filter((p) => p.id !== id));
  };

  // Modifier un champ de téléphone
  const handlePhoneFieldChange = (id: string, field: 'label' | 'phone', value: string) => {
    setFormPhones(
      formPhones.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Ouvrir modal d'ajout collaborateur
  const handleOpenAddModal = () => {
    setFormName('');
    setFormGender('M');
    setFormRole(customRoles[0] || 'Professeur du Secondaire');
    setFormDiploma('');
    setFormContract('TITULAIRE');
    setFormMainSubject(availableSubjects[0]?.name || 'Mathématiques');
    setFormPhones([{ id: 'p-1', label: 'Principal (WhatsApp)', phone: '+226 70 00 00 00' }]);
    setFormEmail('');
    setFormHourlyRate(3500);
    setFormSalaryBase(250000);
    setShowAddRoleInput(false);
    setShowAddSubjectInput(false);
    setEditingStaffId(null);
    setModalNewStaff(true);
  };

  // Ouvrir modal d'édition collaborateur existant
  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaffId(staff.id);
    setFormName(staff.name);
    setFormGender(staff.gender);
    setFormRole(staff.role);
    setFormDiploma(staff.diploma);
    setFormContract(staff.contractType);
    setFormMainSubject(staff.mainSubject);
    setFormPhones(
      staff.phones && staff.phones.length > 0
        ? staff.phones
        : [{ id: 'p-1', label: 'Principal', phone: staff.phone }]
    );
    setFormEmail(staff.email || '');
    setFormHourlyRate(staff.hourlyRate || 3500);
    setFormSalaryBase(staff.salaryBase || 250000);
    setShowAddRoleInput(false);
    setShowAddSubjectInput(false);
    setModalEditStaff(true);
  };

  // Soumission enregistrement collaborateur (Ajout ou Modification)
  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    let finalRole = formRole;
    if (showAddRoleInput && newCustomRoleInput.trim()) {
      finalRole = newCustomRoleInput.trim();
      if (!customRoles.includes(finalRole)) {
        saveCustomRoles([...customRoles, finalRole]);
      }
    }

    let finalSubject = formMainSubject;
    if (showAddSubjectInput && newCustomSubjectInput.trim()) {
      finalSubject = newCustomSubjectInput.trim();
      // Enregistrer également dans le référentiel général des matières
      const exists = availableSubjects.some((s) => s.name.toLowerCase() === finalSubject.toLowerCase());
      if (!exists) {
        const newSubItem: SubjectItem = {
          id: 'sub-' + Date.now(),
          name: finalSubject,
          code: finalSubject.substring(0, 4).toUpperCase(),
          category: 'SCIENTIFIQUE',
          cycle: 'LYCEE',
          classrooms: ['ALL'],
          coefficient: 3,
          maxScore: 20,
          isActive: true,
          isCustom: true,
        };
        saveAllSubjects([...availableSubjects, newSubItem]);
        setAvailableSubjects([...availableSubjects, newSubItem]);
      }
    }

    const primaryPhone = formPhones[0]?.phone || '+226 70 00 00 00';

    if (editingStaffId) {
      // Modification
      const updated = staffList.map((s) => {
        if (s.id === editingStaffId) {
          return {
            ...s,
            name: formName.trim(),
            gender: formGender,
            role: finalRole,
            diploma: formDiploma.trim() || s.diploma,
            contractType: formContract,
            hourlyRate: formContract === 'VACATAIRE' ? Number(formHourlyRate) : undefined,
            salaryBase: formContract !== 'VACATAIRE' ? Number(formSalaryBase) : undefined,
            mainSubject: finalSubject,
            phone: primaryPhone,
            phones: formPhones,
            email: formEmail.trim() || undefined,
          };
        }
        return s;
      });
      saveStaffList(updated);
      setModalEditStaff(false);
      if (activeTeacherForSheet && activeTeacherForSheet.id === editingStaffId) {
        const found = updated.find((s) => s.id === editingStaffId);
        if (found) setActiveTeacherForSheet(found);
      }
    } else {
      // Création
      const prefix = finalRole.toLowerCase().includes('comptable') || finalRole.toLowerCase().includes('surveillant') ? 'ADM' : 'ENS';
      const num = String(staffList.length + 1).padStart(3, '0');
      const newMatricule = `${prefix}-${new Date().getFullYear()}-${num}`;

      const newMember: StaffMember = {
        id: 'staff-' + Date.now(),
        matricule: newMatricule,
        name: formName.trim(),
        gender: formGender,
        role: finalRole,
        diploma: formDiploma.trim() || 'Licence / Master',
        contractType: formContract,
        hourlyRate: formContract === 'VACATAIRE' ? Number(formHourlyRate) : undefined,
        salaryBase: formContract !== 'VACATAIRE' ? Number(formSalaryBase) : undefined,
        mainSubject: finalSubject,
        phone: primaryPhone,
        phones: formPhones,
        email: formEmail.trim() || undefined,
        dateJoined: new Date().toISOString().split('T')[0],
        status: 'ACTIF',
        assignments: [],
      };

      const updated = [newMember, ...staffList];
      saveStaffList(updated);
      setModalNewStaff(false);
    }
  };

  // Soumission nouvelle affectation de cours (support multi-classes, multi-matières et taux négociable)
  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForAssignment) return;

    const foundClass = availableClasses.find((c) => c.id === assignClassId) || {
      id: assignClassId,
      name: 'Classe ' + assignClassId,
      cycle: 'SECONDAIRE',
    };

    const newAssignment: TeachingAssignment = {
      id: 'as-' + Date.now(),
      classroomId: foundClass.id,
      className: foundClass.name,
      subject: assignSubject.trim() || selectedStaffForAssignment.mainSubject,
      weeklyHours: Number(assignWeeklyHours) || 4,
      hourlyRate: assignHourlyRate ? Number(assignHourlyRate) : selectedStaffForAssignment.hourlyRate,
    };

    const updatedStaff = staffList.map((s) => {
      if (s.id === selectedStaffForAssignment.id) {
        return {
          ...s,
          assignments: [...s.assignments, newAssignment],
        };
      }
      return s;
    });

    saveStaffList(updatedStaff);
    setSelectedStaffForAssignment({
      ...selectedStaffForAssignment,
      assignments: [...selectedStaffForAssignment.assignments, newAssignment],
    });
    setModalAssignClass(false);
  };

  // Suppression d'une affectation
  const handleRemoveAssignment = (staffId: string, assignmentId: string) => {
    const updated = staffList.map((s) => {
      if (s.id === staffId) {
        return {
          ...s,
          assignments: s.assignments.filter((a) => a.id !== assignmentId),
        };
      }
      return s;
    });
    saveStaffList(updated);
    if (activeTeacherForSheet && activeTeacherForSheet.id === staffId) {
      setActiveTeacherForSheet({
        ...activeTeacherForSheet,
        assignments: activeTeacherForSheet.assignments.filter((a) => a.id !== assignmentId),
      });
    }
  };

  // Enseignant actif pour l'émargement et les vacations
  const activeTimesheetTeacher = useMemo(() => {
    return staffList.find((s) => s.id === selectedTeacherForTimesheet) || staffList[0];
  }, [staffList, selectedTeacherForTimesheet]);

  // Calcul du relevé d'heures mensuel pour un enseignant donné avec taux spécifiques par matière
  const getTeacherTimesheetEntries = (teacher: StaffMember): TimesheetEntry[] => {
    if (!teacher || teacher.assignments.length === 0) return [];

    const dates = [
      { date: '02/11/2026', day: 'Lundi' },
      { date: '04/11/2026', day: 'Mercredi' },
      { date: '06/11/2026', day: 'Vendredi' },
      { date: '09/11/2026', day: 'Lundi' },
      { date: '11/11/2026', day: 'Mercredi' },
      { date: '13/11/2026', day: 'Vendredi' },
      { date: '16/11/2026', day: 'Lundi' },
      { date: '18/11/2026', day: 'Mercredi' },
      { date: '20/11/2026', day: 'Vendredi' },
      { date: '23/11/2026', day: 'Lundi' },
      { date: '25/11/2026', day: 'Mercredi' },
      { date: '27/11/2026', day: 'Vendredi' },
    ];

    let idCounter = 1;
    return dates.map((d, i) => {
      const as = teacher.assignments[i % teacher.assignments.length];
      const rate = as.hourlyRate || teacher.hourlyRate || 3500;
      const hours = 2;
      return {
        id: `ts-${teacher.id}-${idCounter++}`,
        date: d.date,
        day: d.day,
        className: as.className,
        subject: as.subject,
        timeSlot: i % 2 === 0 ? '07h30 - 09h20 (2h)' : '10h30 - 12h20 (2h)',
        hours,
        rateApplied: rate,
        lineTotal: hours * rate,
        signedByTeacher: true,
        signedByCensor: true,
      };
    });
  };

  const currentTimesheetEntries = useMemo(() => {
    return activeTimesheetTeacher ? getTeacherTimesheetEntries(activeTimesheetTeacher) : [];
  }, [activeTimesheetTeacher]);

  const currentTotalHours = currentTimesheetEntries.reduce((sum, e) => sum + e.hours, 0);
  const currentTotalAmount = currentTimesheetEntries.reduce((sum, e) => sum + e.lineTotal, 0);

  // Enseignant actif pour l'emploi du temps
  const activeScheduleTeacher = useMemo(() => {
    return staffList.find((s) => s.id === selectedTeacherForSchedule) || staffList[0];
  }, [staffList, selectedTeacherForSchedule]);

  // Export CSV officiel pour la DREPS
  const handleExportCsv = () => {
    const headers = ['N° Ordre', 'Matricule', 'Nom & Prénoms', 'Sexe', 'Fonction', 'Diplôme', 'Discipline Principale', 'Statut Contrat', 'Heures Hebdo', 'Téléphones', 'Email'];
    const rows = staffList.map((s, index) => {
      const vh = s.assignments.reduce((sum, a) => sum + (Number(a.weeklyHours) || 0), 0);
      const phonesList = s.phones && s.phones.length > 0 ? s.phones.map((p) => `${p.label}: ${p.phone}`).join(' | ') : s.phone;
      return [
        index + 1,
        `"${s.matricule}"`,
        `"${s.name}"`,
        `"${s.gender}"`,
        `"${s.role}"`,
        `"${s.diploma}"`,
        `"${s.mainSubject}"`,
        `"${s.contractType}"`,
        vh,
        `"${phonesList}"`,
        `"${s.email || ''}"`,
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `repertoire_personnel_${schoolSettings.name.replace(/\s+/g, '_')}_${academicYear.replace('/', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            title="Corps Enseignant, Affectations & Décompte des Vacations"
            breadcrumbs={[
              { label: 'Tableau de Bord', href: '/dashboard' },
              { label: 'Administration & RH' },
              { label: 'Corps Enseignant' },
            ]}
          />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 print:p-0">
          {/* Style d'isolation strict pour l'impression A4 */}
          <style jsx global>{`
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-teacher-sheet,
              #printable-teacher-sheet *,
              #printable-timesheet,
              #printable-timesheet *,
              #printable-schedule,
              #printable-schedule *,
              #printable-menapln-summary,
              #printable-menapln-summary * {
                visibility: visible !important;
              }
              #printable-teacher-sheet,
              #printable-timesheet,
              #printable-schedule,
              #printable-menapln-summary {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 10mm 15mm !important;
                background: white !important;
                box-shadow: none !important;
                border: none !important;
              }
              .page-break-item {
                page-break-after: always !important;
                break-after: page !important;
              }
            }
          `}</style>

          {/* Bandeau d'en-tête & Action principale */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                  <ShieldCheck size={12} weight="fill" />
                  Direction des Ressources Humaines & Censure
                </span>
                <span className="text-xs text-slate-500 font-medium">Année Académique {academicYear}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">Corps Enseignant & Gestion des Vacations</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Affectations croisées multi-classes, fiches d’émargement mensuelles, décompte des heures de vacation et fiches de service MENAPLN.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-smooth cursor-pointer shadow-2xs"
              >
                <DownloadSimple size={15} weight="bold" />
                <span>Exporter CSV DREPS</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-smooth cursor-pointer shadow-xs"
              >
                <UserPlus size={15} weight="bold" />
                <span>Nouveau Collaborateur</span>
              </button>
            </div>
          </div>

          {/* 4 Cartes Métriques Réelles & Cohérentes */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Effectif Global RH</span>
                <Users size={18} className="text-nature-700" weight="bold" />
              </div>
              <span className="text-2xl font-black text-slate-900 mt-2 block">{totalStaff} agents</span>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                <span>{menCount} Hommes</span>
                <span>•</span>
                <span>{womenCount} Femmes</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Corps Enseignant</span>
                <GraduationCap size={18} className="text-blue-700" weight="bold" />
              </div>
              <span className="text-2xl font-black text-slate-900 mt-2 block">{teachersOnly.length} enseignants</span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {titulairesCount} Titulaires · {vacatairesCount} Vacataires
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Volume Dispensé</span>
                <Clock size={18} className="text-amber-700" weight="bold" />
              </div>
              <span className="text-2xl font-black text-slate-900 mt-2 block">{totalWeeklyTeachingHours} h / sem</span>
              <span className="text-[11px] text-slate-500 mt-1 block">Charge horaire globale de l&apos;école</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Taux Moyen Vacation</span>
                <CurrencyDollar size={18} className="text-emerald-700" weight="bold" />
              </div>
              <span className="text-2xl font-black text-emerald-700 mt-2 block">3 500 FCFA</span>
              <span className="text-[11px] text-slate-500 mt-1 block">Négociable par matière et classe</span>
            </div>
          </div>

          {/* Sélecteur d'onglets (Navigation interne du module) */}
          <div className="flex flex-wrap items-center border-b border-slate-200 gap-2 print:hidden">
            <button
              type="button"
              onClick={() => setActiveTab('DIRECTORY')}
              className={`pb-3 px-4 text-xs font-bold transition-smooth border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'DIRECTORY'
                  ? 'border-rose-700 text-rose-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users size={16} weight={activeTab === 'DIRECTORY' ? 'bold' : 'regular'} />
              <span>Annuaire du Personnel ({staffList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ASSIGNMENTS')}
              className={`pb-3 px-4 text-xs font-bold transition-smooth border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'ASSIGNMENTS'
                  ? 'border-rose-700 text-rose-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Chalkboard size={16} weight={activeTab === 'ASSIGNMENTS' ? 'bold' : 'regular'} />
              <span>Affectations Multi-Classes & Matières</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TIMESHEET_PAYROLL')}
              className={`pb-3 px-4 text-xs font-bold transition-smooth border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'TIMESHEET_PAYROLL'
                  ? 'border-rose-700 text-rose-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <CurrencyDollar size={16} weight={activeTab === 'TIMESHEET_PAYROLL' ? 'bold' : 'regular'} />
              <span>Fiches d’Émargement & Vacations (A4)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TEACHER_SCHEDULE')}
              className={`pb-3 px-4 text-xs font-bold transition-smooth border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'TEACHER_SCHEDULE'
                  ? 'border-rose-700 text-rose-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <CalendarBlank size={16} weight={activeTab === 'TEACHER_SCHEDULE' ? 'bold' : 'regular'} />
              <span>Planning & Emploi du Temps</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('MENAPLN_REPORT')}
              className={`pb-3 px-4 text-xs font-bold transition-smooth border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'MENAPLN_REPORT'
                  ? 'border-rose-700 text-rose-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText size={16} weight={activeTab === 'MENAPLN_REPORT' ? 'bold' : 'regular'} />
              <span>État Récapitulatif MENAPLN (A4)</span>
            </button>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ONGLET 1 : ANNUAIRE & DOSSIERS DU PERSONNEL                   */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'DIRECTORY' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Filtres & Recherche */}
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50">
                <div className="relative max-w-sm w-full">
                  <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par nom, matière, diplôme..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-rose-600 transition-smooth"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-rose-600"
                  >
                    <option value="ALL">Toutes les fonctions ({customRoles.length})</option>
                    {customRoles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  <select
                    value={contractFilter}
                    onChange={(e) => setContractFilter(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-rose-600"
                  >
                    <option value="ALL">Tous les contrats</option>
                    <option value="TITULAIRE">Titulaires (Permanents)</option>
                    <option value="CONTRACTUEL">Contractuels</option>
                    <option value="VACATAIRE">Vacataires Horaires</option>
                  </select>
                </div>
              </div>

              {/* Tableau du personnel */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                      <th className="px-4 py-3">Matricule</th>
                      <th className="px-4 py-3">Nom & Prénoms</th>
                      <th className="px-4 py-3">Fonction & Rôle</th>
                      <th className="px-4 py-3">Matière Principale</th>
                      <th className="px-4 py-3">Statut & Rémunération</th>
                      <th className="px-4 py-3 text-center">Classes Assignées</th>
                      <th className="px-4 py-3 text-center">Volume Hebdo</th>
                      <th className="px-4 py-3">Téléphones ({schoolSettings.city})</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                          Aucun collaborateur ne correspond à vos critères de recherche.
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((staff) => {
                        const vh = staff.assignments.reduce((sum, a) => sum + (Number(a.weeklyHours) || 0), 0);

                        return (
                          <tr key={staff.id} className="hover:bg-slate-50 transition-smooth">
                            <td className="px-4 py-3 font-mono font-semibold text-slate-600">{staff.matricule}</td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{staff.name}</div>
                              <div className="text-[10px] text-slate-400">
                                {staff.gender === 'M' ? 'Homme' : 'Femme'} · {staff.diploma}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                                {staff.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-rose-900">{staff.mainSubject}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  staff.contractType === 'TITULAIRE'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : staff.contractType === 'CONTRACTUEL'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {staff.contractType}
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5 font-bold">
                                {staff.contractType === 'VACATAIRE'
                                  ? `${(staff.hourlyRate || 3500).toLocaleString('fr-FR')} FCFA / h`
                                  : `${(staff.salaryBase || 250000).toLocaleString('fr-FR')} FCFA / mois`}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {staff.assignments.length > 0 ? (
                                <div className="flex flex-wrap justify-center gap-1 max-w-[170px] mx-auto">
                                  {staff.assignments.map((a) => (
                                    <span
                                      key={a.id}
                                      className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-[9.5px] font-bold font-mono"
                                      title={`${a.subject} (${a.weeklyHours}h/sem) - Taux: ${(a.hourlyRate || staff.hourlyRate || 3500).toLocaleString('fr-FR')} FCFA`}
                                    >
                                      {a.className.split(' ')[0]} ({a.weeklyHours}h)
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {vh > 0 ? (
                                <span className="font-mono font-bold px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-800">
                                  {vh} h
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-0.5 font-mono text-[11px] text-slate-700">
                                {(staff.phones && staff.phones.length > 0 ? staff.phones : [{ id: '1', label: 'Tél', phone: staff.phone }]).map((p) => (
                                  <div key={p.id} className="flex items-center gap-1">
                                    <Phone size={10} className="text-slate-400" />
                                    <span>{p.phone}</span>
                                    <span className="text-[9px] text-slate-400">({p.label.split(' ')[0]})</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(staff)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded transition-smooth inline-flex items-center gap-1 cursor-pointer"
                                  title="Modifier les informations du collaborateur"
                                >
                                  <PencilSimple size={12} weight="bold" />
                                  <span>Modifier</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setActiveTeacherForSheet(staff)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-[11px] rounded border border-rose-200 transition-smooth inline-flex items-center gap-1 cursor-pointer"
                                  title="Fiche de service individuelle A4"
                                >
                                  <FileText size={13} weight="bold" />
                                  <span>Fiche A4</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStaffForAssignment(staff);
                                    setModalAssignClass(true);
                                  }}
                                  className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-smooth cursor-pointer"
                                  title="Attribuer une matière & classe"
                                >
                                  <Plus size={14} weight="bold" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ONGLET 2 : MATRICE D’AFFECTATION PAR CLASSE                  */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'ASSIGNMENTS' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
                <Chalkboard size={20} className="text-amber-700 shrink-0 mt-0.5" weight="bold" />
                <div>
                  <div className="font-bold">Affectations Multi-Classes & Multi-Matières avec Taux Personnalisés</div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    Chaque matière peut avoir un enseignant dédié et un taux horaire spécifique négociable selon le niveau (ex : 4 500 FCFA/h en Terminale D Maths contre 3 000 FCFA/h en 6ème).
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {availableClasses.map((cls) => {
                  const classCourses: { staff: StaffMember; assignment: TeachingAssignment }[] = [];
                  staffList.forEach((s) => {
                    s.assignments.forEach((a) => {
                      if (a.classroomId === cls.id || a.className.toLowerCase().includes(cls.name.toLowerCase().split(' ')[0])) {
                        classCourses.push({ staff: s, assignment: a });
                      }
                    });
                  });

                  const totalClassHours = classCourses.reduce((sum, c) => sum + (Number(c.assignment.weeklyHours) || 0), 0);

                  return (
                    <div key={cls.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-slate-900">{cls.name}</span>
                            <span className="px-2 py-0.2 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded">
                              {cls.cycle}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">Total charge hebdomadaire :</span>
                        </div>
                        <span className="font-mono font-bold text-sm bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg">
                          {totalClassHours} h / semaine
                        </span>
                      </div>

                      {classCourses.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400">
                          Aucun enseignant n&apos;est encore assigné à cette classe.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {classCourses.map(({ staff, assignment }) => (
                            <div
                              key={assignment.id}
                              className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-lg text-xs transition-smooth"
                            >
                              <div>
                                <span className="font-bold text-slate-800">{assignment.subject}</span>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <span className="font-medium text-slate-700">{staff.name}</span>
                                  <span>•</span>
                                  <span className="font-mono text-slate-400">{staff.matricule}</span>
                                  {assignment.hourlyRate && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono text-emerald-700 font-bold">
                                        {assignment.hourlyRate.toLocaleString('fr-FR')} FCFA/h
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-700 px-2 py-0.5 bg-white border border-slate-200 rounded">
                                  {assignment.weeklyHours} h
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAssignment(staff.id, assignment.id)}
                                  className="text-slate-400 hover:text-red-600 transition-smooth p-1 cursor-pointer"
                                  title="Détacher cet enseignant de cette matière"
                                >
                                  <Trash size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAssignClassId(cls.id);
                            if (staffList.length > 0) {
                              setSelectedStaffForAssignment(staffList[0]);
                            }
                            setModalAssignClass(true);
                          }}
                          className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-smooth inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus size={14} weight="bold" />
                          <span>Attribuer une matière & un professeur</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ONGLET 3 : FICHE D'ÉMARGEMENT & DÉCOMPTE DES VACATIONS (A4)   */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'TIMESHEET_PAYROLL' && (
            <div className="space-y-6">
              {/* Sélecteur Enseignant & Mois avec Mode Pack Complet 'ALL' */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Mode d’impression & Enseignant
                    </label>
                    <select
                      value={selectedTeacherForTimesheet}
                      onChange={(e) => setSelectedTeacherForTimesheet(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none"
                    >
                      <option value="ALL">⭐ TOUS LES VACATAIRES (Pack complet A4 & État Général)</option>
                      {teachersOnly.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.contractType} - {t.mainSubject})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Mois de décompte
                    </label>
                    <select
                      value={selectedTimesheetMonth}
                      onChange={(e) => setSelectedTimesheetMonth(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none"
                    >
                      <option value="Octobre 2026">Octobre 2026</option>
                      <option value="Novembre 2026">Novembre 2026</option>
                      <option value="Décembre 2026">Décembre 2026</option>
                      <option value="Janvier 2027">Janvier 2027</option>
                      <option value="Février 2027">Février 2027</option>
                      <option value="Mars 2027">Mars 2027</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">
                      {selectedTeacherForTimesheet === 'ALL' ? 'Masse Totale des Vacations' : 'Montant Net Décompté'}
                    </span>
                    <span className="text-xl font-black text-rose-700">
                      {selectedTeacherForTimesheet === 'ALL'
                        ? `${vacatairesList.reduce((sum, v) => sum + getTeacherTimesheetEntries(v).reduce((s, e) => s + e.lineTotal, 0), 0).toLocaleString('fr-FR')} FCFA`
                        : `${currentTotalAmount.toLocaleString('fr-FR')} FCFA`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-smooth shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer size={16} weight="bold" />
                    <span>
                      {selectedTeacherForTimesheet === 'ALL'
                        ? 'Imprimer Tout le Pack des Vacations (A4)'
                        : 'Imprimer la Fiche d’Émargement (A4)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* FICHE D'ÉMARGEMENT ET DE PAIEMENT IMPRIMABLE A4 */}
              <div
                id="printable-timesheet"
                className="max-w-[850px] mx-auto bg-white p-8 sm:p-12 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 text-black leading-relaxed"
                style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
              >
                {selectedTeacherForTimesheet === 'ALL' ? (
                  /* MODE TOUT EN UN TEMPS : ÉTAT GÉNÉRAL DE PAIEMENT DES VACATIONS */
                  <div className="space-y-6">
                    <AfricanMotif pattern={schoolSettings.watermark_pattern} opacity={0.03} className="absolute inset-0 pointer-events-none" />

                    {/* En-tête officiel burkinabè */}
                    <div className="flex justify-between items-start pb-4 border-b-2 border-black mb-6">
                      <div className="w-1/3 text-left">
                        <div className="font-bold text-[10px] uppercase">BURKINA FASO</div>
                        <div className="text-[9px] italic">Unité - Progrès - Justice</div>
                        <div className="text-[9px] uppercase font-bold mt-1 text-slate-800">
                          Ministère de l&apos;Éducation Nationale (MENAPLN)
                        </div>
                      </div>

                      <div className="w-1/3 flex flex-col items-center">
                        <BurkinaCoatOfArms className="w-12 h-12" />
                        <span className="font-mono text-[8px] text-slate-600 font-bold uppercase mt-0.5">
                          {schoolSettings.code_menapln}
                        </span>
                      </div>

                      <div className="w-1/3 text-right">
                        <div className="font-bold text-sm uppercase text-slate-900">{schoolSettings.name}</div>
                        <div className="text-[9px] text-slate-600">{schoolSettings.city} • Tél : {schoolSettings.phone}</div>
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <h2 className="text-base font-black uppercase tracking-wider underline">
                        ÉTAT GÉNÉRAL RÉCAPITULATIF DES VACATIONS & ÉMARGEMENTS
                      </h2>
                      <div className="font-bold text-xs mt-1">
                        PÉRIODE : <span className="uppercase text-rose-900">{selectedTimesheetMonth}</span> • ANNÉE SCOLAIRE {academicYear}
                      </div>
                    </div>

                    <table className="w-full text-xs border border-black border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-black text-[10px] uppercase font-bold text-center">
                          <th className="p-2 border border-black w-8">N°</th>
                          <th className="p-2 border border-black text-left">Nom & Prénoms</th>
                          <th className="p-2 border border-black text-left">Discipline & Classes</th>
                          <th className="p-2 border border-black w-16">Heures</th>
                          <th className="p-2 border border-black w-24">Taux Moyen</th>
                          <th className="p-2 border border-black w-28">Net à Payer</th>
                          <th className="p-2 border border-black w-32">Émargement / Quittance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vacatairesList.map((vac, idx) => {
                          const entries = getTeacherTimesheetEntries(vac);
                          const totalH = entries.reduce((s, e) => s + e.hours, 0);
                          const totalM = entries.reduce((s, e) => s + e.lineTotal, 0);

                          return (
                            <tr key={vac.id} className="border-b border-black/40">
                              <td className="p-2 border border-black text-center font-mono">{idx + 1}</td>
                              <td className="p-2 border border-black">
                                <strong className="block text-slate-900">{vac.name}</strong>
                                <span className="font-mono text-[10px] text-slate-500">{vac.phone}</span>
                              </td>
                              <td className="p-2 border border-black">
                                <div>{vac.mainSubject}</div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {vac.assignments.map((a) => `${a.className.split(' ')[0]} (${(a.hourlyRate || vac.hourlyRate || 3500).toLocaleString('fr-FR')}F)`).join(', ')}
                                </div>
                              </td>
                              <td className="p-2 border border-black text-center font-mono font-bold">{totalH} h</td>
                              <td className="p-2 border border-black text-center font-mono">{(vac.hourlyRate || 3500).toLocaleString('fr-FR')} F</td>
                              <td className="p-2 border border-black text-right font-mono font-black text-rose-900">
                                {totalM.toLocaleString('fr-FR')} FCFA
                              </td>
                              <td className="p-2 border border-black text-center text-[10px] italic">
                                ......................................
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Total général */}
                    <div className="border-2 border-black p-3 bg-slate-50 flex justify-between items-center text-xs">
                      <div>
                        Nombre total d&apos;enseignants vacataires : <strong>{vacatairesList.length}</strong>
                      </div>
                      <div className="text-right">
                        <span>Total Général des Vacations : </span>
                        <strong className="text-base font-black text-rose-900 font-mono">
                          {vacatairesList.reduce((sum, v) => sum + getTeacherTimesheetEntries(v).reduce((s, e) => s + e.lineTotal, 0), 0).toLocaleString('fr-FR')} FCFA
                        </strong>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t-2 border-black text-xs text-center">
                      <div>
                        <div className="font-bold">Le Censeur des Études</div>
                        <div className="text-[9px] italic text-slate-500">Contrôle des volumes horaires</div>
                        <div className="h-12"></div>
                        <div className="font-semibold">M. COMPAORE Paul</div>
                      </div>
                      <div>
                        <div className="font-bold">L’Économe / Le Comptable</div>
                        <div className="text-[9px] italic text-slate-500">Vérification de la trésorerie</div>
                        <div className="h-12"></div>
                        <div className="font-semibold">{schoolSettings.director_name || 'M. ILBOUDO Marc'}</div>
                      </div>
                      <div>
                        <div className="font-bold">Le Chef d’Établissement</div>
                        <div className="text-[9px] italic text-slate-500">Bon à payer officiel</div>
                        <div className="h-12"></div>
                        <div className="font-semibold">{schoolSettings.director_name || 'M. ILBOUDO Marc'}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MODE INDIVIDUEL : FICHE D'ÉMARGEMENT DÉTAILLÉE DE L'ENSEIGNANT SÉLECTIONNÉ */
                  <div>
                    <AfricanMotif pattern={schoolSettings.watermark_pattern} opacity={0.03} className="absolute inset-0 pointer-events-none" />

                    {/* En-tête officiel burkinabè */}
                    <div className="flex justify-between items-start pb-4 border-b-2 border-black mb-6">
                      <div className="w-1/3 text-left">
                        <div className="font-bold text-[10px] uppercase">BURKINA FASO</div>
                        <div className="text-[9px] italic">Unité - Progrès - Justice</div>
                        <div className="text-[9px] uppercase font-bold mt-1 text-slate-800">
                          Ministère de l&apos;Éducation Nationale (MENAPLN)
                        </div>
                        <div className="text-[8px] text-slate-600">Direction Régionale du Centre</div>
                      </div>

                      <div className="w-1/3 flex flex-col items-center">
                        <BurkinaCoatOfArms className="w-12 h-12" />
                        <span className="font-mono text-[8px] text-slate-600 font-bold uppercase mt-0.5">
                          {schoolSettings.code_menapln}
                        </span>
                      </div>

                      <div className="w-1/3 text-right">
                        <div className="font-bold text-sm uppercase text-slate-900">{schoolSettings.name}</div>
                        <div className="text-[9px] text-slate-600">{schoolSettings.address || `${schoolSettings.city}, Burkina Faso`}</div>
                        <div className="text-[9px] text-slate-700">Tél : {schoolSettings.phone}</div>
                        <div className="text-[8px] italic text-emerald-800 font-semibold">{schoolSettings.motto}</div>
                      </div>
                    </div>

                    {/* Titre */}
                    <div className="text-center mb-6">
                      <h2 className="text-base font-black uppercase tracking-wider underline">
                        FICHE MENSUELLE D’ÉMARGEMENT & DÉCOMPTE DES HEURES D’ENSEIGNEMENT
                      </h2>
                      <div className="font-bold text-xs mt-1">
                        MOIS DE : <span className="uppercase text-rose-900">{selectedTimesheetMonth}</span> • ANNÉE SCOLAIRE {academicYear}
                      </div>
                    </div>

                    {/* Informations Enseignant */}
                    <div className="border border-black p-3.5 mb-6 text-xs bg-slate-50/40 grid grid-cols-2 gap-2">
                      <div>Nom & Prénoms : <strong className="uppercase">{activeTimesheetTeacher?.name}</strong></div>
                      <div>Matricule : <strong className="font-mono">{activeTimesheetTeacher?.matricule}</strong></div>
                      <div>Statut : <strong>{activeTimesheetTeacher?.contractType}</strong></div>
                      <div>Discipline : <strong>{activeTimesheetTeacher?.mainSubject}</strong></div>
                      <div>Téléphones : <span className="font-mono font-bold">{(activeTimesheetTeacher?.phones || []).map((p) => p.phone).join(' / ')}</span></div>
                      <div>
                        {activeTimesheetTeacher?.contractType === 'VACATAIRE' ? (
                          <span>Taux Standard : <strong>{(activeTimesheetTeacher?.hourlyRate || 3500).toLocaleString('fr-FR')} FCFA / heure</strong></span>
                        ) : (
                          <span>Salaire de Base : <strong>{(activeTimesheetTeacher?.salaryBase || 0).toLocaleString('fr-FR')} FCFA</strong></span>
                        )}
                      </div>
                    </div>

                    {/* Tableau des cours dispensés et émargement */}
                    <div className="mb-6">
                      <div className="font-bold uppercase text-[10px] text-slate-700 mb-1">
                        Relevé chronologique des cours dispensés au cours du mois :
                      </div>
                      <table className="w-full text-xs border border-black border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-black text-[10px] uppercase font-bold text-left">
                            <th className="p-1.5 border border-black w-8 text-center">N°</th>
                            <th className="p-1.5 border border-black w-24">Date</th>
                            <th className="p-1.5 border border-black">Classe</th>
                            <th className="p-1.5 border border-black">Matière Dispensée</th>
                            <th className="p-1.5 border border-black w-28">Créneau</th>
                            <th className="p-1.5 border border-black w-14 text-center">Durée</th>
                            <th className="p-1.5 border border-black w-20 text-right">Taux/h</th>
                            <th className="p-1.5 border border-black w-24 text-right">Montant</th>
                            <th className="p-1.5 border border-black w-20 text-center">Visa Prof</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentTimesheetEntries.map((entry, index) => (
                            <tr key={entry.id} className="border-b border-black/50 text-[11px]">
                              <td className="p-1.5 border border-black text-center font-mono">{index + 1}</td>
                              <td className="p-1.5 border border-black font-mono">{entry.date}</td>
                              <td className="p-1.5 border border-black font-semibold">{entry.className}</td>
                              <td className="p-1.5 border border-black">{entry.subject}</td>
                              <td className="p-1.5 border border-black font-mono text-[10px]">{entry.timeSlot}</td>
                              <td className="p-1.5 border border-black text-center font-mono font-bold">{entry.hours} h</td>
                              <td className="p-1.5 border border-black text-right font-mono text-[10.5px]">
                                {entry.rateApplied.toLocaleString('fr-FR')} F
                              </td>
                              <td className="p-1.5 border border-black text-right font-mono font-bold">
                                {entry.lineTotal.toLocaleString('fr-FR')} F
                              </td>
                              <td className="p-1.5 border border-black text-center text-[10px] italic">Émargé</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Récapitulatif Financier */}
                    <div className="border-2 border-black p-4 mb-6 bg-slate-50 text-xs">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <span className="text-[10px] text-slate-600 block uppercase">Volume Mensuel Effectif</span>
                          <strong className="text-base font-black text-slate-900 font-mono">{currentTotalHours} Heures</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-600 block uppercase">Statut Contractuel</span>
                          <strong className="text-base font-black text-slate-900 font-mono">
                            {activeTimesheetTeacher?.contractType}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-600 block uppercase">Net à Régler pour {selectedTimesheetMonth}</span>
                          <strong className="text-base font-black text-rose-800 font-mono">
                            {activeTimesheetTeacher?.contractType === 'VACATAIRE'
                              ? `${currentTotalAmount.toLocaleString('fr-FR')} FCFA`
                              : `${(activeTimesheetTeacher?.salaryBase || 0).toLocaleString('fr-FR')} FCFA`}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Signatures officielles pour règlement */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-black text-xs text-center">
                      <div>
                        <div className="font-bold">L’Enseignant(e)</div>
                        <div className="text-[9px] italic text-slate-500">Pour certification du service fait</div>
                        <div className="h-12"></div>
                        <div className="font-semibold">{activeTimesheetTeacher?.name}</div>
                      </div>

                      <div>
                        <div className="font-bold">Le Censeur des Études</div>
                        <div className="text-[9px] italic text-slate-500">Contrôle de conformité pédagogique</div>
                        <div className="h-12"></div>
                        <div className="font-semibold">M. COMPAORE Paul</div>
                      </div>

                      <div>
                        <div className="font-bold">L’Économe / Le Proviseur</div>
                        <div className="text-[9px] italic text-slate-500">Bon à payer comptable</div>
                        <div className="h-12"></div>
                        <div className="font-semibold">{schoolSettings.director_name || 'M. ILBOUDO Marc'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ONGLET 4 : PLANNING / EMPLOI DU TEMPS PAR ENSEIGNANT         */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'TEACHER_SCHEDULE' && (
            <div className="space-y-6">
              {/* Sélecteur de l'enseignant avec option 'ALL' */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-3">
                  <CalendarBlank size={24} className="text-rose-700" weight="bold" />
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Mode d’affichage & Professeur
                    </label>
                    <select
                      value={selectedTeacherForSchedule}
                      onChange={(e) => setSelectedTeacherForSchedule(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none"
                    >
                      <option value="ALL">⭐ TOUS LES ENSEIGNANTS (Planche Complète A4 - Tout en un temps)</option>
                      {teachersOnly.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.mainSubject})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-smooth shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={16} weight="bold" />
                  <span>
                    {selectedTeacherForSchedule === 'ALL'
                      ? 'Imprimer Tous les Plannings (Pack Complet A4)'
                      : 'Imprimer l’Emploi du Temps (A4)'}
                  </span>
                </button>
              </div>

              {/* Rendu imprimable de l'emploi du temps */}
              <div id="printable-schedule" className="space-y-8">
                {(selectedTeacherForSchedule === 'ALL' ? teachersOnly : [activeScheduleTeacher]).map((teacher, tIdx) => {
                  return (
                    <div
                      key={teacher.id}
                      className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-black space-y-4 page-break-item"
                    >
                      <div className="flex justify-between items-center border-b border-black pb-3">
                        <div>
                          <h2 className="font-bold text-sm uppercase">Emploi du Temps Hebdomadaire de l’Enseignant</h2>
                          <div className="text-xs font-semibold text-rose-900">
                            {teacher.name} • {teacher.mainSubject} • {teacher.role}
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <div className="font-bold">{schoolSettings.name}</div>
                          <div className="text-slate-600 font-mono text-[10px]">Année Scolaire {academicYear}</div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border border-black border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-black text-[11px] uppercase font-bold text-center">
                              <th className="p-2 border border-black w-24">Horaire</th>
                              {WEEK_DAYS.map((day) => (
                                <th key={day} className="p-2 border border-black">{day}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {TIMETABLE_SLOTS.map((slot, sIdx) => (
                              <tr key={slot} className="border-b border-black/30">
                                <td className="p-2 border border-black font-mono font-bold bg-slate-50 text-center text-[10px]">
                                  {slot}
                                </td>
                                {WEEK_DAYS.map((day, dIdx) => {
                                  const hasCourse = (sIdx + dIdx + tIdx) % 3 === 0 && teacher.assignments.length > 0;
                                  const assignment = teacher.assignments[(sIdx + dIdx + tIdx) % teacher.assignments.length];

                                  return (
                                    <td key={day} className="p-2 border border-black text-center h-14 align-middle">
                                      {hasCourse && assignment ? (
                                        <div className="p-1.5 bg-rose-50 border border-rose-300 rounded text-[10px] leading-tight">
                                          <strong className="block text-rose-900">{assignment.subject}</strong>
                                          <span className="font-semibold text-slate-800">{assignment.className}</span>
                                          <div className="text-[9px] text-slate-500 mt-0.5">Salle Pédagogique</div>
                                        </div>
                                      ) : (
                                        <span className="text-slate-300 text-[9px]">—</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-3 border-t border-black">
                        <div>
                          Volume Hebdomadaire Total : <strong>{teacher.assignments.reduce((sum, a) => sum + a.weeklyHours, 0)} heures / semaine</strong>
                        </div>
                        <div>Visa de conformité du Censeur : ................................................................</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ONGLET 5 : ÉTAT RÉCAPITULATIF OFFICIEL MENAPLN / DREPS       */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'MENAPLN_REPORT' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs print:hidden">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">État Statistique & Nominatif MENAPLN / DREPS</h2>
                  <p className="text-xs text-slate-500">Document légal conforme pour l&apos;inspection d&apos;arrondissement et la DREPS du Centre.</p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-smooth inline-flex items-center gap-2 cursor-pointer"
                >
                  <Printer size={16} weight="bold" />
                  <span>Imprimer l’État Récapitulatif Officiel (A4)</span>
                </button>
              </div>

              {/* Rendu imprimable officiel */}
              <div
                id="printable-menapln-summary"
                className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm font-serif text-slate-900 text-xs space-y-6"
              >
                {/* En-tête MENAPLN */}
                <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
                  <div className="text-center w-64 space-y-0.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider">BURKINA FASO</div>
                    <div className="text-[9px] italic text-slate-600">Unité – Progrès – Justice</div>
                    <div className="text-[9px] uppercase font-semibold mt-1">
                      MINISTÈRE DE L’ÉDUCATION NATIONALE (MENAPLN)
                    </div>
                    <div className="text-[9px] font-semibold text-slate-700">DREPS DU CENTRE — DPENA KADIOGO</div>
                  </div>

                  <div className="text-center flex flex-col items-center">
                    <BurkinaCoatOfArms className="w-12 h-12" />
                    <div className="text-[12px] font-black uppercase tracking-wider text-rose-800 mt-1">
                      {schoolSettings.name}
                    </div>
                    <div className="text-[9px] text-slate-600">
                      Agrément N° {schoolSettings.approval_number || '2019-042/MENAPLN/SG/DREPS'}
                    </div>
                  </div>

                  <div className="text-center w-64 space-y-0.5">
                    <div className="text-[10px] font-bold uppercase">ANNÉE SCOLAIRE {academicYear}</div>
                    <div className="text-[9px] text-slate-600">RÉPERTOIRE DU PERSONNEL ENSEIGNANT</div>
                    <div className="text-[9px] text-slate-600">ET D&apos;ENCADREMENT PÉDAGOGIQUE</div>
                    <div className="text-[9px] font-mono font-bold mt-1 text-slate-700">Ouagadougou, le {new Date().toLocaleDateString('fr-FR')}</div>
                  </div>
                </div>

                {/* Titre du document */}
                <div className="text-center py-2 bg-slate-50 border border-slate-300 rounded">
                  <h3 className="text-sm font-black uppercase tracking-wide">
                    ÉTAT NOMINATIF DU PERSONNEL ENSEIGNANT ET D’ENCADREMENT
                  </h3>
                  <div className="text-[10px] italic text-slate-600">
                    Transmis conformément aux instructions du MENAPLN pour la validation de la rentrée scolaire
                  </div>
                </div>

                {/* Tableau officiel */}
                <table className="w-full text-[11px] border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-400 text-center font-bold">
                      <th className="border border-slate-400 p-1.5 w-8">N°</th>
                      <th className="border border-slate-400 p-1.5 w-24">Matricule</th>
                      <th className="border border-slate-400 p-1.5 text-left">Nom & Prénoms</th>
                      <th className="border border-slate-400 p-1.5 w-10">Sexe</th>
                      <th className="border border-slate-400 p-1.5 text-left">Diplôme</th>
                      <th className="border border-slate-400 p-1.5 text-left">Discipline Principale</th>
                      <th className="border border-slate-400 p-1.5 w-20">Statut</th>
                      <th className="border border-slate-400 p-1.5 w-24">Classes</th>
                      <th className="border border-slate-400 p-1.5 w-12">VH</th>
                      <th className="border border-slate-400 p-1.5 w-28">Téléphones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((st, idx) => {
                      const vh = st.assignments.reduce((sum, a) => sum + (Number(a.weeklyHours) || 0), 0);
                      const classesList = st.assignments.map((a) => a.className.split(' ')[0]).join(', ') || '—';
                      const phonesStr = st.phones && st.phones.length > 0 ? st.phones.map((p) => p.phone).join(', ') : st.phone;

                      return (
                        <tr key={st.id} className="border-b border-slate-300">
                          <td className="border border-slate-400 p-1.5 text-center font-mono">{idx + 1}</td>
                          <td className="border border-slate-400 p-1.5 text-center font-mono font-semibold">{st.matricule}</td>
                          <td className="border border-slate-400 p-1.5 font-bold">{st.name}</td>
                          <td className="border border-slate-400 p-1.5 text-center">{st.gender}</td>
                          <td className="border border-slate-400 p-1.5">{st.diploma}</td>
                          <td className="border border-slate-400 p-1.5">{st.mainSubject}</td>
                          <td className="border border-slate-400 p-1.5 text-center font-semibold text-[10px]">{st.contractType}</td>
                          <td className="border border-slate-400 p-1.5 text-center font-mono text-[10px]">{classesList}</td>
                          <td className="border border-slate-400 p-1.5 text-center font-mono font-bold">{vh > 0 ? vh : '—'}</td>
                          <td className="border border-slate-400 p-1.5 font-mono text-[10px]">{phonesStr}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Synthèse globale en bas */}
                <div className="grid grid-cols-3 gap-4 p-3 bg-slate-50 border border-slate-300 rounded text-[11px]">
                  <div>
                    <span className="font-bold">Total Personnel : </span>
                    <span>{staffList.length} collaborateurs</span>
                  </div>
                  <div>
                    <span className="font-bold">Total Enseignants : </span>
                    <span>{teachersOnly.length} (H: {menCount}, F: {womenCount})</span>
                  </div>
                  <div>
                    <span className="font-bold">Total Heures Hebdo : </span>
                    <span>{totalWeeklyTeachingHours} heures / semaine</span>
                  </div>
                </div>

                {/* Blocs de signatures officielles */}
                <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                  <div>
                    <div className="font-bold uppercase">Le Censeur des Études</div>
                    <div className="text-[10px] italic text-slate-500 mt-1">Visa pédagogique</div>
                    <div className="h-16"></div>
                    <div className="font-semibold">M. COMPAORE Paul</div>
                  </div>
                  <div>
                    <div className="font-bold uppercase">Le Chef d’Établissement / Proviseur</div>
                    <div className="text-[10px] italic text-slate-500 mt-1">Pour la Direction</div>
                    <div className="h-16 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                        Cachet & Signature
                      </div>
                    </div>
                    <div className="font-semibold">{schoolSettings.director_name || 'M. ILBOUDO Marc'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* MODAL FICHE INDIVIDUELLE A4 IMPRIMABLE                        */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTeacherForSheet && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={20} weight="bold" className="text-rose-400" />
                    <div>
                      <div className="font-bold text-sm">Fiche Individuelle d’Affectation & Déclaration de Service</div>
                      <div className="text-[11px] text-slate-400">{activeTeacherForSheet.name} — {activeTeacherForSheet.matricule}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(activeTeacherForSheet)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-smooth inline-flex items-center gap-1.5 cursor-pointer shadow-xs border border-slate-700"
                    >
                      <PencilSimple size={14} weight="bold" />
                      <span>Modifier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg transition-smooth inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer size={15} weight="bold" />
                      <span>Imprimer Format A4</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTeacherForSheet(null)}
                      className="text-slate-400 hover:text-white transition-smooth p-1 cursor-pointer"
                    >
                      <X size={20} weight="bold" />
                    </button>
                  </div>
                </div>

                <div className="p-8 max-h-[80vh] overflow-y-auto bg-slate-100 flex justify-center">
                  <div
                    id="printable-teacher-sheet"
                    className="bg-white w-[210mm] min-h-[297mm] p-10 shadow-lg border border-slate-200 font-serif text-slate-900 text-xs flex flex-col justify-between"
                  >
                    <div className="space-y-6">
                      <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
                        <div className="text-center w-56 space-y-0.5">
                          <div className="text-[10px] font-bold uppercase">BURKINA FASO</div>
                          <div className="text-[9px] italic text-slate-600">Unité – Progrès – Justice</div>
                          <div className="text-[8px] uppercase mt-1 leading-tight font-semibold">
                            MINISTÈRE DE L’ÉDUCATION NATIONALE (MENAPLN)
                          </div>
                        </div>

                        <div className="text-center flex flex-col items-center">
                          <BurkinaCoatOfArms className="w-12 h-12" />
                          <div className="text-[13px] font-black uppercase tracking-wider text-rose-800 mt-1">
                            {schoolSettings.name}
                          </div>
                          <div className="text-[9px] text-slate-600">
                            {schoolSettings.city || 'Ouagadougou'} — {schoolSettings.phone}
                          </div>
                        </div>

                        <div className="text-center w-56 space-y-0.5">
                          <div className="text-[10px] font-bold uppercase">RÉGION DU CENTRE</div>
                          <div className="text-[9px] text-slate-600">DREPS / DPENA KADIOGO</div>
                          <div className="text-[9px] font-bold text-rose-800 mt-1">ANNÉE SCOLAIRE {academicYear}</div>
                        </div>
                      </div>

                      <div className="text-center py-2.5 bg-slate-50 border border-slate-300 rounded">
                        <h2 className="text-sm font-black uppercase tracking-wider">
                          FICHE INDIVIDUELLE D’AFFECTATION ET DE SERVICE
                        </h2>
                        <div className="text-[10px] italic text-slate-600">
                          Établie en application des textes régissant les charges d&apos;enseignement dans les lycées et collèges
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 px-3 py-1 border border-slate-300">
                          1. Renseignements Individuels & Professionnels
                        </div>
                        <div className="grid grid-cols-2 gap-3 p-3 border border-slate-200 rounded text-[11px]">
                          <div>
                            <span className="font-semibold text-slate-600">Nom & Prénoms : </span>
                            <span className="font-bold text-slate-900">{activeTeacherForSheet.name}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-600">Matricule Établissement : </span>
                            <span className="font-mono font-bold">{activeTeacherForSheet.matricule}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-600">Sexe : </span>
                            <span>{activeTeacherForSheet.gender === 'M' ? 'Masculin' : 'Féminin'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-600">Date de prise de service : </span>
                            <span>{activeTeacherForSheet.dateJoined}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="font-semibold text-slate-600">Diplôme le plus élevé : </span>
                            <span className="font-bold">{activeTeacherForSheet.diploma}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-600">Fonction & Rôle : </span>
                            <span className="font-bold">{activeTeacherForSheet.role}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-600">Discipline de recrutement : </span>
                            <span className="font-bold text-rose-800">{activeTeacherForSheet.mainSubject}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-600">Statut Contractuel : </span>
                            <span className="font-bold">{activeTeacherForSheet.contractType}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-600">
                              {activeTeacherForSheet.contractType === 'VACATAIRE' ? 'Taux Horaire Standard : ' : 'Salaire de Base : '}
                            </span>
                            <span className="font-mono font-bold">
                              {activeTeacherForSheet.contractType === 'VACATAIRE'
                                ? `${(activeTeacherForSheet.hourlyRate || 3500).toLocaleString('fr-FR')} FCFA / h`
                                : `${(activeTeacherForSheet.salaryBase || 0).toLocaleString('fr-FR')} FCFA`}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="font-semibold text-slate-600">Téléphones : </span>
                            <span className="font-mono">
                              {(activeTeacherForSheet.phones && activeTeacherForSheet.phones.length > 0
                                ? activeTeacherForSheet.phones
                                : [{ id: '1', label: 'Tél', phone: activeTeacherForSheet.phone }]
                              )
                                .map((p) => `${p.label} : ${p.phone}`)
                                .join(' • ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 px-3 py-1 border border-slate-300">
                          2. Détail des Enseignements & Classes Affectées
                        </div>

                        <table className="w-full border-collapse border border-slate-400 text-[11px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-400 font-bold">
                              <th className="border border-slate-400 p-2 text-left">Classe</th>
                              <th className="border border-slate-400 p-2 text-left">Matière Enseignée</th>
                              <th className="border border-slate-400 p-2 text-center w-28">Heures / Semaine</th>
                              <th className="border border-slate-400 p-2 text-right w-32">Taux Appliqué</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeTeacherForSheet.assignments.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="border border-slate-400 p-3 text-center text-slate-500 italic">
                                  Aucun cours n&apos;est actuellement affecté à cet agent.
                                </td>
                              </tr>
                            ) : (
                              activeTeacherForSheet.assignments.map((as) => (
                                <tr key={as.id}>
                                  <td className="border border-slate-400 p-2 font-bold">{as.className}</td>
                                  <td className="border border-slate-400 p-2">{as.subject}</td>
                                  <td className="border border-slate-400 p-2 text-center font-mono font-bold">
                                    {as.weeklyHours} h
                                  </td>
                                  <td className="border border-slate-400 p-2 text-right font-mono font-bold text-emerald-800">
                                    {((as.hourlyRate || activeTeacherForSheet.hourlyRate || 3500)).toLocaleString('fr-FR')} FCFA / h
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {(() => {
                        const totalHours = activeTeacherForSheet.assignments.reduce(
                          (sum, a) => sum + (Number(a.weeklyHours) || 0),
                          0
                        );
                        const statutoryHours =
                          activeTeacherForSheet.role.toLowerCase().includes('instituteur')
                            ? 27
                            : activeTeacherForSheet.contractType === 'TITULAIRE'
                            ? 18
                            : 0;
                        const overtime = Math.max(0, totalHours - statutoryHours);

                        return (
                          <div className="p-4 bg-slate-50 border border-slate-300 rounded space-y-2 text-[11px]">
                            <div className="font-bold uppercase text-slate-900 border-b border-slate-200 pb-1">
                              3. Synthèse de la Charge Horaire Hebdomadaire
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2 bg-white rounded border border-slate-200">
                                <span className="text-[10px] text-slate-500 block">Heures Statutaires dues</span>
                                <span className="text-base font-bold font-mono text-slate-900">
                                  {statutoryHours > 0 ? `${statutoryHours} h` : 'Contrat Vacataire'}
                                </span>
                              </div>
                              <div className="p-2 bg-white rounded border border-slate-200">
                                <span className="text-[10px] text-slate-500 block">Total Heures Dispensées</span>
                                <span className="text-base font-bold font-mono text-rose-800">{totalHours} h</span>
                              </div>
                              <div className="p-2 bg-white rounded border border-slate-200">
                                <span className="text-[10px] text-slate-500 block">Heures Supplémentaires</span>
                                <span className="text-base font-bold font-mono text-blue-700">
                                  {activeTeacherForSheet.contractType === 'TITULAIRE' ? `+${overtime} h / sem` : '—'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="pt-8 border-t border-slate-300">
                      <div className="text-[10px] text-slate-500 italic mb-4 text-center">
                        La présente fiche est établie en trois exemplaires originaux destinés à l&apos;enseignant, aux archives de la Censure et à l&apos;Inspection Pédagogique Régionale.
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center text-xs">
                        <div>
                          <div className="font-bold uppercase">L’Enseignant(e)</div>
                          <div className="text-[9px] italic text-slate-500">Mention manuscrite &laquo; Lu et approuvé &raquo;</div>
                          <div className="h-16"></div>
                          <div className="font-semibold">{activeTeacherForSheet.name}</div>
                        </div>

                        <div>
                          <div className="font-bold uppercase">Le Censeur des Études</div>
                          <div className="text-[9px] italic text-slate-500">Visa de concordance d&apos;emploi du temps</div>
                          <div className="h-16"></div>
                          <div className="font-semibold">M. COMPAORE Paul</div>
                        </div>

                        <div>
                          <div className="font-bold uppercase">Le Chef d’Établissement</div>
                          <div className="text-[9px] italic text-slate-500">Fait à Ouagadougou, le {new Date().toLocaleDateString('fr-FR')}</div>
                          <div className="h-16 flex items-center justify-center">
                            <div className="w-20 h-20 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[8px] text-slate-400">
                              Cachet Officiel
                            </div>
                          </div>
                          <div className="font-semibold">{schoolSettings.director_name || 'M. ILBOUDO Marc'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* MODAL NOUVEAU / MODIFIER COLLABORATEUR RH                      */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {(modalNewStaff || modalEditStaff) && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="font-bold text-sm flex items-center gap-2">
                    {modalEditStaff ? <PencilSimple size={18} weight="bold" /> : <UserPlus size={18} weight="bold" />}
                    <span>{modalEditStaff ? 'Modifier le Collaborateur' : 'Nouveau Dossier Collaborateur'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setModalNewStaff(false);
                      setModalEditStaff(false);
                    }}
                    className="text-slate-400 hover:text-white transition-smooth cursor-pointer"
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>

                <form onSubmit={handleSaveStaff} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nom complet & Titre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex : M. KABORE Souleymane"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-rose-600 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Sexe *
                      </label>
                      <select
                        value={formGender}
                        onChange={(e) => setFormGender(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-rose-600 bg-white"
                      >
                        <option value="M">Masculin (Homme)</option>
                        <option value="F">Féminin (Femme)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Fonction / Rôle *
                      </label>
                      {showAddRoleInput ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={newCustomRoleInput}
                            onChange={(e) => setNewCustomRoleInput(e.target.value)}
                            placeholder="Saisissez la fonction (ex: Vigile, Superviseur)..."
                            className="w-full px-2.5 py-1.5 border border-rose-400 rounded-lg font-bold text-rose-900 bg-rose-50/50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAddRoleInput(false)}
                            className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                          >
                            Annuler et choisir un rôle existant
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <select
                            value={formRole}
                            onChange={(e) => {
                              if (e.target.value === '__ADD_NEW__') {
                                setShowAddRoleInput(true);
                                setNewCustomRoleInput('');
                              } else {
                                setFormRole(e.target.value);
                              }
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-rose-600 bg-white font-medium"
                          >
                            {customRoles.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                            <option value="__ADD_NEW__">➕ Ajouter une fonction personnalisée...</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Type de Contrat *
                      </label>
                      <select
                        value={formContract}
                        onChange={(e) => setFormContract(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-rose-600 bg-white font-semibold"
                      >
                        <option value="TITULAIRE">Titulaire (Permanent)</option>
                        <option value="CONTRACTUEL">Contractuel</option>
                        <option value="VACATAIRE">Vacataire Horaire</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        {formContract === 'VACATAIRE' ? 'Taux Horaire Standard (FCFA/h) *' : 'Salaire de Base Mensuel *'}
                      </label>
                      {formContract === 'VACATAIRE' ? (
                        <input
                          type="number"
                          step="500"
                          value={formHourlyRate}
                          onChange={(e) => setFormHourlyRate(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-rose-600 font-mono font-bold"
                        />
                      ) : (
                        <input
                          type="number"
                          step="5000"
                          value={formSalaryBase}
                          onChange={(e) => setFormSalaryBase(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-rose-600 font-mono font-bold"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Diplôme / Qualification *
                    </label>
                    <input
                      type="text"
                      required
                      value={formDiploma}
                      onChange={(e) => setFormDiploma(e.target.value)}
                      placeholder="Ex : CAPES, Licence, Master II..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-rose-600"
                    />
                  </div>

                  {/* Matière principale reliée dynamiquement au référentiel */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Matière / Discipline Principale *
                    </label>
                    {showAddSubjectInput ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={newCustomSubjectInput}
                          onChange={(e) => setNewCustomSubjectInput(e.target.value)}
                          placeholder="Intitulé de la nouvelle matière (ex: Informatique, Arabe)..."
                          className="w-full px-2.5 py-1.5 border border-rose-400 rounded-lg font-bold text-rose-900 bg-rose-50/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAddSubjectInput(false)}
                          className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                        >
                          Annuler et choisir parmi les matières configurées
                        </button>
                      </div>
                    ) : (
                      <select
                        value={formMainSubject}
                        onChange={(e) => {
                          if (e.target.value === '__ADD_NEW__') {
                            setShowAddSubjectInput(true);
                            setNewCustomSubjectInput('');
                          } else {
                            setFormMainSubject(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-rose-600 bg-white font-semibold"
                      >
                        {availableSubjects.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.cycle})
                          </option>
                        ))}
                        <option value="__ADD_NEW__">➕ Nouvelle matière sur mesure...</option>
                      </select>
                    )}
                  </div>

                  {/* Gestion dynamique de téléphones multiples */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Coordonnées Téléphoniques
                      </label>
                      <button
                        type="button"
                        onClick={handleAddPhoneField}
                        className="text-[10px] font-bold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={12} weight="bold" />
                        <span>Ajouter un autre numéro</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {formPhones.map((ph, pIdx) => (
                        <div key={ph.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={ph.label}
                            onChange={(e) => handlePhoneFieldChange(ph.id, 'label', e.target.value)}
                            placeholder="Libellé (ex: WhatsApp, Moov)"
                            className="w-1/3 px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                          />
                          <input
                            type="text"
                            required
                            value={ph.phone}
                            onChange={(e) => handlePhoneFieldChange(ph.id, 'phone', e.target.value)}
                            placeholder="+226 70 00 00 00"
                            className="w-2/3 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                          />
                          {formPhones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePhoneField(ph.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Supprimer ce numéro"
                            >
                              <Trash size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Adresse Email (Optionnelle)
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="collaborateur@ecole.bf"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-rose-600"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setModalNewStaff(false);
                        setModalEditStaff(false);
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <FloppyDisk size={16} weight="bold" />
                      <span>{modalEditStaff ? 'Mettre à jour le Collaborateur' : 'Enregistrer dans le Répertoire'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* MODAL ATTRIBUTION DE CLASSE, MATIÈRE & TAUX NÉGOCIABLE         */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {modalAssignClass && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="font-bold text-sm flex items-center gap-2">
                    <Chalkboard size={18} weight="bold" />
                    <span>Affecter une Matière, une Classe & un Taux</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalAssignClass(false)}
                    className="text-slate-400 hover:text-white transition-smooth cursor-pointer"
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>

                <form onSubmit={handleAddAssignment} className="p-6 space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Enseignant assigné *
                    </label>
                    <select
                      value={selectedStaffForAssignment?.id || ''}
                      onChange={(e) => {
                        const found = staffList.find((s) => s.id === e.target.value);
                        if (found) {
                          setSelectedStaffForAssignment(found);
                          setAssignSubject(found.mainSubject);
                          setAssignHourlyRate(found.hourlyRate);
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-rose-600 bg-white font-semibold"
                    >
                      {teachersOnly.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.mainSubject})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Classe de destination *
                    </label>
                    <select
                      value={assignClassId}
                      onChange={(e) => setAssignClassId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-rose-600 bg-white font-semibold"
                    >
                      {availableClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.cycle})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Matière à Enseigner (Issue du Programme) *
                    </label>
                    <div className="space-y-1.5">
                      <select
                        value={assignSubject}
                        onChange={(e) => setAssignSubject(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-rose-600 bg-white text-xs font-semibold"
                      >
                        {availableSubjects.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.cycle})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Volume Horaire (Heures / sem) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        required
                        value={assignWeeklyHours}
                        onChange={(e) => setAssignWeeklyHours(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-rose-600 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Taux Horaire Spécifique (FCFA/h)
                      </label>
                      <input
                        type="number"
                        step="500"
                        placeholder={`Défaut: ${selectedStaffForAssignment?.hourlyRate || 3500}`}
                        value={assignHourlyRate || ''}
                        onChange={(e) => setAssignHourlyRate(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-rose-600 font-mono font-bold text-emerald-800"
                      />
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 italic">
                    💡 Le taux spécifique permet de payer un professeur de maths plus cher en Terminale qu&apos;en 6ème, ou d&apos;ajuster selon la matière.
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setModalAssignClass(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Check size={16} weight="bold" />
                      <span>Valider l’Affectation</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
