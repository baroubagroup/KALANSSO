'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { supabase } from '@/lib/supabase';
import { getSchoolSettings, SchoolSettings, DEFAULT_SCHOOL } from '@/lib/schoolSettings';
import { getActiveAcademicYear } from '@/lib/academicYear';
import { BurkinaCoatOfArms } from '@/components/motifs/BurkinaCoatOfArms';
import { AfricanMotif } from '@/components/motifs/AfricanMotif';
import {
  ShieldCheck,
  WarningCircle,
  CheckCircle,
  FileText,
  Printer,
  ChatCircleText,
  User,
  Users,
  Plus,
  Trash,
  CalendarBlank,
  Check,
  X,
  MagnifyingGlass,
  Funnel,
  Warning,
  Ticket,
  Clock,
  Scales,
} from '@phosphor-icons/react';

// Interfaces
interface ClassroomOption {
  id: string;
  name: string;
  cycle: string;
}

interface StudentOption {
  id: string;
  matricule: string;
  last_name: string;
  first_name: string;
  gender: string;
  classroom_id: string;
  classroom_name: string;
  guardian_name?: string;
  guardian_phone?: string;
}

interface PassageTicket {
  id: string;
  ticketNumber: string;
  type: 'ENTREE_RETARD' | 'SORTIE_EXCEPTIONNELLE';
  studentId: string;
  studentName: string;
  matricule: string;
  classroomName: string;
  date: string;
  time: string;
  motif: string;
  isJustified: boolean;
  teacherName?: string;
  supervisorName: string;
}

// Corvée / Travaux de Salubrité d'Intérêt Général (authentique contexte africain)
interface CorveeRecord {
  id: string;
  studentId: string;
  studentName: string;
  matricule: string;
  classroomName: string;
  guardianPhone: string;
  date: string;
  timing: string; // Ex: 'Après les cours (17h00 - 18h00)' ou 'Pause récréation'
  taskType: 'BALAYAGE_COUR' | 'RAMASSAGE_SACHETS' | 'DESHERBAGE_JARDIN' | 'NETTOYAGE_TABLEAUX_BANCS' | 'SALUBRITE_COMMUNE';
  taskLabel: string;
  motif: string; // Ex: Retard répété non justifié, bavardages, refus d'obtempérer
  supervisedBy: string; // Surveillant responsable
  status: 'A_EXECUTER' | 'EFFECTUEE';
}

interface SanctionRecord {
  id: string;
  studentId: string;
  studentName: string;
  matricule: string;
  classroomName: string;
  type: 'AVERTISSEMENT_VERBAL' | 'AVERTISSEMENT_ECRIT' | 'BLAME_CONDUITE' | 'EXCLUSION_TEMPORAIRE' | 'CONSEIL_DISCIPLINE';
  motif: string;
  date: string;
  pointsDeducted: number;
  conductScore: number;
  status: 'ACTIF' | 'LEVE';
}

interface ConvocationData {
  studentName: string;
  matricule: string;
  classroomName: string;
  guardianName: string;
  guardianPhone: string;
  meetingDate: string;
  meetingTime: string;
  office: string;
  motif: string;
}

interface ConseilDisciplineData {
  sessionRef: string;
  studentName: string;
  matricule: string;
  classroomName: string;
  guardianName: string;
  sessionDate: string;
  sessionTime: string;
  location: string;
  presidentName: string; // Proviseur
  rapporteurName: string; // Surveillant Général
  principalTeacher: string;
  parentsRepName: string;
  studentDelegateName: string;
  charges: string; // Faits reprochés
  defenseNotes: string; // Déclarations de l'élève
  decision: string; // Sanction prononcée (Exclusion temporaire 8 jours, etc.)
}

const DEFAULT_MOTIFS_RETARD = [
  'Panne d’engin / de moto sur le trajet',
  'Panne de vélo / crevaison',
  'Réveil tardif / empêchement matinal',
  'Intempéries / forte pluie',
  'Embouteillage échangeur / carrefour',
  'Consultation médicale préalable',
  'Raison familiale urgente',
];

const DEFAULT_MOTIFS_SORTIE = [
  'Malaise / forte fièvre constatée par l’infirmerie',
  'Convocation urgente par les parents',
  'Rendez-vous médical spécialiste',
  'Démarche administrative officielle (CNIB/Passeport)',
  'Événement familial grave',
];

const DEFAULT_CORVEES_TASKS = [
  { value: 'BALAYAGE_COUR', label: 'Balayage complet de la cour de récréation' },
  { value: 'RAMASSAGE_SACHETS', label: 'Ramassage des sachets plastiques et déchets scolaires' },
  { value: 'DESHERBAGE_JARDIN', label: 'Désherbage et arrosage des parterres / jardin scolaire' },
  { value: 'NETTOYAGE_TABLEAUX_BANCS', label: 'Nettoyage des tableaux et réalignement des tables-bancs' },
  { value: 'SALUBRITE_COMMUNE', label: 'Travaux d’intérêt général et salubrité commune' },
];

function DisciplineContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'tickets';

  const [activeTab, setActiveTab] = useState<'tickets' | 'corvees' | 'sanctions' | 'convocation' | 'conseil'>(initialTab);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [academicYear, setAcademicYear] = useState(getActiveAcademicYear());
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // ── ÉTATS BILLETS D'ENTRÉE / SORTIE ──
  const [ticketsList, setTicketsList] = useState<PassageTicket[]>([
    {
      id: 'tic-1',
      ticketNumber: 'BE-2026-0041',
      type: 'ENTREE_RETARD',
      studentId: 'std-1',
      studentName: 'OUEDRAOGO Fatimata',
      matricule: 'KLS-2026-0042',
      classroomName: 'Terminale D',
      date: new Date().toLocaleDateString('fr-FR'),
      time: '07h35',
      motif: 'Panne d’engin sur l’Avenue Mogho Naba',
      isJustified: true,
      teacherName: 'M. ILBOUDO (Maths)',
      supervisorName: 'Le Surveillant Général',
    },
    {
      id: 'tic-2',
      ticketNumber: 'BS-2026-0012',
      type: 'SORTIE_EXCEPTIONNELLE',
      studentId: 'std-2',
      studentName: 'SAWADOGO Wendy',
      matricule: 'KLS-2026-0063',
      classroomName: 'CM2',
      date: new Date().toLocaleDateString('fr-FR'),
      time: '11h20',
      motif: 'Malaise / céphalées constatées par l’infirmerie',
      isJustified: true,
      supervisorName: 'Le Surveillant Général',
    },
  ]);

  // Formulaire nouveau billet
  const [formTicketType, setFormTicketType] = useState<'ENTREE_RETARD' | 'SORTIE_EXCEPTIONNELLE'>('ENTREE_RETARD');
  const [formStudentId, setFormStudentId] = useState('');
  const [formTicketTime, setFormTicketTime] = useState(
    new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  );
  const [formTicketMotif, setFormTicketMotif] = useState(DEFAULT_MOTIFS_RETARD[0]);
  const [formTicketJustified, setFormTicketJustified] = useState(true);
  const [formTicketTeacher, setFormTicketTeacher] = useState('');
  const [selectedTicketToPrint, setSelectedTicketToPrint] = useState<PassageTicket | null>(null);

  // ── ÉTATS CORVÉES DISCIPLINAIRES & SALUBRITÉ (CONTEXTE AFRICAIN) ──
  const [corveesList, setCorveesList] = useState<CorveeRecord[]>([
    {
      id: 'corv-1',
      studentId: 'std-3',
      studentName: 'BAMBARA Christian',
      matricule: 'KLS-2026-0001',
      classroomName: 'Terminale D',
      guardianPhone: '+226 70 20 30 40',
      date: new Date().toLocaleDateString('fr-FR'),
      timing: 'Après les cours (17h00 - 18h00)',
      taskType: 'BALAYAGE_COUR',
      taskLabel: 'Balayage complet de la cour de récréation et ramassage des sachets',
      motif: 'Bavardages répétés et perturbation du cours de Physique-Chimie',
      supervisedBy: 'M. ZONGO (Surveillant de permanence)',
      status: 'A_EXECUTER',
    },
    {
      id: 'corv-2',
      studentId: 'std-4',
      studentName: 'TRAORE Abdoul-Kader',
      matricule: 'KLS-2026-0077',
      classroomName: 'CM2',
      guardianPhone: '+226 76 55 44 33',
      date: new Date().toLocaleDateString('fr-FR'),
      timing: 'Pause de midi (12h30 - 13h00)',
      taskType: 'NETTOYAGE_TABLEAUX_BANCS',
      taskLabel: 'Nettoyage des tableaux et réalignement des tables-bancs',
      motif: 'Retards répétés non justifiés à la sonnerie de 07h00',
      supervisedBy: 'Le Maître Titulaire',
      status: 'EFFECTUEE',
    },
  ]);

  const [formCorveeStudentId, setFormCorveeStudentId] = useState('');
  const [formCorveeDate, setFormCorveeDate] = useState(new Date().toLocaleDateString('fr-FR'));
  const [formCorveeTiming, setFormCorveeTiming] = useState('Après les cours (17h00 - 18h00)');
  const [formCorveeTaskType, setFormCorveeTaskType] = useState<'BALAYAGE_COUR' | 'RAMASSAGE_SACHETS' | 'DESHERBAGE_JARDIN' | 'NETTOYAGE_TABLEAUX_BANCS' | 'SALUBRITE_COMMUNE'>('BALAYAGE_COUR');
  const [formCorveeMotif, setFormCorveeMotif] = useState('Insolence et refus d’obtempérer en classe');
  const [formCorveeSupervisor, setFormCorveeSupervisor] = useState('Le Surveillant Général');

  // ── ÉTATS SANCTIONS & NOTE DE CONDUITE ──
  const [sanctionsList, setSanctionsList] = useState<SanctionRecord[]>([
    {
      id: 'sanc-1',
      studentId: 'std-3',
      studentName: 'BAMBARA Christian',
      matricule: 'KLS-2026-0001',
      classroomName: 'Terminale D',
      type: 'AVERTISSEMENT_ECRIT',
      motif: 'Insolence caractérisée envers le surveillant de couloir',
      date: '04/11/2026',
      pointsDeducted: 2,
      conductScore: 18,
      status: 'ACTIF',
    },
    {
      id: 'sanc-2',
      studentId: 'std-5',
      studentName: 'COMPAORE Inès',
      matricule: 'KLS-2026-0014',
      classroomName: 'Terminale D',
      type: 'AVERTISSEMENT_VERBAL',
      motif: 'Retards répétés non justifiés à la montée des couleurs',
      date: '02/11/2026',
      pointsDeducted: 1,
      conductScore: 19,
      status: 'ACTIF',
    },
  ]);

  // Formulaire nouvelle sanction
  const [formSancStudentId, setFormSancStudentId] = useState('');
  const [formSancType, setFormSancType] = useState<'AVERTISSEMENT_VERBAL' | 'AVERTISSEMENT_ECRIT' | 'BLAME_CONDUITE' | 'EXCLUSION_TEMPORAIRE' | 'CONSEIL_DISCIPLINE'>('AVERTISSEMENT_ECRIT');
  const [formSancMotif, setFormSancMotif] = useState('');
  const [formSancPoints, setFormSancPoints] = useState(2);

  // ── ÉTAT CONVOCATION OFFICIELLE PARENT (A4) ──
  const [convocationForm, setConvocationForm] = useState<ConvocationData>({
    studentName: 'BAMBARA Christian',
    matricule: 'KLS-2026-0001',
    classroomName: 'Terminale D',
    guardianName: 'M. BAMBARA Antoine',
    guardianPhone: '+226 70 20 30 40',
    meetingDate: new Date(Date.now() + 2 * 86400000).toLocaleDateString('fr-FR'),
    meetingTime: '10h00',
    office: 'Bureau du Surveillant Général (Bâtiment Administratif)',
    motif: 'Comportement perturbateur récurrent, retards persistants et indiscipline notoire.',
  });

  // ── ÉTAT CONSEIL DE DISCIPLINE (PV OFFICIEL A4) ──
  const [conseilForm, setConseilForm] = useState<ConseilDisciplineData>({
    sessionRef: 'PV-CD-2026/003',
    studentName: 'BAMBARA Christian',
    matricule: 'KLS-2026-0001',
    classroomName: 'Terminale D',
    guardianName: 'M. BAMBARA Antoine',
    sessionDate: new Date().toLocaleDateString('fr-FR'),
    sessionTime: '15h30',
    location: 'Salle des Professeurs du Complexe',
    presidentName: 'M. ILBOUDO Marc (Proviseur)',
    rapporteurName: 'M. OUEDRAOGO Paul (Surveillant Général)',
    principalTeacher: 'Mme SAWADOGO Clarisse (Prof. Principal Tle D)',
    parentsRepName: 'M. KABORE Souleymane (Président APE)',
    studentDelegateName: 'Mlle DIALLO Mariam (Déléguée générale des élèves)',
    charges: 'Bagarre violente dans l’enceinte de l’établissement ayant entraîné des dégâts matériels, accompagnée de refus d’obtempérer aux injonctions du surveillant de service.',
    defenseNotes: 'L’élève a reconnu les faits tout en exprimant des regrets sincères. Le tuteur a présenté ses excuses à l’administration et s’est engagé à un encadrement strict à domicile.',
    decision: 'Exclusion temporaire des cours pour une durée de trois (03) jours fermes avec retenue de 6 points sur la note de conduite, assortie d’une corvée de salubrité de 2 heures.',
  });

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

  // 2. Charger classes et élèves de Supabase
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: cData } = await supabase.from('classrooms').select('id, name, cycle').order('name');
        if (cData) setClassrooms(cData);

        const { data: sData } = await supabase
          .from('students')
          .select(`
            id,
            matricule,
            last_name,
            first_name,
            gender,
            classroom_id,
            guardian_name,
            guardian_phone,
            classrooms ( name )
          `)
          .order('last_name', { ascending: true });

        if (sData) {
          const mapped: StudentOption[] = sData.map((s: any) => ({
            id: s.id,
            matricule: s.matricule || 'KLS-000',
            last_name: s.last_name,
            first_name: s.first_name,
            gender: s.gender || 'M',
            classroom_id: s.classroom_id,
            classroom_name: s.classrooms?.name || 'Classe',
            guardian_name: s.guardian_name,
            guardian_phone: s.guardian_phone,
          }));
          setStudents(mapped);
          if (mapped.length > 0) {
            setFormStudentId(mapped[0].id);
            setFormCorveeStudentId(mapped[0].id);
            setFormSancStudentId(mapped[0].id);
          }
        }
      } catch (e) {
        console.error('Erreur chargement données discipline:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Émission d'un nouveau billet
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === formStudentId);
    if (!st) return;

    const prefix = formTicketType === 'ENTREE_RETARD' ? 'BE' : 'BS';
    const num = `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket: PassageTicket = {
      id: 'tic-' + Date.now(),
      ticketNumber: num,
      type: formTicketType,
      studentId: st.id,
      studentName: `${st.last_name} ${st.first_name}`,
      matricule: st.matricule,
      classroomName: st.classroom_name,
      date: new Date().toLocaleDateString('fr-FR'),
      time: formTicketTime,
      motif: formTicketMotif,
      isJustified: formTicketJustified,
      teacherName: formTicketTeacher || undefined,
      supervisorName: 'Le Surveillant Général',
    };

    setTicketsList([newTicket, ...ticketsList]);
    setSelectedTicketToPrint(newTicket);
  };

  // Assignation d'une corvée scolaire
  const handleCreateCorvee = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === formCorveeStudentId);
    if (!st) return;

    const matchedTask = DEFAULT_CORVEES_TASKS.find((t) => t.value === formCorveeTaskType);

    const newCorv: CorveeRecord = {
      id: 'corv-' + Date.now(),
      studentId: st.id,
      studentName: `${st.last_name} ${st.first_name}`,
      matricule: st.matricule,
      classroomName: st.classroom_name,
      guardianPhone: st.guardian_phone || '+226 70 00 00 00',
      date: formCorveeDate,
      timing: formCorveeTiming,
      taskType: formCorveeTaskType,
      taskLabel: matchedTask?.label || 'Tâche de propreté et salubrité',
      motif: formCorveeMotif,
      supervisedBy: formCorveeSupervisor,
      status: 'A_EXECUTER',
    };

    setCorveesList([newCorv, ...corveesList]);
  };

  // Basculer statut d'une corvée
  const toggleCorveeStatus = (id: string) => {
    setCorveesList((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === 'A_EXECUTER' ? 'EFFECTUEE' : 'A_EXECUTER' } : c
      )
    );
  };

  // Ajout d'une sanction officielle
  const handleCreateSanction = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === formSancStudentId);
    if (!st) return;

    const newSanc: SanctionRecord = {
      id: 'sanc-' + Date.now(),
      studentId: st.id,
      studentName: `${st.last_name} ${st.first_name}`,
      matricule: st.matricule,
      classroomName: st.classroom_name,
      type: formSancType,
      motif: formSancMotif || 'Infraction au règlement intérieur',
      date: new Date().toLocaleDateString('fr-FR'),
      pointsDeducted: formSancPoints,
      conductScore: Math.max(0, 20 - formSancPoints),
      status: 'ACTIF',
    };

    setSanctionsList([newSanc, ...sanctionsList]);
    setFormSancMotif('');
  };

  // Lien WhatsApp d'information parent pour corvée
  const getWhatsAppCorveeUrl = (c: CorveeRecord) => {
    const text = encodeURIComponent(
      `Bonjour M./Mme,\n\n` +
      `La Surveillance Générale du ${schoolSettings.name} vous informe que votre enfant ${c.studentName} (${c.classroomName}, Matr: ${c.matricule}) s'est vu assigner une tâche d'intérêt scolaire de salubrité : "${c.taskLabel}".\n\n` +
      `• Horaire : ${c.timing} le ${c.date}\n` +
      `• Motif : ${c.motif}\n` +
      `• Contrôlé par : ${c.supervisedBy}\n\n` +
      `Cette mesure éducative vise à inculquer le civisme et le respect du cadre scolaire.\n\n` +
      `Surveillance Générale : ${schoolSettings.phone}`
    );
    const cleanPhone = c.guardianPhone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  // Impression
  const handlePrint = () => {
    window.print();
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
            title="Vie Scolaire, Discipline & Surveillance Générale"
            breadcrumbs={[
              { label: 'Tableau de Bord', href: '/dashboard' },
              { label: 'Scolarité' },
              { label: 'Discipline & Billets' },
            ]}
          />
        </div>

        {/* ── BARRE DE CONTRÔLE SUPÉRIEURE (print:hidden) ── */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 print:hidden shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                  Bureau de la Surveillance Générale
                </span>
                <span className="text-xs text-slate-500 font-medium">Année Scolaire {academicYear}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">
                Discipline Scolaire, Billets de Passage & Salubrité
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Billets d’entrée et de sortie, corvées d’intérêt général, note de conduite / 20, convocations A4 et conseils de discipline.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-smooth shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={16} weight="bold" />
                <span>
                  {activeTab === 'convocation'
                    ? 'Imprimer Convocation A4'
                    : activeTab === 'conseil'
                    ? 'Imprimer PV Conseil A4'
                    : selectedTicketToPrint
                    ? 'Imprimer Billet Sélectionné'
                    : 'Imprimer la Fiche Actuelle'}
                </span>
              </button>
            </div>
          </div>

          {/* ONGLETS MAJEURS DU BUREAU DE SURVEILLANCE */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            <button
              onClick={() => { setActiveTab('tickets'); setSelectedTicketToPrint(null); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-smooth cursor-pointer ${
                activeTab === 'tickets'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Ticket size={16} weight="bold" />
              <span>Billets d’Entrée & Sortie ({ticketsList.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('corvees'); setSelectedTicketToPrint(null); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-smooth cursor-pointer ${
                activeTab === 'corvees'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <WarningCircle size={16} weight="bold" />
              <span>Corvées & Salubrité ({corveesList.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('sanctions'); setSelectedTicketToPrint(null); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-smooth cursor-pointer ${
                activeTab === 'sanctions'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <ShieldCheck size={16} weight="bold" />
              <span>Sanctions & Note de Conduite ({sanctionsList.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('convocation'); setSelectedTicketToPrint(null); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-smooth cursor-pointer ${
                activeTab === 'convocation'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <FileText size={16} weight="bold" />
              <span>Convocation Parent (A4)</span>
            </button>

            <button
              onClick={() => { setActiveTab('conseil'); setSelectedTicketToPrint(null); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-smooth cursor-pointer ${
                activeTab === 'conseil'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Scales size={16} weight="bold" />
              <span>Conseil de Discipline (PV A4)</span>
            </button>
          </div>
        </div>

        {/* ── CORPS DE LA PAGE ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0">
          {/* STATS RAPIDES (print:hidden) */}
          <div className="max-w-6xl mx-auto mb-6 print:hidden grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Retards Traités</span>
              <div className="text-xl font-black text-amber-700 mt-0.5">
                {ticketsList.filter((t) => t.type === 'ENTREE_RETARD').length} billets
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Accès en classe régularisé</div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Sorties Accordées</span>
              <div className="text-xl font-black text-blue-700 mt-0.5">
                {ticketsList.filter((t) => t.type === 'SORTIE_EXCEPTIONNELLE').length} billets
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Passage portail autorisé</div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Corvées Assignées</span>
              <div className="text-xl font-black text-rose-700 mt-0.5">
                {corveesList.filter((c) => c.status === 'A_EXECUTER').length} en attente
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Salubrité scolaire</div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Moyenne Conduite</span>
              <div className="text-xl font-black text-emerald-700 mt-0.5">18.6 / 20</div>
              <div className="text-[11px] text-emerald-800 mt-0.5">Barème MENAPLN stable</div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto space-y-6">
            {/* ═══════════════════════════════════════════════════════════════
                ONGLET 1 : BILLETS D'ENTRÉE & SORTIE
                ═══════════════════════════════════════════════════════════════ */}
            {activeTab === 'tickets' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Formulaire d'émission express */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 print:hidden">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Ticket size={18} className="text-rose-700" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Émettre un Billet de Passage (&lt; 15s)
                      </h3>
                    </div>

                    <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
                      {/* Choix type */}
                      <div>
                        <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                          Nature du Billet *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFormTicketType('ENTREE_RETARD');
                              setFormTicketMotif(DEFAULT_MOTIFS_RETARD[0]);
                            }}
                            className={`p-2.5 rounded-lg border text-center font-bold text-xs transition-smooth ${
                              formTicketType === 'ENTREE_RETARD'
                                ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            Billet d&apos;Entrée (Retard)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormTicketType('SORTIE_EXCEPTIONNELLE');
                              setFormTicketMotif(DEFAULT_MOTIFS_SORTIE[0]);
                            }}
                            className={`p-2.5 rounded-lg border text-center font-bold text-xs transition-smooth ${
                              formTicketType === 'SORTIE_EXCEPTIONNELLE'
                                ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            Billet de Sortie
                          </button>
                        </div>
                      </div>

                      {/* Élève */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Élève concerné *</label>
                        <select
                          value={formStudentId}
                          onChange={(e) => setFormStudentId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none"
                        >
                          {students.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.last_name} {st.first_name} ({st.classroom_name} - {st.matricule})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Heure et justification */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Heure constatée</label>
                          <input
                            type="text"
                            value={formTicketTime}
                            onChange={(e) => setFormTicketTime(e.target.value)}
                            placeholder="Ex : 07h35"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Motif Justifié ?</label>
                          <select
                            value={formTicketJustified ? 'YES' : 'NO'}
                            onChange={(e) => setFormTicketJustified(e.target.value === 'YES')}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs outline-none"
                          >
                            <option value="YES">✅ Oui (Justifié)</option>
                            <option value="NO">❌ Non justifié</option>
                          </select>
                        </div>
                      </div>

                      {/* Motif */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Motif du retard ou départ</label>
                        <select
                          value={formTicketMotif}
                          onChange={(e) => setFormTicketMotif(e.target.value)}
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none mb-1.5"
                        >
                          {(formTicketType === 'ENTREE_RETARD' ? DEFAULT_MOTIFS_RETARD : DEFAULT_MOTIFS_SORTIE).map((m, i) => (
                            <option key={i} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={formTicketMotif}
                          onChange={(e) => setFormTicketMotif(e.target.value)}
                          placeholder="Ou précisez le motif exact..."
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none"
                        />
                      </div>

                      {/* Professeur destinataire */}
                      {formTicketType === 'ENTREE_RETARD' && (
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Professeur en classe</label>
                          <input
                            type="text"
                            value={formTicketTeacher}
                            onChange={(e) => setFormTicketTeacher(e.target.value)}
                            placeholder="Ex : M. ILBOUDO (Mathématiques)"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none"
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-nature-700 hover:bg-nature-800 text-white font-bold rounded-xl shadow-xs transition-smooth cursor-pointer mt-2"
                      >
                        Générer & Prévisualiser le Billet
                      </button>
                    </form>
                  </div>

                  {/* APERÇU IMMÉDIAT DU BILLET OFFICIEL IMPRIMABLE (Format Ticket Coupon) */}
                  <div className="lg:col-span-2 space-y-4">
                    {selectedTicketToPrint ? (
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 print:hidden">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Ticket size={16} className="text-nature-700" />
                            <span>Aperçu du Billet Officiel de Passage</span>
                          </span>
                          <button
                            type="button"
                            onClick={handlePrint}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-smooth flex items-center gap-1 cursor-pointer"
                          >
                            <Printer size={14} weight="bold" />
                            <span>Imprimer ce Billet</span>
                          </button>
                        </div>

                        {/* CARTOUCHE DU TICKET / COUPON OFFICIEL */}
                        <div
                          id="printable-ticket-sheet"
                          className="border-2 border-dashed border-slate-400 bg-amber-50/20 p-5 rounded-lg text-black font-sans leading-tight relative max-w-lg mx-auto"
                        >
                          <AfricanMotif pattern={schoolSettings.watermark_pattern} opacity={0.04} className="absolute inset-0 pointer-events-none" />

                          {/* En-tête */}
                          <div className="flex justify-between items-start border-b border-black pb-2 mb-3">
                            <div className="text-left w-2/3">
                              <div className="font-bold text-[10px] uppercase">{schoolSettings.name}</div>
                              <div className="text-[8px] text-slate-600">{schoolSettings.city} • Tél : {schoolSettings.phone}</div>
                              <div className="text-[8px] text-slate-500 font-mono">Surveillance Générale • Année {academicYear}</div>
                            </div>
                            <div className="text-right w-1/3">
                              <span className="font-mono text-[9px] font-bold block">{selectedTicketToPrint.ticketNumber}</span>
                              <span className="text-[8px] text-slate-500">{selectedTicketToPrint.date}</span>
                            </div>
                          </div>

                          {/* Titre */}
                          <div className={`p-1.5 text-center font-black text-xs uppercase tracking-wider rounded mb-3 ${
                            selectedTicketToPrint.type === 'ENTREE_RETARD'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-blue-100 text-blue-900 border border-blue-300'
                          }`}>
                            {selectedTicketToPrint.type === 'ENTREE_RETARD'
                              ? 'BILLET D’ENTRÉE EN CLASSE (RETARD)'
                              : 'AUTORISATION EXCEPTIONNELLE DE SORTIE'}
                          </div>

                          {/* Données de l'élève */}
                          <div className="space-y-1.5 text-[11px] mb-4">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Nom & Prénom(s) :</span>
                              <strong className="text-slate-900 uppercase">{selectedTicketToPrint.studentName}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Classe / Matricule :</span>
                              <strong className="text-slate-900">{selectedTicketToPrint.classroomName} • {selectedTicketToPrint.matricule}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Heure constatée :</span>
                              <strong className="font-mono text-slate-900">{selectedTicketToPrint.time}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Statut du motif :</span>
                              <span className={`font-bold ${selectedTicketToPrint.isJustified ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {selectedTicketToPrint.isJustified ? 'Justifié par l’administration' : 'Non justifié'}
                              </span>
                            </div>
                            <div className="pt-1 border-t border-slate-200">
                              <span className="text-slate-600 block text-[9.5px]">Motif :</span>
                              <span className="italic text-slate-800">{selectedTicketToPrint.motif}</span>
                            </div>
                            {selectedTicketToPrint.teacherName && (
                              <div>
                                <span className="text-slate-600 text-[9.5px]">Professeur en classe : </span>
                                <span className="font-semibold">{selectedTicketToPrint.teacherName}</span>
                              </div>
                            )}
                          </div>

                          {/* Signatures */}
                          <div className="flex justify-between items-end pt-2 border-t border-black text-[9px] mt-2">
                            <div>
                              <div className="font-bold">Le Surveillant Général</div>
                              <div className="h-7"></div>
                              <div className="text-[7.5px] text-slate-500">(Cachet & Visa)</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">Visa du Professeur</div>
                              <div className="h-7"></div>
                              <div className="text-[7.5px] text-slate-500">(Signature à l’entrée)</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Liste des billets récents */
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Registre des Billets Émis Récemment ({ticketsList.length})
                          </h3>
                          <span className="text-[10px] text-slate-500">Cliquez sur un billet pour l’imprimer</span>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {ticketsList.map((tic) => (
                            <div
                              key={tic.id}
                              onClick={() => setSelectedTicketToPrint(tic)}
                              className="py-3 px-2 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition-smooth"
                            >
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                  tic.type === 'ENTREE_RETARD'
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-blue-100 text-blue-900'
                                }`}>
                                  {tic.type === 'ENTREE_RETARD' ? 'Retard' : 'Sortie'}
                                </span>
                                <div>
                                  <div className="text-xs font-bold text-slate-900">{tic.studentName}</div>
                                  <div className="text-[11px] text-slate-500">
                                    {tic.classroomName} • {tic.time} • {tic.motif}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                  {tic.ticketNumber}
                                </span>
                                <Printer size={15} className="text-slate-400 hover:text-slate-700" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                ONGLET 2 : CORVÉES SCOLAIRES & SALUBRITÉ (CONTEXTE AFRICAIN)
                ═══════════════════════════════════════════════════════════════ */}
            {activeTab === 'corvees' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formulaire assignation de corvée */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 print:hidden">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <WarningCircle size={18} className="text-rose-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Assigner une Corvée de Salubrité
                    </h3>
                  </div>

                  <form onSubmit={handleCreateCorvee} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Élève sanctionné *</label>
                      <select
                        value={formCorveeStudentId}
                        onChange={(e) => setFormCorveeStudentId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none"
                      >
                        {students.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.last_name} {st.first_name} ({st.classroom_name} - {st.matricule})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Tâche de Salubrité Citoyenne *</label>
                      <select
                        value={formCorveeTaskType}
                        onChange={(e) => setFormCorveeTaskType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none"
                      >
                        {DEFAULT_CORVEES_TASKS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Date d’exécution</label>
                        <input
                          type="text"
                          value={formCorveeDate}
                          onChange={(e) => setFormCorveeDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Créneau horaire</label>
                        <select
                          value={formCorveeTiming}
                          onChange={(e) => setFormCorveeTiming(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs outline-none"
                        >
                          <option value="Après les cours (17h00 - 18h00)">Après les cours (17h00 - 18h00)</option>
                          <option value="Pause de midi (12h30 - 13h00)">Pause de midi (12h30 - 13h00)</option>
                          <option value="Avant la montée des couleurs (06h30)">Avant les couleurs (06h30)</option>
                          <option value="Pause récréation (10h00 - 10h30)">Pause récréation</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Motif de l’infraction</label>
                      <input
                        type="text"
                        value={formCorveeMotif}
                        onChange={(e) => setFormCorveeMotif(e.target.value)}
                        placeholder="Ex : Retards répétés, bagarre, insolence..."
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Surveillant de permanence</label>
                      <input
                        type="text"
                        value={formCorveeSupervisor}
                        onChange={(e) => setFormCorveeSupervisor(e.target.value)}
                        placeholder="Ex : M. ZONGO (Surveillant de service)"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl shadow-xs transition-smooth cursor-pointer mt-2"
                    >
                      Assigner la Corvée
                    </button>
                  </form>
                </div>

                {/* Registre des corvées scolaires & suivi d'exécution */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Registre des Corvées & Travaux de Salubrité ({corveesList.length})
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Suivi d’exécution par le surveillant de garde. Sanction éducative citoyenne conforme au règlement intérieur.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-smooth flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <Printer size={14} weight="bold" />
                      <span>Imprimer le Registre</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                      <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                        <tr>
                          <th className="p-2.5">Élève & Classe</th>
                          <th className="p-2.5">Horaire</th>
                          <th className="p-2.5">Tâche Assignée & Motif</th>
                          <th className="p-2.5 text-center">Statut</th>
                          <th className="p-2.5 text-right print:hidden">Alerte WhatsApp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {corveesList.map((corv) => (
                          <tr key={corv.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5">
                              <strong className="text-slate-900 block">{corv.studentName}</strong>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {corv.classroomName} • {corv.matricule}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-[11px] font-semibold text-rose-800">
                              {corv.timing}
                            </td>
                            <td className="p-2.5 max-w-xs">
                              <div className="text-xs font-bold text-slate-800">{corv.taskLabel}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Motif : <span className="italic">{corv.motif}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Contrôle : {corv.supervisedBy}
                              </div>
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => toggleCorveeStatus(corv.id)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-smooth cursor-pointer ${
                                  corv.status === 'EFFECTUEE'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                }`}
                              >
                                {corv.status === 'EFFECTUEE' ? '✅ Exécutée & Visée' : '⏳ À exécuter'}
                              </button>
                            </td>
                            <td className="p-2.5 text-right print:hidden">
                              <a
                                href={getWhatsAppCorveeUrl(corv)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Informer le parent de la sanction par WhatsApp"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-lg border border-emerald-200 transition-smooth"
                              >
                                <ChatCircleText size={14} weight="bold" />
                                <span>Avis Parent</span>
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                ONGLET 3 : REGISTRE DES SANCTIONS & NOTE DE CONDUITE
                ═══════════════════════════════════════════════════════════════ */}
            {activeTab === 'sanctions' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Registre Disciplinaire & Déduction sur la Note de Conduite
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Barème Officiel MENAPLN : Note de départ à 20/20. Déduction automatique répercutée sur les bulletins trimestriels.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      Barème Officiel Actif
                    </span>
                  </div>

                  {/* Explication du barème des déductions burkinabè */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block text-[11px]">Retard non justifié</span>
                      <span className="text-rose-700 font-mono font-black text-sm">-0.5 point</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block text-[11px]">Avertissement écrit</span>
                      <span className="text-rose-700 font-mono font-black text-sm">-2 points</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block text-[11px]">Blâme de Conduite</span>
                      <span className="text-rose-700 font-mono font-black text-sm">-4 points</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block text-[11px]">Exclusion (1 à 3 j)</span>
                      <span className="text-rose-700 font-mono font-black text-sm">-6 points</span>
                    </div>
                  </div>

                  {/* Formulaire d'enregistrement d'une sanction */}
                  <form onSubmit={handleCreateSanction} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3 print:hidden">
                    <div className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      Enregistrer une Sanction Disciplinaire
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Élève *</label>
                        <select
                          value={formSancStudentId}
                          onChange={(e) => setFormSancStudentId(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 outline-none"
                        >
                          {students.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.last_name} {st.first_name} ({st.classroom_name})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Nature de la Sanction *</label>
                        <select
                          value={formSancType}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setFormSancType(val);
                            if (val === 'AVERTISSEMENT_VERBAL') setFormSancPoints(1);
                            else if (val === 'AVERTISSEMENT_ECRIT') setFormSancPoints(2);
                            else if (val === 'BLAME_CONDUITE') setFormSancPoints(4);
                            else if (val === 'EXCLUSION_TEMPORAIRE') setFormSancPoints(6);
                            else setFormSancPoints(10);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 outline-none"
                        >
                          <option value="AVERTISSEMENT_VERBAL">Avertissement Verbal (-1 pt)</option>
                          <option value="AVERTISSEMENT_ECRIT">Avertissement Écrit (-2 pts)</option>
                          <option value="BLAME_CONDUITE">Blâme Officiel (-4 pts)</option>
                          <option value="EXCLUSION_TEMPORAIRE">Exclusion Temporaire 1-3j (-6 pts)</option>
                          <option value="CONSEIL_DISCIPLINE">Conseil de Discipline (-10 pts)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">Motif précis de la décision</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formSancMotif}
                            onChange={(e) => setFormSancMotif(e.target.value)}
                            placeholder="Ex : Insolence envers un professeur, perturbation..."
                            className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                          />
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg transition-smooth cursor-pointer shrink-0"
                          >
                            Appliquer
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Tableau des sanctions */}
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                      <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                        <tr>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Élève</th>
                          <th className="p-2.5">Classe</th>
                          <th className="p-2.5">Nature de la Sanction</th>
                          <th className="p-2.5">Motif</th>
                          <th className="p-2.5 text-center">Déduction</th>
                          <th className="p-2.5 text-center">Note Conduite</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {sanctionsList.map((sanc) => (
                          <tr key={sanc.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-mono text-slate-500">{sanc.date}</td>
                            <td className="p-2.5 font-bold text-slate-900">{sanc.studentName}</td>
                            <td className="p-2.5 font-semibold text-slate-700">{sanc.classroomName}</td>
                            <td className="p-2.5">
                              <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                {sanc.type.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-600">{sanc.motif}</td>
                            <td className="p-2.5 text-center font-mono font-bold text-rose-700">
                              -{sanc.pointsDeducted} pts
                            </td>
                            <td className="p-2.5 text-center font-mono font-black text-slate-900 text-sm">
                              {sanc.conductScore} / 20
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                ONGLET 4 : CONVOCATION OFFICIELLE PARENT (FORMAT A4)
                ═══════════════════════════════════════════════════════════════ */}
            {activeTab === 'convocation' && (
              <div className="space-y-6">
                {/* Formulaire des paramètres de la convocation */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 print:hidden">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span>Paramétrer la Lettre de Convocation Parent</span>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-smooth flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer size={14} weight="bold" />
                      <span>Imprimer Convocation Officielle (A4)</span>
                    </button>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Parent / Tuteur</label>
                      <input
                        type="text"
                        value={convocationForm.guardianName}
                        onChange={(e) => setConvocationForm({ ...convocationForm, guardianName: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Date du Rendez-vous</label>
                      <input
                        type="text"
                        value={convocationForm.meetingDate}
                        onChange={(e) => setConvocationForm({ ...convocationForm, meetingDate: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Heure du Rendez-vous</label>
                      <input
                        type="text"
                        value={convocationForm.meetingTime}
                        onChange={(e) => setConvocationForm({ ...convocationForm, meetingTime: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Lieu / Bureau</label>
                      <input
                        type="text"
                        value={convocationForm.office}
                        onChange={(e) => setConvocationForm({ ...convocationForm, office: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Téléphone Parent</label>
                      <input
                        type="text"
                        value={convocationForm.guardianPhone}
                        onChange={(e) => setConvocationForm({ ...convocationForm, guardianPhone: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Motif de la convocation</label>
                      <input
                        type="text"
                        value={convocationForm.motif}
                        onChange={(e) => setConvocationForm({ ...convocationForm, motif: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* LETTRE OFFICIELLE DE CONVOCATION A4 (IMPRIMABLE) */}
                <div
                  id="printable-convocation-sheet"
                  className="max-w-[850px] mx-auto bg-white p-8 sm:p-12 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 text-black leading-relaxed"
                  style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                >
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
                      {schoolSettings.logo_url ? (
                        <div className="w-14 h-14 flex items-center justify-center mb-1">
                          <img src={schoolSettings.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                        </div>
                      ) : (
                        <BurkinaCoatOfArms className="w-12 h-12" />
                      )}
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

                  {/* Référence et Date */}
                  <div className="flex justify-between items-center text-xs mb-6 font-medium">
                    <div>Réf : <strong>CONV-{academicYear}/DISC-014</strong></div>
                    <div>Fait à {schoolSettings.city}, le {new Date().toLocaleDateString('fr-FR')}</div>
                  </div>

                  {/* Destinataire */}
                  <div className="border border-black p-4 mb-6 text-xs w-2/3 ml-auto bg-slate-50/50">
                    <div className="font-bold uppercase text-[10px] text-slate-600">À l&apos;attention de :</div>
                    <div className="font-bold text-sm text-black mt-1">M. / Mme {convocationForm.guardianName}</div>
                    <div>Parent / Tuteur de l&apos;élève : <strong className="uppercase">{convocationForm.studentName}</strong></div>
                    <div>Classe : <strong>{convocationForm.classroomName}</strong> (Matricule : <span className="font-mono">{convocationForm.matricule}</span>)</div>
                    <div>Téléphone : <span className="font-mono font-bold">{convocationForm.guardianPhone}</span></div>
                  </div>

                  {/* Objet */}
                  <div className="mb-6">
                    <div className="text-sm font-black uppercase tracking-wider underline">
                      OBJET : LETTRE DE CONVOCATION DISCIPLINAIRE DU TUTEUR LÉGAL
                    </div>
                  </div>

                  {/* Corps de la convocation */}
                  <div className="text-xs space-y-4 text-justify">
                    <p>Madame, Monsieur,</p>
                    <p>
                      La Direction du <strong>{schoolSettings.name}</strong> a l&apos;honneur de vous prier de bien vouloir vous présenter
                      au sein de notre établissement pour un entretien relatif à la scolarité et à la conduite de votre enfant <strong>{convocationForm.studentName}</strong>,
                      régulièrement inscrit(e) en classe de <strong>{convocationForm.classroomName}</strong>.
                    </p>
                    <div className="p-3 bg-slate-50 border-l-4 border-black text-xs space-y-1">
                      <div>• <strong>Date du Rendez-vous :</strong> {convocationForm.meetingDate}</div>
                      <div>• <strong>Heure précise :</strong> {convocationForm.meetingTime}</div>
                      <div>• <strong>Lieu :</strong> {convocationForm.office}</div>
                      <div>• <strong>Motif :</strong> {convocationForm.motif}</div>
                    </div>
                    <p>
                      En raison de l&apos;importance des décisions éducatives et disciplinaires à prendre dans l&apos;intérêt supérieur
                      de l&apos;élève, <strong>votre présence physique personnelle est impérative</strong>.
                    </p>
                    <p className="text-[11px] italic text-slate-700">
                      En cas d&apos;empêchement majeur et dûment justifié, merci d&apos;en informer sans délai le secrétariat de l&apos;établissement
                      au numéro d&apos;urgence <strong>{schoolSettings.phone}</strong> pour convenir d&apos;un nouveau créneau.
                    </p>
                    <p>Comptant sur votre diligence et votre franche collaboration, nous vous prions d&apos;agréer, Madame, Monsieur, nos salutations respectueuses.</p>
                  </div>

                  {/* Signature administration */}
                  <div className="flex justify-between items-end pt-6 border-t-2 border-black mt-6 text-xs">
                    <div>
                      <div className="font-bold">Le Surveillant Général</div>
                      <div className="h-10"></div>
                      <div className="text-[8px] text-slate-500 uppercase tracking-widest">(Visa & Date)</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{schoolSettings.director_title || 'Le Chef d’Établissement / Proviseur'}</div>
                      <div className="text-xs italic">{schoolSettings.director_name || 'M. ILBOUDO Marc'}</div>
                      <div className="h-10"></div>
                      <div className="text-[8px] text-slate-500 uppercase tracking-widest">(Signature et Sceau)</div>
                    </div>
                  </div>

                  {/* Talon d'accusé de réception détachable */}
                  <div className="mt-8 pt-4 border-t-2 border-dashed border-black text-[9px] text-black">
                    <div className="font-bold uppercase tracking-wider text-center mb-2">
                      TALON D&apos;ACCUSÉ DE RÉCEPTION À RETOURNER SIGNÉ À LA SURVEILLANCE GÉNÉRALE
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <div className="w-2/3 space-y-1">
                        <div>Je soussigné(e), M./Mme .....................................................................................</div>
                        <div>Parent de l&apos;élève <strong>{convocationForm.studentName}</strong> ({convocationForm.classroomName})</div>
                        <div>Confirme avoir reçu la convocation pour le {convocationForm.meetingDate} à {convocationForm.meetingTime}.</div>
                      </div>
                      <div className="w-1/3 text-right">
                        <div>Fait à ............................, le ...................</div>
                        <div className="h-8"></div>
                        <div className="font-bold text-[8.5px] uppercase">(Signature du Parent)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                ONGLET 5 : CONSEIL DE DISCIPLINE (PROCÈS-VERBAL OFFICIEL A4)
                ═══════════════════════════════════════════════════════════════ */}
            {activeTab === 'conseil' && (
              <div className="space-y-6">
                {/* Paramètres du Conseil de Discipline */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 print:hidden">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span>Paramétrer le Procès-Verbal de Conseil de Discipline</span>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-smooth flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer size={14} weight="bold" />
                      <span>Imprimer le Procès-Verbal Officiel (A4)</span>
                    </button>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Réf. Session PV</label>
                      <input
                        type="text"
                        value={conseilForm.sessionRef}
                        onChange={(e) => setConseilForm({ ...conseilForm, sessionRef: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Date de Tenue</label>
                      <input
                        type="text"
                        value={conseilForm.sessionDate}
                        onChange={(e) => setConseilForm({ ...conseilForm, sessionDate: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Heure de la Séance</label>
                      <input
                        type="text"
                        value={conseilForm.sessionTime}
                        onChange={(e) => setConseilForm({ ...conseilForm, sessionTime: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Faits et Griefs Reprochés *</label>
                      <textarea
                        rows={2}
                        value={conseilForm.charges}
                        onChange={(e) => setConseilForm({ ...conseilForm, charges: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Décision Finale du Conseil *</label>
                      <textarea
                        rows={2}
                        value={conseilForm.decision}
                        onChange={(e) => setConseilForm({ ...conseilForm, decision: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* PROCÈS-VERBAL OFFICIEL IMPRIMABLE A4 */}
                <div
                  id="printable-conseil-sheet"
                  className="max-w-[850px] mx-auto bg-white p-8 sm:p-12 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 text-black leading-relaxed"
                  style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                >
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
                      {schoolSettings.logo_url ? (
                        <div className="w-14 h-14 flex items-center justify-center mb-1">
                          <img src={schoolSettings.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                        </div>
                      ) : (
                        <BurkinaCoatOfArms className="w-12 h-12" />
                      )}
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
                      PROCÈS-VERBAL DE DÉLIBÉRATION DU CONSEIL DE DISCIPLINE
                    </h2>
                    <div className="font-mono text-xs font-bold mt-1">RÉFÉRENCE : {conseilForm.sessionRef} • ANNÉE SCOLAIRE {academicYear}</div>
                  </div>

                  {/* Préambule & composition */}
                  <div className="text-xs space-y-3 text-justify mb-6">
                    <p>
                      L&apos;an deux mille vingt-six, le <strong>{conseilForm.sessionDate}</strong> à <strong>{conseilForm.sessionTime}</strong>,
                      s&apos;est réuni dans la <strong>{conseilForm.location}</strong> du <strong>{schoolSettings.name}</strong>, le Conseil de Discipline
                      régulièrement convoqué et présidé par <strong>{conseilForm.presidentName}</strong>, Chef d&apos;Établissement.
                    </p>

                    <div className="p-3 bg-slate-50 border border-slate-300 rounded text-xs space-y-1">
                      <div className="font-bold uppercase text-[10px] text-slate-700 mb-1">Étaient présents les membres ci-après :</div>
                      <div>• <strong>Président de séance :</strong> {conseilForm.presidentName}</div>
                      <div>• <strong>Rapporteur :</strong> {conseilForm.rapporteurName}</div>
                      <div>• <strong>Professeur Principal :</strong> {conseilForm.principalTeacher}</div>
                      <div>• <strong>Représentant APE :</strong> {conseilForm.parentsRepName}</div>
                      <div>• <strong>Délégué des élèves :</strong> {conseilForm.studentDelegateName}</div>
                    </div>
                  </div>

                  {/* Identification élève */}
                  <div className="border border-black p-3 mb-6 text-xs bg-slate-50/40">
                    <div className="font-bold uppercase text-[10px] text-slate-700 mb-1">Élève traduit devant le Conseil :</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>Nom & Prénom(s) : <strong className="uppercase">{conseilForm.studentName}</strong></div>
                      <div>Classe / Matricule : <strong>{conseilForm.classroomName}</strong> ({conseilForm.matricule})</div>
                      <div>Parent / Tuteur convoqué : <strong>{conseilForm.guardianName}</strong></div>
                      <div>Statut de présence parent : <strong>Présent à la séance</strong></div>
                    </div>
                  </div>

                  {/* Faits et Délibération */}
                  <div className="text-xs space-y-3 text-justify mb-6">
                    <div>
                      <strong className="uppercase underline text-[11px] block mb-1">1. Faits et Griefs Retenus :</strong>
                      <p className="bg-slate-50 p-2.5 rounded border border-slate-200">{conseilForm.charges}</p>
                    </div>

                    <div>
                      <strong className="uppercase underline text-[11px] block mb-1">2. Audition et Déclarations de l&apos;Élève :</strong>
                      <p className="bg-slate-50 p-2.5 rounded border border-slate-200">{conseilForm.defenseNotes}</p>
                    </div>

                    <div>
                      <strong className="uppercase underline text-[11px] block mb-1">3. Délibération et Décision Finale du Conseil :</strong>
                      <div className="bg-rose-50 p-3 rounded border-2 border-rose-800 font-bold text-rose-950">
                        {conseilForm.decision}
                      </div>
                    </div>
                  </div>

                  {/* Signatures des membres du conseil */}
                  <div className="pt-4 border-t-2 border-black text-[9px] mt-6">
                    <div className="font-bold uppercase tracking-wider text-center mb-4">
                      ÉMARGEMENT CONJOINT DES MEMBRES DU CONSEIL DE DISCIPLINE
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="font-bold">Le Professeur Principal</div>
                        <div className="h-10"></div>
                        <div className="text-[7.5px] text-slate-500">(Signature)</div>
                      </div>
                      <div>
                        <div className="font-bold">Le Surveillant Général</div>
                        <div className="h-10"></div>
                        <div className="text-[7.5px] text-slate-500">(Signature & Visa)</div>
                      </div>
                      <div>
                        <div className="font-bold">Le Chef d&apos;Établissement</div>
                        <div className="h-10"></div>
                        <div className="text-[7.5px] text-slate-500">(Signature & Sceau Officiel)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* RÈGLES D'IMPRESSION A4 PORTRAIT */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-convocation-sheet,
          #printable-convocation-sheet *,
          #printable-conseil-sheet,
          #printable-conseil-sheet *,
          #printable-ticket-sheet,
          #printable-ticket-sheet * {
            visibility: visible !important;
          }
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-convocation-sheet,
          #printable-conseil-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
            page-break-after: avoid !important;
            border: none !important;
            box-shadow: none !important;
          }
          #printable-ticket-sheet {
            position: absolute !important;
            left: 20mm !important;
            top: 20mm !important;
            width: 140mm !important;
            box-sizing: border-box !important;
            border: 2px dashed #000 !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function DisciplinePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Chargement du module discipline...</div>}>
      <DisciplineContent />
    </Suspense>
  );
}
