'use client';

import React, { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { BurkinaCoatOfArms } from '@/components/motifs/BurkinaCoatOfArms';
import { AfricanMotif } from '@/components/motifs/AfricanMotif';
import { supabase } from '@/lib/supabase';
import { getSchoolSettings, SchoolSettings, DEFAULT_SCHOOL } from '@/lib/schoolSettings';
import { getActiveAcademicYear } from '@/lib/academicYear';
import {
  getStudentPhoto,
  saveStudentPhoto,
  removeStudentPhoto,
  getAllStudentPhotos,
} from '@/lib/studentPhotos';
import {
  FileText,
  Printer,
  IdentificationBadge,
  Certificate,
  User,
  ShieldCheck,
  CheckCircle,
  QrCode,
  Phone,
  Buildings,
  UploadSimple,
  Camera,
  Trash,
  Scissors,
  ArrowsLeftRight,
  CaretDown,
  Check,
  Image,
  Sparkle,
} from '@phosphor-icons/react';

interface StudentDocInfo {
  id: string;
  matricule: string;
  last_name: string;
  first_name: string;
  gender: string;
  birth_date?: string;
  birth_place?: string;
  regime: string;
  guardian_name?: string;
  guardian_phone?: string;
  classroom_id?: string;
  classroom_name: string;
  cycle: string;
}

function DocumentsContent() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('studentId') || '';
  const preselectedType = searchParams.get('type') || '';

  // Type de document principal
  const [docType, setDocType] = useState<'CERTIFICAT_SCOLARITE' | 'ATTESTATION_FREQUENTATION' | 'CARTE_SCOLAIRE'>(
    preselectedType === 'card'
      ? 'CARTE_SCOLAIRE'
      : preselectedType === 'attestation'
      ? 'ATTESTATION_FREQUENTATION'
      : 'CERTIFICAT_SCOLARITE'
  );

  // Configuration spécifique Carte Scolaire
  // 1. Choix des faces : RECTO seul (économique) ou RECTO_VERSO
  const [cardFaceMode, setCardFaceMode] = useState<'RECTO_ONLY' | 'RECTO_VERSO'>('RECTO_VERSO');

  // 2. Mode d'imposition / mise en page :
  // - INDIVIDUAL : 1 élève (pour carte plastique PVC ou réimpression)
  // - SHEET_A4_RECTO : Planche A4 de 8 élèves (Recto seul) avec repères de coupe
  // - SHEET_A4_FOLD : Planche A4 de 4 élèves avec Recto & Verso juxtaposés côte à côte (pliage / plastification)
  // - SHEET_A4_DUPLEX : Planche A4 recto-verso (Page 1 = Rectos, Page 2 = Versos en miroir)
  const [sheetLayout, setSheetLayout] = useState<'INDIVIDUAL' | 'SHEET_A4_RECTO' | 'SHEET_A4_FOLD' | 'SHEET_A4_DUPLEX'>('SHEET_A4_FOLD');

  // Filtre de classe pour les cartes
  const [classFilter, setClassFilter] = useState<string>('ALL');

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [students, setStudents] = useState<StudentDocInfo[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [academicYear, setAcademicYear] = useState(getActiveAcademicYear());

  // Photos des élèves en cache
  const [photosMap, setPhotosMap] = useState<Record<string, string>>({});
  const [activePhotoUploadStudentId, setActivePhotoUploadStudentId] = useState<string | null>(null);

  const fileInputLogoRef = useRef<HTMLInputElement>(null);
  const fileInputPhotoRef = useRef<HTMLInputElement>(null);

  // 1. Charger photos élèves
  useEffect(() => {
    function loadPhotos() {
      setPhotosMap(getAllStudentPhotos());
    }
    loadPhotos();
    window.addEventListener('kalansso_student_photo_updated', loadPhotos);
    return () => window.removeEventListener('kalansso_student_photo_updated', loadPhotos);
  }, []);

  // 2. Paramètres d'établissement & Année académique
  useEffect(() => {
    async function loadSettings() {
      const s = await getSchoolSettings();
      setSchoolSettings(s);
    }
    loadSettings();
    window.addEventListener('kalansso_school_updated', loadSettings);

    function handleYear(e: any) {
      if (e.detail?.year) {
        setAcademicYear(e.detail.year);
      }
    }
    window.addEventListener('kalansso_academic_year_changed', handleYear);

    return () => {
      window.removeEventListener('kalansso_school_updated', loadSettings);
      window.removeEventListener('kalansso_academic_year_changed', handleYear);
    };
  }, []);

  // 3. Charger les élèves réels depuis Supabase
  useEffect(() => {
    async function loadStudents() {
      try {
        const { data, error } = await supabase
          .from('students')
          .select(`
            id,
            matricule,
            last_name,
            first_name,
            gender,
            birth_date,
            birth_place,
            regime,
            guardian_name,
            guardian_phone,
            classroom_id,
            classrooms (
              id,
              name,
              cycle
            )
          `)
          .order('last_name', { ascending: true });

        if (!error && data && data.length > 0) {
          const list: StudentDocInfo[] = data.map((s: any) => ({
            id: s.id,
            matricule: s.matricule || 'KLS-000',
            last_name: s.last_name,
            first_name: s.first_name,
            gender: s.gender || 'M',
            birth_date: s.birth_date,
            birth_place: s.birth_place || 'Ouagadougou',
            regime: s.regime || 'Demi-pensionnaire',
            guardian_name: s.guardian_name,
            guardian_phone: s.guardian_phone,
            classroom_id: s.classroom_id || s.classrooms?.id,
            classroom_name: s.classrooms?.name || 'Classe non assignée',
            cycle: s.classrooms?.cycle || 'SECONDAIRE',
          }));

          setStudents(list);

          if (preselectedId && list.some((st) => st.id === preselectedId)) {
            setSelectedStudentId(preselectedId);
          } else if (list.length > 0) {
            setSelectedStudentId(list[0].id);
          }
        }
      } catch (e) {
        console.error('Erreur chargement élèves:', e);
      }
    }
    loadStudents();
  }, [preselectedId, academicYear]);

  // Upload Logo établissement
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Le logo ne doit pas dépasser 2 Mo.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSchoolSettings((prev) => ({ ...prev, logo_url: base64 }));
        try {
          localStorage.setItem('kalansso_school_logo', base64);
          window.dispatchEvent(new Event('kalansso_school_updated'));
        } catch {}
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload Photo Élève
  const handleStudentPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activePhotoUploadStudentId) {
      if (file.size > 3 * 1024 * 1024) {
        alert('La photo ne doit pas dépasser 3 Mo.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        saveStudentPhoto(activePhotoUploadStudentId, base64);
        setActivePhotoUploadStudentId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // Élèves filtrés pour les planches A4 de cartes
  const filteredStudentsForCards = useMemo(() => {
    if (classFilter === 'ALL') return students;
    return students.filter((s) => s.classroom_name === classFilter || s.classroom_id === classFilter);
  }, [students, classFilter]);

  // Liste unique des classes présentes pour le sélecteur
  const availableClasses = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s) => {
      if (s.classroom_name) map.set(s.classroom_name, s.classroom_name);
    });
    return Array.from(map.values());
  }, [students]);

  const birthText = activeStudent?.birth_date
    ? `${new Date(activeStudent.birth_date).toLocaleDateString('fr-FR')} à ${activeStudent.birth_place || 'Ouagadougou'}`
    : `15/04/2009 à Ouagadougou`;

  // ─────────────────────────────────────────────────────────────
  // SOUS-COMPOSANT : RECTO CARTE SCOLAIRE (85.6mm x 54mm)
  // ─────────────────────────────────────────────────────────────
  const renderCardRecto = (st: StudentDocInfo, isPrintable = true) => {
    const studentPhoto = photosMap[st.id] || null;

    return (
      <div
        key={`recto-${st.id}`}
        className="card-id-box relative bg-white border border-nature-900 rounded-[3.2mm] overflow-hidden flex flex-col justify-between shadow-xs select-none"
        style={{
          width: '85.6mm',
          height: '54mm',
          minWidth: '85.6mm',
          minHeight: '54mm',
          maxWidth: '85.6mm',
          maxHeight: '54mm',
          boxSizing: 'border-box',
          padding: '2.2mm 3mm',
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Filigrane discret Faso Dan Fani */}
        <AfricanMotif pattern={schoolSettings.watermark_pattern} opacity={0.035} className="absolute inset-0 pointer-events-none" />

        {/* 1. HAUT : BANDEAU OFFICIEL */}
        <div className="flex items-center justify-between pb-1 border-b border-nature-800/40 relative z-10">
          <div className="flex items-center gap-1.5 min-w-0">
            {schoolSettings.logo_url ? (
              <div className="w-[6.5mm] h-[6.5mm] rounded bg-white p-0.5 flex items-center justify-center border border-slate-300 flex-shrink-0">
                <img src={schoolSettings.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="w-[6.5mm] h-[6.5mm] rounded bg-nature-800 text-white font-black text-[9px] flex items-center justify-center flex-shrink-0">
                K
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[6.5pt] font-black uppercase tracking-tight text-nature-950 truncate leading-none">
                {schoolSettings.name}
              </div>
              <div className="text-[4.8pt] font-bold text-slate-500 uppercase tracking-wider mt-0.5 leading-none">
                BURKINA FASO · CARTE D&apos;IDENTITÉ SCOLAIRE
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <BurkinaCoatOfArms size={16} />
            <span className="text-[5.5pt] font-mono font-bold bg-nature-100/80 text-nature-900 border border-nature-300 px-1 py-0.2 rounded">
              {academicYear}
            </span>
          </div>
        </div>

        {/* 2. CENTRE : PHOTO & DONNÉES D'IDENTITÉ */}
        <div className="flex items-center gap-2 py-0.5 relative z-10 my-auto">
          {/* Cadre Photo 3x4 (Format 22mm x 28mm) */}
          <div
            onClick={() => {
              setActivePhotoUploadStudentId(st.id);
              fileInputPhotoRef.current?.click();
            }}
            title="Cliquer pour changer ou ajouter la photo"
            className="group relative rounded-[2mm] border border-slate-300 bg-slate-100 flex flex-col items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer shadow-2xs"
            style={{ width: '22mm', height: '28mm' }}
          >
            {studentPhoto ? (
              <img src={studentPhoto} alt={st.last_name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 p-1">
                <User size={24} weight="bold" />
                <span className="text-[5pt] font-bold uppercase text-slate-400 mt-0.5">Photo 3x4</span>
              </div>
            )}
            {/* Bouton de survol dans l'écran */}
            <div className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth print:hidden">
              <Camera size={16} weight="bold" />
              <span className="text-[5pt] font-bold mt-0.5">Modifier</span>
            </div>
          </div>

          {/* Informations élève */}
          <div className="flex-1 min-w-0 space-y-0.5 leading-tight">
            <div>
              <div className="text-[8.5pt] font-black uppercase text-slate-950 truncate leading-none">
                {st.last_name}
              </div>
              <div className="text-[7.5pt] font-bold text-nature-800 uppercase truncate leading-snug">
                {st.first_name}
              </div>
            </div>

            <div className="pt-0.5 flex items-center gap-1">
              <span className="text-[5pt] font-semibold text-slate-500 uppercase">Matricule :</span>
              <span className="text-[6.5pt] font-mono font-black text-slate-900 bg-slate-100 px-1 py-0.2 rounded">
                {st.matricule}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[5pt] font-semibold text-slate-500 uppercase">Classe :</span>
              <span className="text-[6.5pt] font-black text-white bg-nature-800 px-1.5 py-0.2 rounded uppercase tracking-wide truncate max-w-[40mm]">
                {st.classroom_name}
              </span>
            </div>

            <div className="text-[5.2pt] text-slate-600 truncate pt-0.5">
              <span>Né(e) le : </span>
              <strong className="text-slate-800">
                {st.birth_date ? new Date(st.birth_date).toLocaleDateString('fr-FR') : '15/04/2009'}
              </strong>
              <span> à {st.birth_place || 'Ouagadougou'}</span>
            </div>

            <div className="text-[5.2pt] text-slate-600 flex items-center gap-1.5">
              <span>Sexe : <strong>{st.gender === 'F' ? 'F' : 'M'}</strong></span>
              <span>•</span>
              <span>Régime : <strong>{st.regime || 'Externe'}</strong></span>
            </div>
          </div>
        </div>

        {/* 3. BAS : SIGNATURE & AUTHENTICITÉ */}
        <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[4.8pt] text-slate-600 relative z-10 leading-none">
          <div className="w-[24mm] text-center">
            <span className="italic block">Signature Titulaire</span>
            <div className="h-[3.5mm]"></div>
          </div>

          <div className="text-center font-mono font-bold text-nature-900 flex items-center gap-0.5">
            <ShieldCheck size={9} weight="fill" className="text-nature-700" />
            <span>SCELLÉ CIL-MENAPLN</span>
          </div>

          <div className="w-[28mm] text-right">
            <span className="font-semibold block truncate">Le Chef d&apos;Établissement</span>
            <span className="text-[4.2pt] text-nature-800 font-bold block truncate">
              {schoolSettings.director_name || 'M. ILBOUDO Marc'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // SOUS-COMPOSANT : VERSO CARTE SCOLAIRE (85.6mm x 54mm)
  // ─────────────────────────────────────────────────────────────
  const renderCardVerso = (st: StudentDocInfo, isPrintable = true) => {
    return (
      <div
        key={`verso-${st.id}`}
        className="card-id-box relative bg-slate-900 text-slate-100 border border-slate-800 rounded-[3.2mm] overflow-hidden flex flex-col justify-between shadow-xs select-none"
        style={{
          width: '85.6mm',
          height: '54mm',
          minWidth: '85.6mm',
          minHeight: '54mm',
          maxWidth: '85.6mm',
          maxHeight: '54mm',
          boxSizing: 'border-box',
          padding: '2.5mm 3.2mm',
          backgroundColor: '#0F172A',
        }}
      >
        {/* En-tête verso */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <span className="text-[5.5pt] font-black uppercase text-nature-400 tracking-wider">
            CONDITIONS & CONTACTS D&apos;URGENCE
          </span>
          <span className="text-[5pt] text-slate-400 font-mono">{schoolSettings.city || 'Ouagadougou'}</span>
        </div>

        {/* Coordonnées & Urgence */}
        <div className="space-y-1 text-[5.5pt] leading-tight text-slate-300 my-auto">
          <div className="flex items-baseline justify-between bg-slate-800/80 px-1.5 py-0.5 rounded">
            <span className="text-slate-400">Tuteur Légal :</span>
            <strong className="text-white uppercase truncate max-w-[50mm] font-bold">
              {st.guardian_name || 'Parent / Tuteur'}
            </strong>
          </div>

          <div className="flex items-baseline justify-between px-1">
            <span className="text-slate-400">Tél. Tuteur (Urgence) :</span>
            <strong className="text-emerald-400 font-mono font-bold text-[6pt]">
              {st.guardian_phone || schoolSettings.phone}
            </strong>
          </div>

          <div className="flex items-baseline justify-between px-1">
            <span className="text-slate-400">Secrétariat Établissement :</span>
            <strong className="text-slate-200 font-mono">{schoolSettings.phone}</strong>
          </div>

          <p className="text-[4.6pt] text-slate-400 leading-snug pt-0.5 italic text-justify">
            La présente carte est strictement personnelle et obligatoire. Elle doit être présentée à toute réquisition des autorités scolaires. En cas de perte, prière de la rapporter d&apos;urgence à l&apos;administration du <strong>{schoolSettings.name}</strong>.
          </p>
        </div>

        {/* Pied verso avec QR de scellement */}
        <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[4.8pt] text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-[6mm] h-[6mm] bg-white rounded p-0.5 flex items-center justify-center text-slate-900">
              <QrCode size={16} weight="bold" />
            </div>
            <div>
              <div className="font-mono text-[5pt] text-emerald-400 font-bold">{st.matricule}</div>
              <div className="text-[4.2pt] text-slate-500">Contrôle QR Sécurisé</div>
            </div>
          </div>

          <div className="text-right">
            <div className="font-bold text-slate-200 text-[5pt]">Année {academicYear}</div>
            <div className="text-[4.2pt] text-slate-500">Agrément MENAPLN</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <ErpSidebar schoolName={schoolSettings.name} city={schoolSettings.city} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ErpHeader
          schoolName={schoolSettings.name}
          title="Documents Officiels, Certificats & Cartes Scolaires"
          breadcrumbs={[
            { label: 'Tableau de Bord', href: '/dashboard' },
            { label: 'Documents & Actes' },
            { label: 'Certificats & Cartes' },
          ]}
        />

        {/* Toolbar de sélection & Paramétrage (Masquée à l'impression) */}
        <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-3.5 print:hidden shadow-2xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Choix du type de document principal */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDocType('CERTIFICAT_SCOLARITE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-smooth flex items-center gap-1.5 cursor-pointer ${
                  docType === 'CERTIFICAT_SCOLARITE'
                    ? 'bg-nature-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Certificate size={15} weight="bold" />
                <span>Certificat de Scolarité</span>
              </button>

              <button
                type="button"
                onClick={() => setDocType('ATTESTATION_FREQUENTATION')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-smooth flex items-center gap-1.5 cursor-pointer ${
                  docType === 'ATTESTATION_FREQUENTATION'
                    ? 'bg-nature-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <FileText size={15} weight="bold" />
                <span>Attestation de Fréquentation</span>
              </button>

              <button
                type="button"
                onClick={() => setDocType('CARTE_SCOLAIRE')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-smooth flex items-center gap-1.5 cursor-pointer ${
                  docType === 'CARTE_SCOLAIRE'
                    ? 'bg-nature-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <IdentificationBadge size={16} weight="bold" />
                <span>Cartes Scolaires (Format CNI / Badge)</span>
              </button>
            </div>

            {/* Boutons d'action : Logo & Impression */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputLogoRef.current?.click()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-smooth flex items-center gap-1.5 cursor-pointer border border-slate-200"
                title="Ajouter ou remplacer le logo de l'établissement"
              >
                <UploadSimple size={14} weight="bold" />
                <span>{schoolSettings.logo_url ? 'Changer Logo' : '+ Logo Établissement'}</span>
              </button>
              <input
                ref={fileInputLogoRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />

              {/* Input invisible pour upload photo élève */}
              <input
                ref={fileInputPhotoRef}
                type="file"
                accept="image/*"
                onChange={handleStudentPhotoUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-nature-700 hover:bg-nature-800 text-white font-bold text-xs rounded-xl transition-smooth flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer size={16} weight="bold" />
                <span>Imprimer Prêt pour Découpe</span>
              </button>
            </div>
          </div>

          {/* Sous-barre dédiée aux Cartes Scolaires */}
          {docType === 'CARTE_SCOLAIRE' ? (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              {/* 1. Choix du mode Recto seul ou Recto + Verso */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Faces :</span>
                <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-xs font-bold shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setCardFaceMode('RECTO_ONLY')}
                    className={`px-3 py-1 rounded transition-smooth cursor-pointer ${
                      cardFaceMode === 'RECTO_ONLY'
                        ? 'bg-nature-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Recto Seul (Éco)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardFaceMode('RECTO_VERSO')}
                    className={`px-3 py-1 rounded transition-smooth cursor-pointer ${
                      cardFaceMode === 'RECTO_VERSO'
                        ? 'bg-nature-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Recto & Verso
                  </button>
                </div>
              </div>

              {/* 2. Choix de la mise en page d'impression (Planche massicot vs individuelle) */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Gabarit :</span>
                <select
                  value={sheetLayout}
                  onChange={(e) => setSheetLayout(e.target.value as any)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-nature-600 cursor-pointer shadow-2xs"
                >
                  <option value="SHEET_A4_FOLD">Planche A4 Pliage (4 élèves Recto+Verso côte à côte)</option>
                  <option value="SHEET_A4_RECTO">Planche A4 Massicot (8 cartes par feuille avec repères de coupe)</option>
                  <option value="SHEET_A4_DUPLEX">Planche A4 Duplex (Page 1: 8 Rectos · Page 2: 8 Versos)</option>
                  <option value="INDIVIDUAL">Carte Individuelle Unique (1 élève)</option>
                </select>
              </div>

              {/* 3. Filtre par Classe ou par Élève */}
              <div className="flex items-center gap-2">
                {sheetLayout === 'INDIVIDUAL' ? (
                  <>
                    <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Élève :</span>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-nature-600 cursor-pointer min-w-[200px]"
                    >
                      {students.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.last_name} {st.first_name} ({st.classroom_name})
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Filtre Classe :</span>
                    <select
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                      className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-nature-600 cursor-pointer min-w-[150px]"
                    >
                      <option value="ALL">Toutes les classes ({students.length} élèves)</option>
                      {availableClasses.map((cls) => {
                        const count = students.filter((s) => s.classroom_name === cls).length;
                        return (
                          <option key={cls} value={cls}>
                            {cls} ({count} élèves)
                          </option>
                        );
                      })}
                    </select>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Sélecteur simple d'élève pour Certificats et Attestations */
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Élève concerné :</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-nature-600 cursor-pointer min-w-[320px]"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.last_name} {st.first_name} ({st.classroom_name}) — {st.matricule}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Zone de prévisualisation & Impression A4 */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center print:p-0 print:overflow-visible bg-slate-100/70">
          {activeStudent && (
            <>
              {/* ═════════════════════════════════════════════════════════════ */}
              {/* DOCUMENT 1 : CERTIFICAT DE SCOLARITÉ (GABARIT STRICT A4)      */}
              {/* ═════════════════════════════════════════════════════════════ */}
              {docType === 'CERTIFICAT_SCOLARITE' && (
                <div
                  id="printable-a4-document"
                  className="w-[210mm] min-h-[297mm] max-h-[297mm] bg-white border border-slate-300 shadow-xl p-[14mm] text-slate-900 flex flex-col justify-between relative print:border-none print:shadow-none print:m-0 print:p-[12mm_15mm] print:w-full print:h-[297mm]"
                  style={{ boxSizing: 'border-box' }}
                >
                  <AfricanMotif pattern={schoolSettings.watermark_pattern} opacity={0.03} className="absolute inset-0 pointer-events-none" />

                  <div>
                    <div className="flex justify-between items-start pb-3 border-b-2 border-slate-900">
                      <div className="w-[38%] text-left">
                        <div className="font-black uppercase text-[10px] tracking-wider text-slate-900 leading-tight">
                          BURKINA FASO
                        </div>
                        <div className="text-[9px] italic text-slate-600 font-serif">
                          Unité - Progrès - Justice
                        </div>
                        <div className="text-[9px] uppercase font-bold text-slate-800 mt-1.5 leading-tight">
                          Ministère de l&apos;Éducation Nationale, de l&apos;Alphabétisation et de la Promotion des Langues Nationales
                        </div>
                        <div className="text-[8px] text-slate-600 mt-0.5">
                          Direction Régionale de l&apos;Éducation Post-Primaire et Secondaire
                        </div>
                      </div>

                      <div className="w-[24%] flex flex-col items-center justify-center">
                        {schoolSettings.logo_url ? (
                          <div className="w-16 h-16 flex items-center justify-center mb-1">
                            <img src={schoolSettings.logo_url} alt="Logo École" className="max-h-full max-w-full object-contain" />
                          </div>
                        ) : (
                          <BurkinaCoatOfArms className="w-14 h-14" />
                        )}
                        <span className="text-[8px] font-mono font-bold text-slate-500 mt-1">
                          {schoolSettings.code_menapln}
                        </span>
                      </div>

                      <div className="w-[38%] text-right">
                        <div className="font-black text-sm uppercase text-slate-900 leading-tight">
                          {schoolSettings.name}
                        </div>
                        <div className="text-[9px] text-slate-600 mt-1">
                          {schoolSettings.address || `${schoolSettings.city}, Burkina Faso`}
                        </div>
                        <div className="text-[9px] text-slate-600 font-medium">
                          Tél : {schoolSettings.phone}
                        </div>
                        <div className="text-[8px] italic text-nature-800 mt-1">
                          « {schoolSettings.motto} »
                        </div>
                      </div>
                    </div>

                    <div className="text-center my-4">
                      <h1 className="text-xl font-black uppercase tracking-widest text-slate-900 underline decoration-2 underline-offset-8">
                        CERTIFICAT DE SCOLARITÉ
                      </h1>
                      <p className="text-[11px] font-semibold text-slate-500 mt-1.5 font-mono">
                        RÉFÉRENCE : CS-{new Date().getFullYear()}/{activeStudent.matricule.replace('KLS-', '')}
                      </p>
                    </div>

                    <div className="space-y-3 text-xs leading-relaxed text-slate-800">
                      <p className="text-justify">
                        Le Chef d&apos;Établissement / Proviseur du <strong>{schoolSettings.name}</strong> soussigné, atteste que l&apos;élève désigné(e) ci-après est régulièrement inscrit(e) et poursuit ses études au titre de l&apos;année scolaire <strong>{academicYear}</strong> :
                      </p>

                      <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1.5 text-xs my-2">
                        <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                          <span className="text-slate-500 font-medium">Nom & Prénom(s) :</span>
                          <strong className="text-slate-900 uppercase font-black tracking-wide">
                            {activeStudent.last_name} {activeStudent.first_name}
                          </strong>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                          <span className="text-slate-500 font-medium">Date et Lieu de naissance :</span>
                          <strong className="text-slate-800">{birthText}</strong>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                          <span className="text-slate-500 font-medium">Genre / Sexe :</span>
                          <strong className="text-slate-800">{activeStudent.gender === 'F' ? 'Féminin' : 'Masculin'}</strong>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-slate-500 font-medium">Numéro Matricule National :</span>
                          <strong className="font-mono text-nature-800 font-bold">{activeStudent.matricule}</strong>
                        </div>
                      </div>

                      <p>Inscrit(e) dans la classe pédagogique de :</p>
                      <div className="text-center font-black text-sm uppercase py-2 text-nature-800 bg-nature-50/70 rounded-lg border border-nature-200 tracking-wide">
                        {activeStudent.classroom_name} — {activeStudent.cycle === 'PRIMAIRE' ? 'Cycle Primaire' : 'Enseignement Secondaire Général'}
                      </div>

                      <p className="text-justify pt-0.5">
                        Régime de fréquentation : <strong>{activeStudent.regime}</strong>.
                      </p>

                      <p className="text-justify italic text-slate-600">
                        En foi de quoi, le présent certificat de scolarité lui est délivré pour servir et valoir ce que de droit.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-xs">
                    <div>
                      <div className="font-mono text-[9px] text-slate-400">
                        Scellement SHA-256 : cert-{activeStudent.id.substring(0, 8)}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        Acte officiel certifié conforme par kalansso os
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold">
                        <CheckCircle size={14} weight="fill" />
                        <span>Inscription vérifiée et validée</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-slate-700">
                        Fait à {schoolSettings.city}, le {new Date().toLocaleDateString('fr-FR')}
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {schoolSettings.director_title || 'Le Chef d’Établissement / Proviseur'}
                      </div>
                      <div className="text-xs font-bold text-nature-800 mt-0.5">
                        {schoolSettings.director_name || 'M. ILBOUDO Marc'}
                      </div>

                      <div className="h-20 flex items-center justify-end mt-1">
                        <div className="w-20 h-20 border-2 border-dashed border-slate-400 rounded-full flex flex-col items-center justify-center text-[7px] text-slate-400 uppercase tracking-widest font-bold text-center p-1 bg-slate-50/50">
                          <span>Cachet Officiel</span>
                          <span className="text-[7px] text-slate-300 font-normal mt-0.5">& Signature</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═════════════════════════════════════════════════════════════ */}
              {/* DOCUMENT 2 : ATTESTATION DE FRÉQUENTATION (GABARIT STRICT A4)  */}
              {/* ═════════════════════════════════════════════════════════════ */}
              {docType === 'ATTESTATION_FREQUENTATION' && (
                <div
                  id="printable-a4-document"
                  className="w-[210mm] min-h-[297mm] max-h-[297mm] bg-white border border-slate-300 shadow-xl p-[14mm] text-slate-900 flex flex-col justify-between relative print:border-none print:shadow-none print:m-0 print:p-[12mm_15mm] print:w-full print:h-[297mm]"
                  style={{ boxSizing: 'border-box' }}
                >
                  <AfricanMotif pattern={schoolSettings.watermark_pattern} opacity={0.03} className="absolute inset-0 pointer-events-none" />

                  <div>
                    <div className="flex justify-between items-start pb-3 border-b-2 border-slate-900">
                      <div className="w-[38%] text-left">
                        <div className="font-black uppercase text-[10px] tracking-wider text-slate-900 leading-tight">
                          BURKINA FASO
                        </div>
                        <div className="text-[9px] italic text-slate-600 font-serif">
                          Unité - Progrès - Justice
                        </div>
                        <div className="text-[9px] uppercase font-bold text-slate-800 mt-1.5 leading-tight">
                          Ministère de l&apos;Éducation Nationale (MENAPLN)
                        </div>
                      </div>

                      <div className="w-[24%] flex flex-col items-center justify-center">
                        {schoolSettings.logo_url ? (
                          <div className="w-16 h-16 flex items-center justify-center mb-1">
                            <img src={schoolSettings.logo_url} alt="Logo École" className="max-h-full max-w-full object-contain" />
                          </div>
                        ) : (
                          <BurkinaCoatOfArms className="w-14 h-14" />
                        )}
                        <span className="text-[8px] font-mono font-bold text-slate-500 mt-1">
                          {schoolSettings.code_menapln}
                        </span>
                      </div>

                      <div className="w-[38%] text-right">
                        <div className="font-black text-sm uppercase text-slate-900 leading-tight">
                          {schoolSettings.name}
                        </div>
                        <div className="text-[9px] text-slate-600 mt-1">
                          {schoolSettings.address || `${schoolSettings.city}, Burkina Faso`}
                        </div>
                        <div className="text-[9px] text-slate-600 font-medium">
                          Tél : {schoolSettings.phone}
                        </div>
                      </div>
                    </div>

                    <div className="text-center my-4">
                      <h1 className="text-xl font-black uppercase tracking-widest text-slate-900 underline decoration-2 underline-offset-8">
                        ATTESTATION DE FRÉQUENTATION
                      </h1>
                      <p className="text-[11px] font-semibold text-slate-500 mt-1.5 font-mono">
                        RÉF : AF-{new Date().getFullYear()}/{activeStudent.matricule.replace('KLS-', '')}
                      </p>
                    </div>

                    <div className="space-y-3 text-xs leading-relaxed text-slate-800">
                      <p className="text-justify">
                        La Direction du <strong>{schoolSettings.name}</strong> atteste par la présente que l&apos;élève :
                      </p>

                      <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1.5 text-xs my-2">
                        <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                          <span className="text-slate-500 font-medium">Nom & Prénom(s) :</span>
                          <strong className="text-slate-900 uppercase font-black">
                            {activeStudent.last_name} {activeStudent.first_name}
                          </strong>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                          <span className="text-slate-500 font-medium">Matricule :</span>
                          <strong className="font-mono text-nature-800 font-bold">{activeStudent.matricule}</strong>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-slate-500 font-medium">Classe fréquentée :</span>
                          <strong className="text-slate-800">{activeStudent.classroom_name}</strong>
                        </div>
                      </div>

                      <p className="text-justify">
                        Fréquente avec assiduité et régularité les cours dispensés dans notre établissement au titre de l&apos;année scolaire <strong>{academicYear}</strong>.
                      </p>

                      <p className="text-justify italic text-slate-600">
                        La présente attestation est délivrée à la demande de l&apos;intéressé(e) pour servir et valoir auprès des organismes compétents (CNSS, CARFO, Allocations familiales, Ambassades).
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-xs">
                    <div>
                      <div className="font-mono text-[9px] text-slate-400">
                        Identifiant d&apos;authenticité : {activeStudent.id.substring(0, 12)}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        Système kalansso os · Certifié conforme
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-slate-700">
                        Fait à {schoolSettings.city}, le {new Date().toLocaleDateString('fr-FR')}
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {schoolSettings.director_title || 'Le Chef d’Établissement'}
                      </div>
                      <div className="text-xs font-bold text-nature-800 mt-0.5">
                        {schoolSettings.director_name || 'M. ILBOUDO Marc'}
                      </div>
                      <div className="h-20 flex items-center justify-end mt-1">
                        <div className="w-20 h-20 border-2 border-dashed border-slate-400 rounded-full flex flex-col items-center justify-center text-[7px] text-slate-400 uppercase tracking-widest font-bold text-center p-1 bg-slate-50/50">
                          <span>Cachet Officiel</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═════════════════════════════════════════════════════════════ */}
              {/* DOCUMENT 3 : CARTES SCOLAIRES FORMAT CNI / BANCAIRE           */}
              {/* ═════════════════════════════════════════════════════════════ */}
              {docType === 'CARTE_SCOLAIRE' && (
                <div id="printable-card-sheet" className="w-full flex flex-col items-center space-y-8">
                  {/* Notice informative graphiste / massicot */}
                  <div className="print:hidden max-w-[210mm] w-full bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scissors size={18} className="text-blue-700" weight="bold" />
                      <div>
                        <strong>Format Standard ISO ID-1 (85.6 mm × 54 mm) :</strong> Dimensions identiques à la CNI burkinabè et aux cartes bancaires.
                        {sheetLayout !== 'INDIVIDUAL' && ' Repères de coupe intégrés pour guidage de découpe au massicot.'}
                      </div>
                    </div>
                    <div className="text-[11px] text-blue-800 font-mono">
                      {filteredStudentsForCards.length} élève(s) sélectionné(s)
                    </div>
                  </div>

                  {/* CAS 1 : CARTE INDIVIDUELLE UNIQUE */}
                  {sheetLayout === 'INDIVIDUAL' && (
                    <div className="flex flex-col items-center gap-6 py-6">
                      <div className="flex flex-wrap items-center justify-center gap-6">
                        {/* RECTO */}
                        <div className="space-y-1.5">
                          <div className="text-[10px] uppercase font-bold text-slate-500 text-center tracking-wider print:hidden">
                            Face Avant (Recto)
                          </div>
                          {renderCardRecto(activeStudent, false)}
                        </div>

                        {/* VERSO (Si activé) */}
                        {cardFaceMode === 'RECTO_VERSO' && (
                          <div className="space-y-1.5">
                            <div className="text-[10px] uppercase font-bold text-slate-500 text-center tracking-wider print:hidden">
                              Face Arrière (Verso)
                            </div>
                            {renderCardVerso(activeStudent, false)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CAS 2 : PLANCHE A4 PLIAGE (4 Élèves par feuille A4, Recto & Verso juxtaposés) */}
                  {sheetLayout === 'SHEET_A4_FOLD' && (
                    <div className="space-y-8">
                      {Array.from({ length: Math.ceil(filteredStudentsForCards.length / 4) }).map((_, pageIdx) => {
                        const pageStudents = filteredStudentsForCards.slice(pageIdx * 4, pageIdx * 4 + 4);

                        return (
                          <div
                            key={`sheet-fold-${pageIdx}`}
                            className="sheet-a4-page bg-white w-[210mm] min-h-[297mm] max-h-[297mm] p-[10mm_12mm] shadow-xl border border-slate-300 print:border-none print:shadow-none print:m-0 flex flex-col justify-between relative box-border page-break"
                          >
                            {/* En-tête technique discret de planche */}
                            <div className="flex items-center justify-between text-[7pt] text-slate-400 font-mono pb-1 border-b border-slate-200">
                              <span>PLANCHE A4 PLIAGE · 4 ÉLÈVES PAR FEUILLE (RECTO / VERSO JUXTAPOSÉS)</span>
                              <span>{schoolSettings.name} · {academicYear} · Page {pageIdx + 1}</span>
                            </div>

                            {/* Grille des 4 paires (Recto à gauche, Verso à droite) */}
                            <div className="flex flex-col justify-between flex-1 py-2 space-y-2">
                              {pageStudents.map((st) => (
                                <div key={st.id} className="relative flex items-center justify-center gap-3 py-1">
                                  {/* Repères de coupe extérieurs */}
                                  <div className="relative group">
                                    {renderCardRecto(st, true)}
                                    {/* Traits de coupe massicot */}
                                    <div className="crop-mark top-left"></div>
                                    <div className="crop-mark bottom-left"></div>
                                  </div>

                                  {cardFaceMode === 'RECTO_VERSO' ? (
                                    <div className="relative group">
                                      {renderCardVerso(st, true)}
                                      {/* Traits de coupe massicot */}
                                      <div className="crop-mark top-right"></div>
                                      <div className="crop-mark bottom-right"></div>
                                    </div>
                                  ) : (
                                    <div className="w-[85.6mm] h-[54mm] border border-dashed border-slate-200 rounded-[3.2mm] flex items-center justify-center text-[7pt] text-slate-300 font-mono">
                                      Verso non imprimé (Option Éco)
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Pied de planche */}
                            <div className="flex items-center justify-between text-[6.5pt] text-slate-400 font-mono pt-1 border-t border-slate-200">
                              <span>Traits de coupe fins aux angles · Prêt pour massicotage ou plastification dos-à-dos</span>
                              <span>Généré par Kalansso OS</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CAS 3 : PLANCHE A4 MASSICOT (8 Cartes par feuille A4 : 2 Colonnes × 4 Rangées) */}
                  {sheetLayout === 'SHEET_A4_RECTO' && (
                    <div className="space-y-8">
                      {Array.from({ length: Math.ceil(filteredStudentsForCards.length / 8) }).map((_, pageIdx) => {
                        const pageStudents = filteredStudentsForCards.slice(pageIdx * 8, pageIdx * 8 + 8);

                        return (
                          <div
                            key={`sheet-recto-${pageIdx}`}
                            className="sheet-a4-page bg-white w-[210mm] min-h-[297mm] max-h-[297mm] p-[10mm_12mm] shadow-xl border border-slate-300 print:border-none print:shadow-none print:m-0 flex flex-col justify-between relative box-border page-break"
                          >
                            <div className="flex items-center justify-between text-[7pt] text-slate-400 font-mono pb-1 border-b border-slate-200">
                              <span>PLANCHE A4 MASSICOT · 8 RECTOS PAR FEUILLE (2 COLONNES × 4 RANGÉES)</span>
                              <span>{schoolSettings.name} · {academicYear} · Page {pageIdx + 1}</span>
                            </div>

                            {/* Grille 2 x 4 */}
                            <div className="grid grid-cols-2 gap-x-[6mm] gap-y-[4.5mm] my-auto justify-items-center">
                              {pageStudents.map((st) => (
                                <div key={st.id} className="relative">
                                  {renderCardRecto(st, true)}
                                  <div className="crop-mark top-left"></div>
                                  <div className="crop-mark top-right"></div>
                                  <div className="crop-mark bottom-left"></div>
                                  <div className="crop-mark bottom-right"></div>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between text-[6.5pt] text-slate-400 font-mono pt-1 border-t border-slate-200">
                              <span>8 Badges éco au format CNI / Bancaire (85.6 mm × 54 mm) · Repères de découpe massicot</span>
                              <span>Généré par Kalansso OS</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CAS 4 : PLANCHE A4 DUPLEX (Page 1 = 8 Rectos, Page 2 = 8 Versos en Miroir) */}
                  {sheetLayout === 'SHEET_A4_DUPLEX' && (
                    <div className="space-y-8">
                      {Array.from({ length: Math.ceil(filteredStudentsForCards.length / 8) }).map((_, pageIdx) => {
                        const pageStudents = filteredStudentsForCards.slice(pageIdx * 8, pageIdx * 8 + 8);

                        return (
                          <React.Fragment key={`sheet-duplex-group-${pageIdx}`}>
                            {/* PAGE RECTOS */}
                            <div className="sheet-a4-page bg-white w-[210mm] min-h-[297mm] max-h-[297mm] p-[10mm_12mm] shadow-xl border border-slate-300 print:border-none print:shadow-none print:m-0 flex flex-col justify-between relative box-border page-break">
                              <div className="flex items-center justify-between text-[7pt] text-slate-400 font-mono pb-1 border-b border-slate-200">
                                <span>DUPLEX · PAGE RECTOS ({pageStudents.length} CARTES)</span>
                                <span>{schoolSettings.name} · {academicYear} · Page {pageIdx * 2 + 1}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-x-[6mm] gap-y-[4.5mm] my-auto justify-items-center">
                                {pageStudents.map((st) => (
                                  <div key={`dup-r-${st.id}`} className="relative">
                                    {renderCardRecto(st, true)}
                                    <div className="crop-mark top-left"></div>
                                    <div className="crop-mark top-right"></div>
                                    <div className="crop-mark bottom-left"></div>
                                    <div className="crop-mark bottom-right"></div>
                                  </div>
                                ))}
                              </div>

                              <div className="flex items-center justify-between text-[6.5pt] text-slate-400 font-mono pt-1 border-t border-slate-200">
                                <span>Face Avant · Prêt pour impression recto-verso automatique</span>
                                <span>Généré par Kalansso OS</span>
                              </div>
                            </div>

                            {/* PAGE VERSOS (En miroir horizontal pour concordance parfaite recto-verso) */}
                            {cardFaceMode === 'RECTO_VERSO' && (
                              <div className="sheet-a4-page bg-white w-[210mm] min-h-[297mm] max-h-[297mm] p-[10mm_12mm] shadow-xl border border-slate-300 print:border-none print:shadow-none print:m-0 flex flex-col justify-between relative box-border page-break">
                                <div className="flex items-center justify-between text-[7pt] text-slate-400 font-mono pb-1 border-b border-slate-200">
                                  <span>DUPLEX · PAGE VERSOS (ALIGNEMENT EN MIROIR HORIZONTAL)</span>
                                  <span>{schoolSettings.name} · {academicYear} · Page {pageIdx * 2 + 2}</span>
                                </div>

                                {/* Disposition en miroir : la colonne 1 devient colonne 2 pour correspondance parfaite */}
                                <div className="grid grid-cols-2 gap-x-[6mm] gap-y-[4.5mm] my-auto justify-items-center">
                                  {Array.from({ length: Math.ceil(pageStudents.length / 2) }).flatMap((_, rowIdx) => {
                                    const leftSt = pageStudents[rowIdx * 2];
                                    const rightSt = pageStudents[rowIdx * 2 + 1];
                                    // Inverse l'ordre horizontal : rightSt d'abord, puis leftSt
                                    return [
                                      rightSt ? (
                                        <div key={`dup-v-${rightSt.id}`} className="relative">
                                          {renderCardVerso(rightSt, true)}
                                          <div className="crop-mark top-left"></div>
                                          <div className="crop-mark top-right"></div>
                                          <div className="crop-mark bottom-left"></div>
                                          <div className="crop-mark bottom-right"></div>
                                        </div>
                                      ) : (
                                        <div key={`empty-r-${rowIdx}`} className="w-[85.6mm] h-[54mm]"></div>
                                      ),
                                      leftSt ? (
                                        <div key={`dup-v-${leftSt.id}`} className="relative">
                                          {renderCardVerso(leftSt, true)}
                                          <div className="crop-mark top-left"></div>
                                          <div className="crop-mark top-right"></div>
                                          <div className="crop-mark bottom-left"></div>
                                          <div className="crop-mark bottom-right"></div>
                                        </div>
                                      ) : null,
                                    ];
                                  })}
                                </div>

                                <div className="flex items-center justify-between text-[6.5pt] text-slate-400 font-mono pt-1 border-t border-slate-200">
                                  <span>Face Arrière · Alignement exact au dos des rectos correspondants</span>
                                  <span>Généré par Kalansso OS</span>
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* RÈGLES STRICTES D'IMPRESSION A4 PORTRAIT & GESTION DU MASSICOT */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }

        /* Repères de coupe graphiste (Crop Marks) */
        .crop-mark {
          position: absolute;
          width: 3mm;
          height: 3mm;
          pointer-events: none;
        }
        .crop-mark.top-left {
          top: -2mm;
          left: -2mm;
          border-top: 0.5px solid #94a3b8;
          border-left: 0.5px solid #94a3b8;
        }
        .crop-mark.top-right {
          top: -2mm;
          right: -2mm;
          border-top: 0.5px solid #94a3b8;
          border-right: 0.5px solid #94a3b8;
        }
        .crop-mark.bottom-left {
          bottom: -2mm;
          left: -2mm;
          border-bottom: 0.5px solid #94a3b8;
          border-left: 0.5px solid #94a3b8;
        }
        .crop-mark.bottom-right {
          bottom: -2mm;
          right: -2mm;
          border-bottom: 0.5px solid #94a3b8;
          border-right: 0.5px solid #94a3b8;
        }

        @media print {
          body * {
            visibility: hidden !important;
          }

          #printable-a4-document,
          #printable-a4-document *,
          #printable-card-sheet,
          #printable-card-sheet * {
            visibility: visible !important;
          }

          html,
          body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #printable-a4-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-shadow: none !important;
            border: none !important;
          }

          #printable-card-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .sheet-a4-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 10mm 12mm !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            box-shadow: none !important;
            border: none !important;
          }

          .card-id-box {
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .page-break {
            page-break-after: always !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Chargement des documents...</div>}>
      <DocumentsContent />
    </Suspense>
  );
}
