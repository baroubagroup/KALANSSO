'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { supabase } from '@/lib/supabase';
import { getSchoolSettings, getDefaultMatriculePrefix, SchoolSettings, DEFAULT_SCHOOL } from '@/lib/schoolSettings';
import { saveStudentPhoto } from '@/lib/studentPhotos';
import { BurkinaCoatOfArms } from '@/components/motifs/BurkinaCoatOfArms';
import { AfricanMotif } from '@/components/motifs/AfricanMotif';
import {
  UserPlus,
  ArrowLeft,
  CheckCircle,
  CurrencyDollar,
  IdentificationCard,
  Phone,
  House,
  ShieldCheck,
  User,
  Printer,
  WarningCircle,
  Camera,
  Trash,
  Plus,
  PlusCircle,
  ArrowSquareOut,
  FolderPlus,
  X,
} from '@phosphor-icons/react';

interface ClassroomOption {
  id: string;
  name: string;
  tuition_fee: number;
  cycle: string;
}

interface GuardianContact {
  id: string;
  label: string;
  phone: string;
}

export default function NewStudentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paramètres d'établissement
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);

  // Classes de l'école (uniquement les classes RÉELLES créées dans Supabase)
  const [availableClasses, setAvailableClasses] = useState<ClassroomOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  // États du formulaire
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdStudentId, setCreatedStudentId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');

  // 1. Photo d'identité de l'élève
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // 2. Matricule dynamique & personnalisable (dérivé du nom de l'école ou personnalisé)
  const [matriculePrefix, setMatriculePrefix] = useState<string>('CSWM');
  const [matriculeSeq, setMatriculeSeq] = useState<string>('0001');
  const [matricule, setMatricule] = useState<string>('');

  // 3. État Civil (strictement AUCUNE fausse donnée préremplie)
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [sexe, setSexe] = useState<'M' | 'F'>('M');
  const [dateNaissance, setDateNaissance] = useState('');
  const [lieuNaissance, setLieuNaissance] = useState('');
  const [nationalite, setNationalite] = useState('Burkinabè');

  // 4. Modalités de Scolarité
  const [regime, setRegime] = useState<'Externat' | 'Demi-Pension' | 'Internat'>('Externat');
  const [redoublant, setRedoublant] = useState(false);

  // 5. Parents / Tuteurs Légaux (Contacts multiples dynamiques)
  const [nomPere, setNomPere] = useState('');
  const [professionPere, setProfessionPere] = useState('');
  const [nomMere, setNomMere] = useState('');
  const [professionMere, setProfessionMere] = useState('');
  const [adresse, setAdresse] = useState('');
  const [guardianContacts, setGuardianContacts] = useState<GuardianContact[]>([
    { id: 'gc-1', label: 'Père / Tuteur (WhatsApp principal)', phone: '' },
    { id: 'gc-2', label: 'Mère', phone: '' },
  ]);

  // 6. Frais financiers & Versement initial
  const [fraisInscription, setFraisInscription] = useState<number>(0);
  const [acompteScolarite, setAcompteScolarite] = useState<number>(0);
  const [modePaiement, setModePaiement] = useState<'MOOV_MONEY' | 'ORANGE_MONEY' | 'CASH'>('MOOV_MONEY');

  // 7. Modal de création rapide d'une classe directement depuis cette page
  const [isQuickClassModalOpen, setIsQuickClassModalOpen] = useState(false);
  const [quickClassName, setQuickClassName] = useState('6ème A');
  const [quickClassLevel, setQuickClassLevel] = useState('6EME');
  const [quickClassCycle, setQuickClassCycle] = useState('COLLEGE');
  const [quickClassTuition, setQuickClassTuition] = useState('85000');
  const [quickClassCapacity, setQuickClassCapacity] = useState('50');
  const [isCreatingClass, setIsCreatingClass] = useState(false);

  const QUICK_LEVEL_PRESETS: Record<string, { label: string; cycle: string; tuition: number }> = {
    'CP1': { label: 'CP1 (Cours Préparatoire 1)', cycle: 'PRIMAIRE', tuition: 55000 },
    'CP2': { label: 'CP2 (Cours Préparatoire 2)', cycle: 'PRIMAIRE', tuition: 55000 },
    'CE1': { label: 'CE1 (Cours Élémentaire 1)', cycle: 'PRIMAIRE', tuition: 60000 },
    'CE2': { label: 'CE2 (Cours Élémentaire 2)', cycle: 'PRIMAIRE', tuition: 60000 },
    'CM1': { label: 'CM1 (Cours Moyen 1)', cycle: 'PRIMAIRE', tuition: 65000 },
    'CM2': { label: 'CM2 (Candidats Examen CEP)', cycle: 'PRIMAIRE', tuition: 75000 },
    '6EME': { label: '6ème', cycle: 'COLLEGE', tuition: 85000 },
    '5EME': { label: '5ème', cycle: 'COLLEGE', tuition: 90000 },
    '4EME': { label: '4ème', cycle: 'COLLEGE', tuition: 95000 },
    '3EME': { label: '3ème (Candidats Examen BEPC)', cycle: 'COLLEGE', tuition: 110000 },
    '2NDE_A': { label: '2nde A', cycle: 'LYCEE', tuition: 130000 },
    '2NDE_C': { label: '2nde C', cycle: 'LYCEE', tuition: 135000 },
    '1ERE_A': { label: '1ère A', cycle: 'LYCEE', tuition: 140000 },
    '1ERE_D': { label: '1ère D', cycle: 'LYCEE', tuition: 145000 },
    'TLE_A': { label: 'Terminale A', cycle: 'LYCEE', tuition: 160000 },
    'TLE_D': { label: 'Terminale D (Candidats BAC D)', cycle: 'LYCEE', tuition: 170000 },
  };

  const handleQuickLevelChange = (lvl: string) => {
    setQuickClassLevel(lvl);
    if (QUICK_LEVEL_PRESETS[lvl]) {
      setQuickClassName(QUICK_LEVEL_PRESETS[lvl].label);
      setQuickClassCycle(QUICK_LEVEL_PRESETS[lvl].cycle);
      setQuickClassTuition(String(QUICK_LEVEL_PRESETS[lvl].tuition));
    }
  };

  const handleCreateQuickClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClassName.trim()) return;
    setIsCreatingClass(true);
    try {
      const schoolId = schoolSettings.id || '7c2d3108-2ac7-4ff5-a344-0803cedac026';
      const tuition = Number(quickClassTuition) || 0;
      const { data: newCls, error } = await supabase
        .from('classrooms')
        .insert({
          school_id: schoolId,
          name: quickClassName.trim(),
          level: quickClassLevel,
          cycle: quickClassCycle,
          capacity: Number(quickClassCapacity) || 50,
          tuition_fee: tuition,
        })
        .select()
        .single();

      if (error || !newCls) {
        alert("Erreur lors de la création de la classe : " + (error?.message || 'Échec'));
        setIsCreatingClass(false);
        return;
      }

      setAvailableClasses((prev) => [...prev, newCls]);
      setSelectedClassId(newCls.id);
      setAcompteScolarite(Math.round(tuition * 0.4));
      setIsQuickClassModalOpen(false);
      setErrorMessage(null);
    } catch (err: any) {
      alert("Erreur technique : " + (err?.message || err));
    } finally {
      setIsCreatingClass(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // A. CHARGEMENT INITIAL (Paramètres établissement + Classes réelles)
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadInitialData() {
      // 1. Paramètres école
      const s = await getSchoolSettings();
      setSchoolSettings(s);

      // Calculer le préfixe officiel
      const prefix = (s.matricule_prefix || getDefaultMatriculePrefix(s.name)).toUpperCase();
      setMatriculePrefix(prefix);

      // Calculer le prochain numéro de séquence à partir du nombre réel d'élèves
      const currentYear = new Date().getFullYear();
      let nextSeqStr = '0001';
      try {
        const { count, error: cErr } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true });
        if (!cErr && typeof count === 'number') {
          nextSeqStr = String(count + 1).padStart(4, '0');
        }
      } catch (err) {
        console.warn('Erreur comptage élèves:', err);
      }
      setMatriculeSeq(nextSeqStr);
      setMatricule(`${prefix}-${currentYear}-${nextSeqStr}`);

      // 2. Charger UNIQUEMENT les classes réelles de Supabase
      setIsLoadingClasses(true);
      try {
        const { data: realClassrooms, error: clErr } = await supabase
          .from('classrooms')
          .select('id, name, tuition_fee, cycle')
          .order('name');

        if (!clErr && realClassrooms && realClassrooms.length > 0) {
          setAvailableClasses(realClassrooms);
          setSelectedClassId(realClassrooms[0].id);
        } else {
          setAvailableClasses([]);
          setSelectedClassId('');
        }
      } catch (err) {
        console.error('Erreur chargement classes:', err);
        setAvailableClasses([]);
      } finally {
        setIsLoadingClasses(false);
      }
    }

    loadInitialData();
  }, []);

  // Recalculer le matricule lors du changement de préfixe
  const handlePrefixChange = (newPrefix: string) => {
    const cleaned = newPrefix.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setMatriculePrefix(cleaned);
    const currentYear = new Date().getFullYear();
    setMatricule(`${cleaned}-${currentYear}-${matriculeSeq}`);
  };

  // ─────────────────────────────────────────────────────────
  // B. GESTION DE LA PHOTO D'IDENTITÉ
  // ─────────────────────────────────────────────────────────
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('La photo ne doit pas dépasser 2 Mo.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ─────────────────────────────────────────────────────────
  // C. GESTION DYNAMIQUE DES CONTACTS PARENTS / TUTEURS
  // ─────────────────────────────────────────────────────────
  const handleAddGuardianContact = () => {
    const newContact: GuardianContact = {
      id: 'gc-' + Date.now(),
      label: 'Autre contact / Urgence',
      phone: '',
    };
    setGuardianContacts((prev) => [...prev, newContact]);
  };

  const handleUpdateGuardianContact = (id: string, field: 'label' | 'phone', value: string) => {
    setGuardianContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleRemoveGuardianContact = (id: string) => {
    if (guardianContacts.length <= 1) return;
    setGuardianContacts((prev) => prev.filter((c) => c.id !== id));
  };

  // Calculs financiers
  const selectedClass = availableClasses.find((c) => c.id === selectedClassId);
  const annualTuition = Number(selectedClass?.tuition_fee || 0);
  const totalPaid = Number(fraisInscription || 0) + Number(acompteScolarite || 0);
  const balanceRemaining = Math.max(0, annualTuition - Number(acompteScolarite || 0));

  // ─────────────────────────────────────────────────────────
  // D. SOUMISSION & ENREGISTREMENT STRICT DANS SUPABASE
  // ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    // Validations obligatoires
    if (!nom.trim() || !prenom.trim()) {
      setErrorMessage('Veuillez renseigner le nom et le prénom de l’élève.');
      setIsSubmitting(false);
      return;
    }

    if (availableClasses.length === 0) {
      setErrorMessage('Impossible d’inscrire un élève sans classe : votre établissement ne possède aucune classe ouverte. Cliquez sur « + Créer une classe ici » pour créer votre première classe.');
      setIsSubmitting(false);
      return;
    }

    const validClass = availableClasses.find((c) => c.id === selectedClassId);
    if (!validClass) {
      setErrorMessage('Veuillez sélectionner une classe valide parmi les classes existantes.');
      setIsSubmitting(false);
      return;
    }

    const primaryPhone = guardianContacts[0]?.phone?.trim() || '';
    if (!primaryPhone) {
      setErrorMessage('Veuillez renseigner au moins un numéro de téléphone pour le parent / tuteur.');
      setIsSubmitting(false);
      return;
    }

    try {
      const schoolId = schoolSettings.id || '7c2d3108-2ac7-4ff5-a344-0803cedac026';

      // 1. Enregistrement de l'élève (colonnes strictement conformes au schéma Supabase distant)
      const studentPayload: any = {
        school_id: schoolId,
        classroom_id: validClass.id,
        matricule: matricule.trim(),
        last_name: nom.trim().toUpperCase(),
        first_name: prenom.trim(),
        gender: sexe,
        birth_date: dateNaissance || null,
        birth_place: lieuNaissance.trim() || null,
        regime: regime,
        guardian_name: nomPere.trim() || nomMere.trim() || 'Parent / Tuteur',
        guardian_phone: primaryPhone,
        status: 'VALIDE',
      };

      const { data: studentRecord, error: sErr } = await supabase
        .from('students')
        .insert(studentPayload)
        .select()
        .single();

      if (sErr || !studentRecord) {
        console.error('Erreur Supabase insertion élève:', sErr);
        setErrorMessage('Erreur lors de l’inscription : ' + (sErr?.message || 'Échec d’enregistrement'));
        setIsSubmitting(false);
        return;
      }

      // Sauvegarder les détails étendus du tuteur (adresses, contacts multiples, professions)
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('kalansso_student_guardians_v1');
          const map = stored ? JSON.parse(stored) : {};
          map[studentRecord.id] = {
            nomPere: nomPere.trim(),
            professionPere: professionPere.trim(),
            nomMere: nomMere.trim(),
            professionMere: professionMere.trim(),
            adresse: adresse.trim(),
            contacts: guardianContacts,
          };
          localStorage.setItem('kalansso_student_guardians_v1', JSON.stringify(map));
        } catch {}
      }

      // 2. Sauvegarder la photo d'identité immédiatement si fournie
      if (photoPreview) {
        saveStudentPhoto(studentRecord.id, photoPreview);
      }

      // 3. Enregistrement du reçu de versement initial si versement effectué
      const generatedInvoice = 'FAC-2026-' + Math.floor(100000 + Math.random() * 900000);
      setInvoiceNumber(generatedInvoice);

      if (totalPaid > 0) {
        const { error: pErr } = await supabase.from('payments').insert({
          school_id: schoolId,
          student_id: studentRecord.id,
          receipt_number: generatedInvoice,
          amount: totalPaid,
          channel: modePaiement,
          payer_phone: primaryPhone,
          cashier_name: 'Guichet Inscriptions',
        });

        if (pErr) {
          console.error('Erreur Supabase enregistrement reçu:', pErr);
        }
      }

      // Succès total
      setCreatedStudentId(studentRecord.id);
      setIsSubmitting(false);
      setSuccess(true);
    } catch (err: any) {
      console.error('Exception inscription:', err);
      setErrorMessage('Une erreur technique est survenue : ' + (err?.message || err));
      setIsSubmitting(false);
    }
  };

  const amountInWords = (amount: number) => {
    if (amount <= 0) return 'Zéro';
    return `${amount.toLocaleString('fr-FR')}`;
  };

  // ─────────────────────────────────────────────────────────
  // E. ÉCRAN DE SUCCÈS : FACTURE OFFICIELLE & CARTE IMMÉDIATE
  // ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-900">
        <div className="print:hidden h-full">
          <ErpSidebar schoolName={schoolSettings.name} city={schoolSettings.city} />
        </div>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:p-0">
          <div className="bg-white border-b border-slate-200 px-6 py-3 print:hidden shadow-2xs">
            <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle size={20} weight="fill" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Élève Enregistré avec Succès !</div>
                  <div className="text-[11px] text-slate-500">
                    Facture N° <strong className="font-mono text-emerald-800">{invoiceNumber}</strong> enregistrée dans la base.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-nature-700 hover:bg-nature-800 text-white font-bold text-xs rounded-lg transition-smooth flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer size={16} weight="bold" />
                  <span>Imprimer la Facture Officielle A4</span>
                </button>
                <Link
                  href={`/students/${createdStudentId}`}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-smooth flex items-center gap-1.5"
                >
                  <User size={15} weight="bold" />
                  <span>Voir la Fiche Élève</span>
                </Link>
                <Link
                  href="/students"
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-smooth"
                >
                  <span>Liste des Élèves</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setNom('');
                    setPrenom('');
                    setDateNaissance('');
                    setLieuNaissance('');
                    setNomPere('');
                    setNomMere('');
                    setAdresse('');
                    setPhotoPreview(null);
                    setFraisInscription(0);
                    setAcompteScolarite(0);
                    const currentYear = new Date().getFullYear();
                    const nextNumber = String(Number(matriculeSeq) + 1).padStart(4, '0');
                    setMatriculeSeq(nextNumber);
                    setMatricule(`${matriculePrefix}-${currentYear}-${nextNumber}`);
                  }}
                  className="px-3.5 py-2 text-nature-700 hover:bg-nature-50 rounded-lg transition-smooth font-semibold text-xs border border-nature-200"
                >
                  + Nouvelle Inscription
                </button>
              </div>
            </div>
          </div>

          {/* VRAIE FEUILLE DE FACTURE FORMAT A4 AVEC PHOTO ÉLÈVE ET CONTACTS PARENTS */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center print:p-0 print:overflow-visible">
            <div
              id="official-invoice-sheet"
              className="w-full max-w-[800px] bg-white border border-slate-300 shadow-xl p-8 sm:p-12 text-xs leading-relaxed text-slate-900 relative print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full"
            >
              <AfricanMotif pattern={schoolSettings.watermark_pattern} opacity={0.03} className="absolute inset-0 pointer-events-none" />

              {/* En-tête officiel burkinabè */}
              <div className="flex justify-between items-start pb-4 border-b-2 border-black mb-6">
                <div className="w-1/3 text-left">
                  <div className="font-bold uppercase text-[10px] tracking-wider text-slate-900">BURKINA FASO</div>
                  <div className="text-[9px] italic text-slate-600">Unité - Progrès - Justice</div>
                  <div className="text-[9px] uppercase font-bold text-slate-800 mt-1">
                    Ministère de l&apos;Éducation Nationale (MENAPLN)
                  </div>
                  <div className="text-[8px] text-slate-500">Direction Régionale du Centre</div>
                </div>

                <div className="w-1/3 flex flex-col items-center">
                  {schoolSettings.logo_url ? (
                    <div className="w-16 h-16 flex items-center justify-center mb-1">
                      <img src={schoolSettings.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <BurkinaCoatOfArms className="w-14 h-14" />
                  )}
                  <span className="text-[8px] font-mono text-slate-500 mt-0.5">{schoolSettings.code_menapln}</span>
                </div>

                <div className="w-1/3 text-right">
                  <div className="font-bold text-sm uppercase text-slate-900">{schoolSettings.name}</div>
                  <div className="text-[9px] text-slate-600">{schoolSettings.address || `${schoolSettings.city}, Burkina Faso`}</div>
                  <div className="text-[9px] text-slate-600">Tél : {schoolSettings.phone}</div>
                  <div className="text-[8px] italic text-slate-500 mt-0.5">{schoolSettings.motto}</div>
                </div>
              </div>

              {/* Titre & Références Facture */}
              <div className="flex justify-between items-end my-6 pb-2 border-b border-black">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
                    FACTURE &amp; REÇU D&apos;INSCRIPTION SCOLAIRE
                  </h1>
                  <div className="text-xs font-semibold text-slate-600 mt-0.5">
                    Année Scolaire 2026 – 2027
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-slate-900">{invoiceNumber}</div>
                  <div className="text-[10px] text-slate-500">
                    Date : {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Cadre Bénéficiaire (Élève & Contacts Tuteurs) */}
              <div className="grid grid-cols-12 gap-4 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                {/* Photo d'identité */}
                <div className="col-span-2 flex flex-col items-center justify-center border-r border-slate-200 pr-3">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Élève"
                      className="w-20 h-24 object-cover rounded border border-slate-300 shadow-2xs"
                    />
                  ) : (
                    <div className="w-20 h-24 bg-slate-200 border border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-400 p-1 text-center">
                      <User size={28} />
                      <span className="text-[8px] mt-1">Sans photo</span>
                    </div>
                  )}
                  <span className="text-[8px] font-mono text-slate-500 mt-1 uppercase">ID Photo</span>
                </div>

                {/* Données Apprenant */}
                <div className="col-span-5 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Informations Apprenant(e)</div>
                  <div className="font-bold text-sm text-slate-900 uppercase">{nom} {prenom}</div>
                  <div>Matricule National : <strong className="font-mono text-slate-800">{matricule}</strong></div>
                  <div>Classe d&apos;affectation : <strong className="uppercase text-nature-800">{selectedClass?.name || 'Classe non assignée'}</strong></div>
                  <div>
                    Né(e) le : <strong>{dateNaissance ? new Date(dateNaissance).toLocaleDateString('fr-FR') : 'Non renseignée'} {lieuNaissance ? `à ${lieuNaissance}` : ''}</strong>
                  </div>
                  <div>Régime : <strong>{regime}</strong></div>
                </div>

                {/* Données Tuteurs & Contacts multiples */}
                <div className="col-span-5 space-y-1 border-l border-slate-200 pl-4">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Tuteur Légal &amp; Contacts</div>
                  <div className="font-bold text-sm text-slate-900">{nomPere || nomMere || 'Parent / Tuteur'}</div>
                  <div className="space-y-0.5 pt-1">
                    {guardianContacts.filter(c => c.phone.trim()).map((c) => (
                      <div key={c.id} className="text-[11px] flex items-center justify-between">
                        <span className="text-slate-500">{c.label} :</span>
                        <strong className="font-mono text-slate-800">{c.phone}</strong>
                      </div>
                    ))}
                  </div>
                  {adresse && <div className="text-[11px] text-slate-600 pt-1">Adresse : <strong>{adresse}</strong></div>}
                  <div className="pt-1 text-[11px]">Mode de règlement : <strong className="text-emerald-800">{modePaiement}</strong></div>
                </div>
              </div>

              {/* Tableau de Facturation */}
              <table className="w-full text-xs border border-black mb-4">
                <thead>
                  <tr className="bg-gray-100 border-b border-black text-slate-800 uppercase font-bold text-[10px]">
                    <th className="p-2.5 text-left border-r border-black">Désignation</th>
                    <th className="p-2.5 text-center border-r border-black w-24">Nature</th>
                    <th className="p-2.5 text-right border-r border-black w-32">Montant Dû</th>
                    <th className="p-2.5 text-right w-32">Montant Versé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  <tr>
                    <td className="p-2.5 border-r border-black font-semibold">
                      Frais d&apos;inscription et de dossier administratif
                    </td>
                    <td className="p-2.5 text-center border-r border-black text-slate-600">Annuel</td>
                    <td className="p-2.5 text-right border-r border-black font-mono">{fraisInscription.toLocaleString('fr-FR')} F</td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-800">{fraisInscription.toLocaleString('fr-FR')} F</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-black font-semibold">
                      Scolarité annuelle ({selectedClass?.name}) — Acompte 1ère Tranche
                    </td>
                    <td className="p-2.5 text-center border-r border-black text-slate-600">Tranche 1</td>
                    <td className="p-2.5 text-right border-r border-black font-mono">{annualTuition.toLocaleString('fr-FR')} F</td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-800">{acompteScolarite.toLocaleString('fr-FR')} F</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-black font-bold">
                    <td colSpan={3} className="p-2.5 text-right border-r border-black uppercase text-[10px]">
                      TOTAL ENCAISSÉ CE JOUR :
                    </td>
                    <td className="p-2.5 text-right font-mono text-sm font-black text-emerald-800">
                      {totalPaid.toLocaleString('fr-FR')} FCFA
                    </td>
                  </tr>
                  <tr className="bg-white border-t border-black">
                    <td colSpan={3} className="p-2 text-right border-r border-black text-slate-600">
                      Solde restant dû sur la scolarité annuelle :
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-amber-800">
                      {balanceRemaining.toLocaleString('fr-FR')} FCFA
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Montant en toutes lettres */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs mb-8">
                Arrêtée la présente facture à la somme de :{' '}
                <strong className="uppercase">{amountInWords(totalPaid)} Francs CFA</strong>.
              </div>

              {/* Signatures & Mentions légales */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-black text-center text-xs">
                <div>
                  <div className="font-bold text-slate-700">Le Parent / Tuteur</div>
                  <div className="h-16 flex items-end justify-center text-[9px] text-slate-400">
                    Lu et approuvé
                  </div>
                </div>

                <div>
                  <div className="font-bold text-slate-700">La Caisse Principale</div>
                  <div className="text-[10px] text-slate-500">Encaissé par Guichet</div>
                  <div className="h-14 flex items-center justify-center">
                    <div className="w-16 h-16 border border-dashed border-slate-300 rounded-full flex items-center justify-center text-[8px] text-slate-400">
                      Sceau Caisse
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold text-slate-700">Fait à {schoolSettings.city}, le {new Date().toLocaleDateString('fr-FR')}</div>
                  <div className="font-bold text-slate-900 mt-0.5">{schoolSettings.director_title || 'Le Chef d’Établissement'}</div>
                  <div className="text-xs text-nature-800 italic">{schoolSettings.director_name || 'M. ILBOUDO Marc'}</div>
                  <div className="h-14 flex items-center justify-end">
                    <div className="w-16 h-16 border border-dashed border-slate-300 rounded-full flex items-center justify-center text-[8px] text-slate-400">
                      Cachet Direction
                    </div>
                  </div>
                </div>
              </div>

              {/* Pied de page cryptographique */}
              <div className="mt-8 pt-3 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                <span>Certificat d&apos;inscription scellé par Kalansso OS</span>
                <span>ID ÉLÈVE : {createdStudentId || 'std-auto'}</span>
                <span>Vérification : https://verify.kalansso.school</span>
              </div>
            </div>
          </main>
        </div>

        {/* Impression stricte A4 portrait */}
        <style jsx global>{`
          @page {
            size: A4 portrait;
            margin: 0;
          }
          @media print {
            body * {
              visibility: hidden !important;
            }
            #official-invoice-sheet, #official-invoice-sheet * {
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
            #official-invoice-sheet {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              padding: 10mm 14mm !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              box-shadow: none !important;
              border: none !important;
            }
          }
        `}</style>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // F. FORMULAIRE PRINCIPAL DE SAISIE DE NOUVELLE INSCRIPTION
  // ─────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <div className="print:hidden h-full">
        <ErpSidebar schoolName={schoolSettings.name} city={schoolSettings.city} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ErpHeader
          schoolName={schoolSettings.name}
          title="Nouvelle Inscription Élève"
          breadcrumbs={[
            { label: 'Tableau de Bord', href: '/dashboard' },
            { label: 'Élèves Inscrits', href: '/students' },
            { label: 'Nouvelle Inscription' },
          ]}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
            {/* Header avec Retour et Matricule Dynamique */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div>
                <Link
                  href="/students"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-smooth mb-1"
                >
                  <ArrowLeft size={14} weight="bold" />
                  <span>Retour à la liste des élèves</span>
                </Link>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus size={22} weight="bold" className="text-nature-700" />
                  <span>Dossier d’Inscription &amp; Frais de Scolarité</span>
                </h1>
                <p className="text-xs text-slate-500">
                  Enregistrement certifié dans Supabase avec édition immédiate de la facture officielle.
                </p>
              </div>

              {/* Bloc Matricule Dynamique */}
              <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-2xs">
                <div className="text-right">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Matricule Attribué</span>
                  <span className="font-mono text-sm font-black text-nature-800">{matricule}</span>
                </div>
              </div>
            </div>

            {/* Alerte si aucune classe configurée */}
            {!isLoadingClasses && availableClasses.length === 0 && (
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-950 text-xs shadow-xs space-y-2">
                <div className="flex items-start gap-2.5">
                  <WarningCircle size={22} weight="fill" className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm text-amber-950">
                      Aucune classe n&apos;a encore été configurée dans l&apos;établissement
                    </div>
                    <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                      Pour inscrire un élève, vous devez d&apos;abord créer au moins une classe (avec ses frais de scolarité associés) dans le module <strong>Classes &amp; Paliers</strong>.
                    </p>
                  </div>
                </div>
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickClassModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-nature-700 hover:bg-nature-800 text-white font-bold rounded-lg text-xs transition-smooth shadow-xs cursor-pointer"
                  >
                    <Plus size={16} weight="bold" />
                    <span>Créer une classe en 1 clic</span>
                  </button>
                  <Link
                    href="/classes"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold rounded-lg text-xs transition-smooth shadow-xs cursor-pointer"
                  >
                    <FolderPlus size={16} weight="bold" />
                    <span>Ouvrir le module Classes</span>
                  </Link>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
                <WarningCircle size={20} weight="fill" className="text-red-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Section 0 : Paramétrage du Matricule d'Établissement */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <IdentificationCard size={16} weight="bold" className="text-nature-700" />
                  <span>Structure du Matricule Élève</span>
                </h2>
                <span className="text-[11px] text-slate-400">
                  Dérivé automatiquement du nom de l&apos;école : <strong className="text-slate-700">{schoolSettings.name}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Préfixe d&apos;Établissement (3 à 5 lettres)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={matriculePrefix}
                    onChange={(e) => handlePrefixChange(e.target.value)}
                    placeholder="Ex : CSWM, ABC, LMP"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 uppercase focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Personnalisable selon le code d&apos;abréviation de l&apos;école
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Numéro de Séquence
                  </label>
                  <input
                    type="text"
                    value={matriculeSeq}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setMatriculeSeq(val);
                      const currentYear = new Date().getFullYear();
                      setMatricule(`${matriculePrefix}-${currentYear}-${val}`);
                    }}
                    placeholder="0001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Calculé d&apos;après le registre existant
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Matricule Complet Attribué
                  </label>
                  <input
                    type="text"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-black text-nature-800 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Format : [CODE]-[ANNEE]-[SEQUENCE]
                  </span>
                </div>
              </div>
            </div>

            {/* Section 1 : État Civil & Photo d'Identité */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                <User size={16} weight="bold" className="text-nature-700" />
                <span>1. État Civil &amp; Photo d&apos;Identité de l&apos;Élève</span>
              </h2>

              {/* Bloc Photo d'Identité */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-28 bg-white border-2 border-slate-300 border-dashed rounded-lg flex items-center justify-center overflow-hidden relative shadow-2xs flex-shrink-0">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Aperçu photo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      <Camera size={28} className="mx-auto mb-1 opacity-60" />
                      <span className="text-[9px] font-semibold block leading-tight">Photo d&apos;identité</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Photo d&apos;Identité pour la Carte Scolaire (Optionnelle mais recommandée)
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      S&apos;affiche sur le badge officiel d&apos;accès, le QR code de scolarité, la feuille d&apos;appel et le trombinoscope.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-smooth cursor-pointer"
                    >
                      <Camera size={14} weight="bold" />
                      <span>{photoPreview ? 'Changer la photo' : 'Importer une photo'}</span>
                    </button>

                    {photoPreview && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-lg border border-red-200 transition-smooth cursor-pointer"
                      >
                        <Trash size={14} />
                        <span>Supprimer</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Champs d'état civil sans faux pré-remplissage */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nom de famille *</label>
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Ex : OUEDRAOGO"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 uppercase focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prénom(s) *</label>
                  <input
                    type="text"
                    required
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    placeholder="Ex : Fatimata"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sexe *</label>
                  <select
                    value={sexe}
                    onChange={(e) => setSexe(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  >
                    <option value="M">Masculin (Garçon)</option>
                    <option value="F">Féminin (Fille)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date de naissance</label>
                  <input
                    type="date"
                    value={dateNaissance}
                    onChange={(e) => setDateNaissance(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lieu de naissance</label>
                  <input
                    type="text"
                    value={lieuNaissance}
                    onChange={(e) => setLieuNaissance(e.target.value)}
                    placeholder="Ex : Ouagadougou, Bobo-Dioulasso, Koudougou..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nationalité</label>
                  <input
                    type="text"
                    value={nationalite}
                    onChange={(e) => setNationalite(e.target.value)}
                    placeholder="Ex : Burkinabè"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>
              </div>
            </div>

            {/* Section 2 : Affectation Scolaire (Classes RÉELLES uniquement) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-100 gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <House size={16} weight="bold" className="text-nature-700" />
                  <span>2. Classe d&apos;Affectation &amp; Modalités de Scolarité</span>
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickClassModalOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-nature-700 hover:text-nature-900 bg-nature-50 hover:bg-nature-100 border border-nature-200 px-2.5 py-1 rounded-lg transition-smooth cursor-pointer"
                  >
                    <Plus size={13} weight="bold" />
                    <span>+ Créer une classe ici</span>
                  </button>
                  <Link
                    href="/classes"
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                  >
                    <span>Gérer les classes</span>
                    <ArrowSquareOut size={12} />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Classe d&apos;affectation *</label>
                  {isLoadingClasses ? (
                    <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500">
                      Chargement des classes de l&apos;école...
                    </div>
                  ) : availableClasses.length > 0 ? (
                    <select
                      value={selectedClassId}
                      onChange={(e) => {
                        const cId = e.target.value;
                        setSelectedClassId(cId);
                        const found = availableClasses.find((cl) => cl.id === cId);
                        if (found) {
                          setAcompteScolarite(Math.round(Number(found.tuition_fee || 0) * 0.4));
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                    >
                      {availableClasses.map((cl) => (
                        <option key={cl.id} value={cl.id}>
                          {cl.name} — {Number(cl.tuition_fee || 0).toLocaleString('fr-FR')} FCFA / an
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-2">
                      <span className="text-amber-900 font-semibold block text-[11px]">
                        Aucune classe configurée dans l&apos;établissement.
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsQuickClassModalOpen(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-nature-700 hover:bg-nature-800 text-white font-bold rounded-md text-[11px] transition-smooth cursor-pointer shadow-xs"
                      >
                        <Plus size={13} weight="bold" />
                        <span>Créer ma 1ère classe en 1 clic</span>
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Régime de présence</label>
                  <select
                    value={regime}
                    onChange={(e) => setRegime(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  >
                    <option value="Externat">Externat Simple</option>
                    <option value="Demi-Pension">Demi-Pension (Cantine)</option>
                    <option value="Internat">Internat Complet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Statut dans ce niveau</label>
                  <select
                    value={redoublant ? 'true' : 'false'}
                    onChange={(e) => setRedoublant(e.target.value === 'true')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  >
                    <option value="false">Nouveau dans le niveau (Passant)</option>
                    <option value="true">Redoublant</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3 : Tuteurs Légaux & Numéros Multiples */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Phone size={16} weight="bold" className="text-nature-700" />
                  <span>3. Contacts des Parents / Tuteurs Légaux</span>
                </h2>
                <button
                  type="button"
                  onClick={handleAddGuardianContact}
                  className="inline-flex items-center gap-1 text-xs font-bold text-nature-700 hover:text-nature-800 transition-smooth cursor-pointer"
                >
                  <PlusCircle size={16} weight="bold" />
                  <span>+ Ajouter un autre contact / numéro</span>
                </button>
              </div>

              {/* Noms & Professions des parents */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nom complet du Père ou Tuteur</label>
                  <input
                    type="text"
                    value={nomPere}
                    onChange={(e) => setNomPere(e.target.value)}
                    placeholder="Ex : OUEDRAOGO Salif"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Profession du Père / Tuteur</label>
                  <input
                    type="text"
                    value={professionPere}
                    onChange={(e) => setProfessionPere(e.target.value)}
                    placeholder="Ex : Commerçant, Fonctionnaire, Enseignant..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nom complet de la Mère</label>
                  <input
                    type="text"
                    value={nomMere}
                    onChange={(e) => setNomMere(e.target.value)}
                    placeholder="Ex : SAWADOGO Mariam"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Profession de la Mère</label>
                  <input
                    type="text"
                    value={professionMere}
                    onChange={(e) => setProfessionMere(e.target.value)}
                    placeholder="Ex : Couturière, Ménagère, Secrétaire..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse de résidence</label>
                  <input
                    type="text"
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                    placeholder="Ex : Secteur 24, Rue 24.12, Porte 104, Ouagadougou"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>
              </div>

              {/* Lignes de Téléphone Multiples Dynamiques */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Numéros de Contact &amp; Alertes SMS / WhatsApp
                </label>

                {guardianContacts.map((contact, idx) => (
                  <div key={contact.id} className="flex flex-col sm:flex-row items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="w-full sm:w-1/3">
                      <input
                        type="text"
                        value={contact.label}
                        onChange={(e) => handleUpdateGuardianContact(contact.id, 'label', e.target.value)}
                        placeholder="Ex : Père WhatsApp, Mère..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:border-nature-500 outline-none"
                      />
                    </div>

                    <div className="w-full sm:flex-1">
                      <input
                        type="tel"
                        required={idx === 0}
                        value={contact.phone}
                        onChange={(e) => handleUpdateGuardianContact(contact.id, 'phone', e.target.value)}
                        placeholder="Ex : +226 70 12 34 56 ou 76 00 00 00"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-slate-900 focus:border-nature-500 outline-none"
                      />
                    </div>

                    {guardianContacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGuardianContact(contact.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-smooth cursor-pointer"
                        title="Supprimer ce numéro"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4 : Frais & Encaissement Initial */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CurrencyDollar size={16} weight="bold" className="text-nature-700" />
                  <span>4. Frais d’Inscription &amp; Versement Initial</span>
                </div>
                <span className="text-xs font-normal text-slate-500">
                  Scolarité annuelle : <strong>{annualTuition.toLocaleString('fr-FR')} FCFA</strong>
                </span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Frais d’inscription administrative (FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={fraisInscription || ''}
                    onChange={(e) => setFraisInscription(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Acompte Scolarité / 1ère Tranche (FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={acompteScolarite || ''}
                    onChange={(e) => setAcompteScolarite(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Canal d&apos;encaissement</label>
                  <select
                    value={modePaiement}
                    onChange={(e) => setModePaiement(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:border-nature-500 outline-none transition-smooth"
                  >
                    <option value="MOOV_MONEY">Moov Money (+226)</option>
                    <option value="ORANGE_MONEY">Orange Money (+226)</option>
                    <option value="CASH">Espèces / Guichet Caisse</option>
                  </select>
                </div>
              </div>

              {/* Récapitulatif financier */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                    Total Encaissé ce jour
                  </span>
                  <div className="text-xl font-black text-emerald-900">
                    {totalPaid.toLocaleString('fr-FR')} FCFA
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    Solde restant à régler sur la scolarité : <strong>{balanceRemaining.toLocaleString('fr-FR')} FCFA</strong>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500">
                  <div>Une facture officielle sera émise automatiquement.</div>
                  <div>Enregistrement garanti dans la base Supabase.</div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/students"
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-smooth"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || availableClasses.length === 0}
                className="px-6 py-2.5 bg-nature-700 hover:bg-nature-800 text-white font-bold text-xs rounded-xl transition-smooth shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Enregistrement dans Supabase...</span>
                ) : availableClasses.length === 0 ? (
                  <span>Veuillez d&apos;abord créer une classe</span>
                ) : (
                  <>
                    <ShieldCheck size={18} weight="bold" />
                    <span>Valider l&apos;Inscription &amp; Émettre la Facture</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>

      {/* MODAL RAPIDE DE CRÉATION DE CLASSE EN 1 CLIC */}
      {isQuickClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <House size={20} weight="bold" className="text-nature-700" />
                <h3 className="font-bold text-sm text-slate-900">Créer une Classe en 1 Clic</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickClassModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-smooth cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateQuickClass} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Niveau scolaire standard</label>
                <select
                  value={quickClassLevel}
                  onChange={(e) => handleQuickLevelChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:border-nature-500 outline-none"
                >
                  {Object.entries(QUICK_LEVEL_PRESETS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label} ({v.cycle})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom affiché de la classe *</label>
                <input
                  type="text"
                  required
                  value={quickClassName}
                  onChange={(e) => setQuickClassName(e.target.value)}
                  placeholder="Ex : 6ème A, CP1 B..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:border-nature-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scolarité annuelle (FCFA)</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={quickClassTuition}
                    onChange={(e) => setQuickClassTuition(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:border-nature-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacité max élèves</label>
                  <input
                    type="number"
                    min="1"
                    value={quickClassCapacity}
                    onChange={(e) => setQuickClassCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:border-nature-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickClassModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-smooth cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCreatingClass || !quickClassName.trim()}
                  className="px-4 py-2 bg-nature-700 hover:bg-nature-800 text-white font-bold rounded-lg transition-smooth cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isCreatingClass ? 'Création...' : 'Créer & Affecter l’Élève'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}