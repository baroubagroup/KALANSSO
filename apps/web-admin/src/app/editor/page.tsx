'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { BurkinaCoatOfArms } from '@/components/motifs/BurkinaCoatOfArms';
import { AfricanMotif } from '@/components/motifs/AfricanMotif';
import { getSchoolSettings, SchoolSettings, DEFAULT_SCHOOL } from '@/lib/schoolSettings';
import { getActiveAcademicYear } from '@/lib/academicYear';
import {
  FileText,
  Printer,
  FloppyDisk,
  ArrowCounterClockwise,
  ArrowClockwise,
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  TextAlignJustify,
  ListBullets,
  ListNumbers,
  Table,
  IdentificationBadge,
  CheckCircle,
  UploadSimple,
  Sparkle,
  Trash,
  Plus,
  BookmarkSimple,
  Eye,
  Eraser,
} from '@phosphor-icons/react';

// Modèles prédéfinis prêts à l'emploi
const TEMPLATES = {
  EXAM: {
    id: 'EXAM',
    name: 'Devoir Surveillé / Épreuve d’Examen',
    description: 'Cartouche officiel, durée, barème sur 20, exercices et problème',
    initialHtml: `
<div class="cartouche-epreuve" style="border: 2px solid #0f172a; padding: 12px; margin-bottom: 20px; background-color: #f8fafc; border-radius: 6px;">
  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
    <tr>
      <td style="padding: 4px; font-weight: bold; width: 35%;">ÉPREUVE DE : <span style="color: #1b4d3e; text-transform: uppercase;">MATHEMATIQUES</span></td>
      <td style="padding: 4px; font-weight: bold; width: 35%;">CLASSE : <span style="color: #1b4d3e;">3ème A & B</span></td>
      <td style="padding: 4px; font-weight: bold; text-align: right;">DURÉE : <span>2 HEURES</span></td>
    </tr>
    <tr>
      <td style="padding: 4px; font-size: 12px;">DATE DU DEVOIR : ${new Date().toLocaleDateString('fr-FR')}</td>
      <td style="padding: 4px; font-size: 12px;">COEFFICIENT : 04</td>
      <td style="padding: 4px; text-align: right; font-weight: bold; border: 1px dashed #0f172a; padding: 4px 8px; background: white;">NOTE : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / 20</td>
    </tr>
    <tr>
      <td colspan="3" style="padding: 6px 4px 0 4px; border-top: 1px solid #cbd5e1; font-size: 12px;">
        NOM & PRÉNOM(S) DE L’ÉLÈVE : ..........................................................................................................................
      </td>
    </tr>
  </table>
</div>

<p style="font-size: 11px; font-style: italic; color: #475569; margin-bottom: 16px; border-left: 3px solid #1b4d3e; padding-left: 8px;">
  Consignes officielles : L’usage de la calculatrice scientifique non programmable est autorisé. La clarté des raisonnements et le soin apporté à la rédaction seront pris en compte dans la notation.
</p>

<h3 style="color: #0f172a; border-bottom: 1.5px solid #0f172a; padding-bottom: 4px; margin-top: 16px; font-size: 14px; font-weight: bold;">
  EXERCICE 1 : Calcul Numérique et Algèbre <span style="float: right; color: #1b4d3e; font-size: 12px;">(05 Points)</span>
</h3>
<p style="margin-top: 8px; font-size: 13px; line-height: 1.6;">
  1. On considère l'expression algébrique suivante : <strong>A = (2x - 3)² - (x + 1)²</strong>.<br/>
  &nbsp;&nbsp;&nbsp;&nbsp;a) Développer, réduire et ordonner l'expression A suivant les puissances décroissantes de x.<br/>
  &nbsp;&nbsp;&nbsp;&nbsp;b) Factoriser l'expression A sous forme d'un produit de deux facteurs du premier degré.<br/>
  &nbsp;&nbsp;&nbsp;&nbsp;c) Résoudre dans ℝ l'équation <strong>(3x - 2)(x - 4) = 0</strong>.
</p>
<p style="margin-top: 8px; font-size: 13px; line-height: 1.6;">
  2. Écrire le nombre B sous la forme <em>a√5</em> où <em>a</em> est un entier relatif :<br/>
  &nbsp;&nbsp;&nbsp;&nbsp;<strong>B = 3√20 - 2√45 + √80</strong>.
</p>

<h3 style="color: #0f172a; border-bottom: 1.5px solid #0f172a; padding-bottom: 4px; margin-top: 24px; font-size: 14px; font-weight: bold;">
  EXERCICE 2 : Géométrie Plane & Théorème de Pythagore <span style="float: right; color: #1b4d3e; font-size: 12px;">(05 Points)</span>
</h3>
<p style="margin-top: 8px; font-size: 13px; line-height: 1.6;">
  Soit ABC un triangle rectangle en A tel que AB = 6 cm et AC = 8 cm.<br/>
  1. Faire une figure soignée en respectant les dimensions indiquées.<br/>
  2. Calculer la longueur exacte de l'hypoténuse BC.<br/>
  3. Soit H le projeté orthogonal du point A sur la droite (BC). Calculer l'aire du triangle ABC et en déduire la longueur AH.
</p>

<h3 style="color: #0f172a; border-bottom: 1.5px solid #0f172a; padding-bottom: 4px; margin-top: 24px; font-size: 14px; font-weight: bold;">
  PROBLÈME : Modélisation et Application Pratique <span style="float: right; color: #1b4d3e; font-size: 12px;">(10 Points)</span>
</h3>
<p style="margin-top: 8px; font-size: 13px; line-height: 1.6; text-align: justify;">
  Un groupement maraîcher à Koudougou désire clôturer une parcelle rectangulaire d'aire 1200 m² destinée à la culture des tomates. La longueur du terrain dépasse sa largeur de 10 mètres.<br/>
  1. Déterminer les dimensions exactes (longueur et largeur) de la parcelle maraîchère.<br/>
  2. Le mètre de grillage métallique coûte 1 500 FCFA. Calculer la dépense totale nécessaire pour clôturer entièrement ce domaine en prévoyant un portail de 3 mètres de large.
</p>
    `,
  },

  CIRCULAIRE: {
    id: 'CIRCULAIRE',
    name: 'Circulaire d’Information aux Parents d’Élèves',
    description: 'Avis officiel, calendrier scolaire, paiement des frais de scolarité',
    initialHtml: `
<div style="text-align: center; margin-bottom: 24px;">
  <h2 style="font-size: 17px; font-weight: 900; text-transform: uppercase; text-decoration: underline; letter-spacing: 1px; color: #0f172a;">
    CIRCULAIRE D’INFORMATION AUX PARENTS D’ÉLÈVES
  </h2>
  <p style="font-size: 12px; font-weight: 600; color: #475569; margin-top: 4px;">
    Réf. : DIR/CIRC-2026/042 · Année Scolaire 2026 – 2027
  </p>
</div>

<div style="margin-bottom: 16px; font-size: 13px;">
  <p><strong>Objet :</strong> Calendrier des évaluations du 1er Trimestre et situation des frais de scolarité.</p>
</div>

<p style="font-size: 13px; line-height: 1.8; text-align: justify; margin-bottom: 14px;">
  Chers Parents et Tuteurs d’élèves,
</p>

<p style="font-size: 13px; line-height: 1.8; text-align: justify; margin-bottom: 14px;">
  La Direction du Complexe Scolaire a l’honneur de vous informer du calendrier officiel marquant la fin du premier trimestre de l'année scolaire 2026 – 2027 :
</p>

<ul style="font-size: 13px; line-height: 1.8; margin-left: 20px; margin-bottom: 16px;">
  <li><strong>Du Lundi 15 au Vendredi 19 Décembre 2026 :</strong> Semaine des devoirs de synthèse et compositions trimestrielles pour toutes les classes (du Primaire au Secondaire).</li>
  <li><strong>Samedi 20 Décembre 2026 à 09h00 :</strong> Assemblée générale ordinaire de l’Association des Parents d’Élèves (APE) dans la cour de l'école.</li>
  <li><strong>Du 22 Décembre 2026 au 04 Janvier 2027 inclus :</strong> Congés du premier trimestre. Reprise effective des cours le Lundi 05 Janvier 2027 à 07h00 précises.</li>
</ul>

<div style="padding: 12px; background-color: #f8fafc; border-left: 4px solid #1b4d3e; margin-bottom: 20px; font-size: 12.5px; line-height: 1.7;">
  <strong>Rappel important aux familles :</strong> Conformément au règlement intérieur et pour permettre l'édition et la remise des bulletins scolaires, nous prions les parents ayant des arriérés sur la première tranche de bien vouloir régulariser la situation auprès de la caisse ou via <strong>Moov Money / Orange Money</strong> avant le 15 Décembre.
</div>

<p style="font-size: 13px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
  Nous vous remercions pour votre précieuse collaboration dans le suivi et l’encadrement éducatif de nos enfants.
</p>
    `,
  },

  CONVOCATION: {
    id: 'CONVOCATION',
    name: 'Convocation Officielle de Conseil',
    description: 'Conseil de discipline, conseil des professeurs, réunion de concertation',
    initialHtml: `
<div style="text-align: center; margin-bottom: 24px;">
  <h2 style="font-size: 17px; font-weight: 900; text-transform: uppercase; text-decoration: underline; letter-spacing: 1px; color: #0f172a;">
    CONVOCATION DU CONSEIL DE CLASSE & DÉLIBÉRATIONS
  </h2>
  <p style="font-size: 12px; font-weight: 600; color: #475569; margin-top: 4px;">
    Réf. : PEDAG-CONV/2026-089 · Session du 1er Trimestre
  </p>
</div>

<div style="margin-bottom: 16px; font-size: 13px; line-height: 1.7;">
  <p><strong>Destinataires :</strong> Mesdames et Messieurs les Professeurs, Délégués des parents et Représentants des élèves.</p>
  <p><strong>Date & Heure :</strong> Vendredi 19 Décembre 2026 à 15h30 précises.</p>
  <p><strong>Lieu :</strong> Salle des Professeurs du complexe scolaire.</p>
</div>

<h3 style="font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 16px; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
  ORDRE DU JOUR :
</h3>

<ol style="font-size: 13px; line-height: 1.8; margin-left: 20px; margin-bottom: 20px;">
  <li>Examen du bilan pédagogique et statistique du premier trimestre par palier.</li>
  <li>Analyse individuelle des résultats des apprenants et examen des cas spécifiques.</li>
  <li>Attribution des mentions d'excellence, tableaux d'honneur et encouragements.</li>
  <li>Discussions sur les mesures de remédiation pédagogique pour les élèves en difficulté.</li>
  <li>Divers.</li>
</ol>

<p style="font-size: 13px; line-height: 1.8; text-align: justify;">
  Compte tenu de l'importance capitale des résolutions qui y seront arrêtées pour le parcours académique de nos apprenants, la présence de chacun est vivement requise et obligatoire.
</p>
    `,
  },

  VIERGE: {
    id: 'VIERGE',
    name: 'Document A4 Vierge avec En-tête Officiel',
    description: 'Page blanche pré-configurée avec en-tête burkinabè officiel MENAPLN',
    initialHtml: `
<h2 style="text-align: center; font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; text-decoration: underline;">
  TITRE DU DOCUMENT ICI
</h2>

<p style="font-size: 13px; line-height: 1.8; text-align: justify;">
  Commencez à saisir votre texte ici. Vous pouvez utiliser tous les outils de mise en forme dans la barre supérieure : titres, listes, tableaux de barème, citations et alignements.
</p>
    `,
  },
};

export default function DocumentEditorPage() {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [academicYear, setAcademicYear] = useState<string>(getActiveAcademicYear());
  const [activeTemplate, setActiveTemplate] = useState<string>('EXAM');
  const [docContent, setDocContent] = useState<string>(TEMPLATES.EXAM.initialHtml);
  const [showHeader, setShowHeader] = useState<boolean>(true);
  const [showFooter, setShowFooter] = useState<boolean>(true);
  const [savedNotification, setSavedNotification] = useState<boolean>(false);
  const [logoModalOpen, setLogoModalOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Charger paramètres
  useEffect(() => {
    async function init() {
      const s = await getSchoolSettings();
      setSchoolSettings(s);
      
      // Charger brouillon sauvegardé si présent
      try {
        const savedDraft = localStorage.getItem('kalansso_editor_draft');
        if (savedDraft) {
          setDocContent(savedDraft);
          if (editorRef.current) {
            editorRef.current.innerHTML = savedDraft;
          }
          return;
        }
      } catch {}

      if (editorRef.current) {
        editorRef.current.innerHTML = TEMPLATES.EXAM.initialHtml;
      }
    }
    init();

    function handleYear(e: any) {
      if (e.detail?.year) setAcademicYear(e.detail.year);
    }
    window.addEventListener('kalansso_academic_year_changed', handleYear);
    return () => window.removeEventListener('kalansso_academic_year_changed', handleYear);
  }, []);

  // Formatage texte exécuté nativement via document.execCommand
  const formatText = (command: string, value: string | undefined = undefined) => {
    if (typeof document !== 'undefined') {
      document.execCommand(command, false, value);
      if (editorRef.current) {
        setDocContent(editorRef.current.innerHTML);
      }
    }
  };

  // Changement de modèle
  const handleSelectTemplate = (key: string) => {
    const selected = (TEMPLATES as any)[key];
    if (selected) {
      setActiveTemplate(key);
      setDocContent(selected.initialHtml);
      if (editorRef.current) {
        editorRef.current.innerHTML = selected.initialHtml;
      }
    }
  };

  // Sauvegarde locale
  const handleSaveDraft = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      localStorage.setItem('kalansso_editor_draft', html);
      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 3000);
    }
  };

  // Insertion rapide de composants scolaires
  const insertQuickComponent = (type: 'BAREME_TABLE' | 'CARTOUCHE' | 'SIGNATURE' | 'HR') => {
    if (!editorRef.current) return;

    if (type === 'HR') {
      formatText('insertHorizontalRule');
      return;
    }

    let snippet = '';
    if (type === 'BAREME_TABLE') {
      snippet = `
<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; border: 1px solid #0f172a;">
  <thead>
    <tr style="background-color: #f1f5f9; border-bottom: 1.5px solid #0f172a;">
      <th style="padding: 6px 10px; text-align: left; border-right: 1px solid #cbd5e1;">Exercice / Partie</th>
      <th style="padding: 6px 10px; text-align: left; border-right: 1px solid #cbd5e1;">Compétences Évaluées</th>
      <th style="padding: 6px 10px; text-align: right; width: 90px;">Barème</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 6px 10px; border-right: 1px solid #cbd5e1; font-weight: bold;">Exercice 1</td>
      <td style="padding: 6px 10px; border-right: 1px solid #cbd5e1;">Maîtrise des connaissances & calcul direct</td>
      <td style="padding: 6px 10px; text-align: right; font-weight: bold;">05 pts</td>
    </tr>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 6px 10px; border-right: 1px solid #cbd5e1; font-weight: bold;">Exercice 2</td>
      <td style="padding: 6px 10px; border-right: 1px solid #cbd5e1;">Raisonnement logique & construction géométrique</td>
      <td style="padding: 6px 10px; text-align: right; font-weight: bold;">05 pts</td>
    </tr>
    <tr style="border-bottom: 1.5px solid #0f172a;">
      <td style="padding: 6px 10px; border-right: 1px solid #cbd5e1; font-weight: bold;">Problème</td>
      <td style="padding: 6px 10px; border-right: 1px solid #cbd5e1;">Résolution de problème de la vie courante</td>
      <td style="padding: 6px 10px; text-align: right; font-weight: bold;">10 pts</td>
    </tr>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <td colspan="2" style="padding: 6px 10px; text-align: right; border-right: 1px solid #cbd5e1;">TOTAL GÉNÉRAL :</td>
      <td style="padding: 6px 10px; text-align: right; color: #1b4d3e;">20 / 20</td>
    </tr>
  </tbody>
</table>
      `;
    } else if (type === 'CARTOUCHE') {
      snippet = `
<div style="border: 1.5px solid #0f172a; padding: 8px 12px; margin: 12px 0; background: #f8fafc; font-size: 12px;">
  <strong>Nom de l'Élève :</strong> ...................................................................................................... 
  <strong>Classe :</strong> ................... 
  <strong>Note :</strong> ....... / 20
</div>
      `;
    } else if (type === 'SIGNATURE') {
      snippet = `
<div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; font-size: 12px;">
  <div>
    <em>Le Professeur Titulaire</em><br/>
    <strong style="font-size: 13px;">Signature & Visa</strong>
  </div>
  <div style="text-align: right;">
    <em>Fait à ${schoolSettings.city}, le ${new Date().toLocaleDateString('fr-FR')}</em><br/>
    <strong style="font-size: 13px;">Le Chef d’Établissement / Proviseur</strong>
  </div>
</div>
      `;
    }

    if (snippet) {
      formatText('insertHTML', snippet);
    }
  };

  // Téléversement rapide de logo
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
        setLogoModalOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-900">
      <ErpSidebar schoolName={schoolSettings.name} city={schoolSettings.city} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ErpHeader
          schoolName={schoolSettings.name}
          title="Éditeur de Devoirs, Épreuves & Documents Officiels"
          breadcrumbs={[
            { label: 'Tableau de Bord', href: '/dashboard' },
            { label: 'Pédagogie & Examens' },
            { label: 'Éditeur de Textes A4' },
          ]}
        />

        {/* ── BARRE D'OUTILS PRINCIPALE STYLE "WORD MINIMALISTE" (MASQUÉE À L'IMPRESSION) ── */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 print:hidden shadow-xs space-y-2.5">
          {/* Ligne 1 : Choix du modèle et Actions Principales */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Sélecteur de gabarits rapides */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modèle :</span>
              <select
                value={activeTemplate}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-nature-600 cursor-pointer shadow-2xs"
              >
                {Object.values(TEMPLATES).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              {/* Toggles En-tête / Pied de page */}
              <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-200 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={showHeader}
                    onChange={(e) => setShowHeader(e.target.checked)}
                    className="accent-nature-700 rounded cursor-pointer"
                  />
                  <span>En-tête officiel</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={showFooter}
                    onChange={(e) => setShowFooter(e.target.checked)}
                    className="accent-nature-700 rounded cursor-pointer"
                  />
                  <span>Signature & Date</span>
                </label>
              </div>
            </div>

            {/* Boutons d'action : Sauvegarder & Imprimer A4 */}
            <div className="flex items-center gap-2">
              {/* Bouton logo */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-smooth"
                title="Changer le logo de l'établissement"
              >
                <UploadSimple size={15} weight="bold" />
                <span>Logo de l'école</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-smooth"
              >
                <FloppyDisk size={15} weight="bold" />
                <span>{savedNotification ? 'Enregistré !' : 'Enregistrer brouillon'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-nature-700 hover:bg-nature-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-smooth cursor-pointer"
              >
                <Printer size={16} weight="bold" />
                <span>Imprimer / Exporter en PDF A4</span>
              </button>
            </div>
          </div>

          {/* Ligne 2 : Ruban de Formatage de Texte Word Simplifié */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-slate-700 text-xs">
            {/* Historique */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => formatText('undo')}
                className="p-1.5 hover:bg-white rounded hover:text-slate-900 transition-smooth"
                title="Annuler (Ctrl+Z)"
              >
                <ArrowCounterClockwise size={15} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => formatText('redo')}
                className="p-1.5 hover:bg-white rounded hover:text-slate-900 transition-smooth"
                title="Rétablir (Ctrl+Y)"
              >
                <ArrowClockwise size={15} weight="bold" />
              </button>
            </div>

            <div className="h-5 w-[1px] bg-slate-200 mx-1" />

            {/* Sélecteur de Style / Niveau de Titre */}
            <select
              onChange={(e) => formatText('formatBlock', e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold outline-none cursor-pointer"
              defaultValue="p"
            >
              <option value="p">Texte Normal</option>
              <option value="h1">Grand Titre 1 (Examen)</option>
              <option value="h2">Titre de Partie 2</option>
              <option value="h3">Sous-titre Exercice 3</option>
              <option value="blockquote">Citation / Consigne</option>
            </select>

            <div className="h-5 w-[1px] bg-slate-200 mx-1" />

            {/* Typographie de base */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => formatText('bold')}
                className="p-1.5 hover:bg-white rounded hover:text-slate-900 font-bold transition-smooth"
                title="Gras (Ctrl+B)"
              >
                <TextB size={15} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => formatText('italic')}
                className="p-1.5 hover:bg-white rounded hover:text-slate-900 italic transition-smooth"
                title="Italique (Ctrl+I)"
              >
                <TextItalic size={15} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => formatText('underline')}
                className="p-1.5 hover:bg-white rounded hover:text-slate-900 underline transition-smooth"
                title="Souligné (Ctrl+U)"
              >
                <TextUnderline size={15} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => formatText('strikeThrough')}
                className="p-1.5 hover:bg-white rounded hover:text-slate-900 line-through transition-smooth"
                title="Barré"
              >
                <TextStrikethrough size={15} weight="bold" />
              </button>
            </div>

            <div className="h-5 w-[1px] bg-slate-200 mx-1" />

            {/* Couleurs de texte */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
              <button
                type="button"
                onClick={() => formatText('foreColor', '#0f172a')}
                className="w-4 h-4 rounded-full bg-slate-900 border border-slate-400"
                title="Texte Noir Encre"
              />
              <button
                type="button"
                onClick={() => formatText('foreColor', '#1b4d3e')}
                className="w-4 h-4 rounded-full bg-[#1b4d3e] border border-emerald-300"
                title="Vert Officiel Maître"
              />
              <button
                type="button"
                onClick={() => formatText('foreColor', '#dc2626')}
                className="w-4 h-4 rounded-full bg-red-600 border border-red-300"
                title="Rouge Correction"
              />
              <button
                type="button"
                onClick={() => formatText('foreColor', '#2563eb')}
                className="w-4 h-4 rounded-full bg-blue-600 border border-blue-300"
                title="Bleu Bic"
              />
            </div>

            <div className="h-5 w-[1px] bg-slate-200 mx-1" />

            {/* Alignement */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => formatText('justifyLeft')}
                className="p-1.5 hover:bg-white rounded hover:text-slate-900 transition-smooth"
                title="Aligner à gauche"
              >
                <TextAlignLeft size={15} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => formatText('justifyCenter')}
                className="p-1.5 hover:bg-white rounded hover:text-slate-900 transition-smooth"
                title="Centrer"
              >
                <TextAlignCenter size={15} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => formatText('justifyRight')}
                className="p-1.5 hover:bg-white rounded hover:text-slate-900 transition-smooth"
                title="Aligner à droite"
              >
                <TextAlignRight size={15} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => formatText('justifyFull')}
                className="p-1.5 hover:bg-white rounded hover:text-slate-900 transition-smooth"
                title="Justifier"
              >
                <TextAlignJustify size={15} weight="bold" />
              </button>
            </div>

            <div className="h-5 w-[1px] bg-slate-200 mx-1" />

            {/* Listes */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => formatText('insertUnorderedList')}
                className="p-1.5 hover:bg-white rounded hover:text-slate-900 transition-smooth"
                title="Liste à puces"
              >
                <ListBullets size={15} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => formatText('insertOrderedList')}
                className="p-1.5 hover:bg-white rounded hover:text-slate-900 transition-smooth"
                title="Liste numérotée"
              >
                <ListNumbers size={15} weight="bold" />
              </button>
            </div>

            <div className="h-5 w-[1px] bg-slate-200 mx-1" />

            {/* Composants Scolaires Rapides */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => insertQuickComponent('BAREME_TABLE')}
                className="px-2 py-1 bg-nature-50 hover:bg-nature-100 text-nature-800 rounded border border-nature-200 font-semibold flex items-center gap-1 transition-smooth"
                title="Insérer un tableau de barème et compétences"
              >
                <Table size={14} weight="bold" />
                <span>+ Tableau Barème</span>
              </button>

              <button
                type="button"
                onClick={() => insertQuickComponent('CARTOUCHE')}
                className="px-2 py-1 bg-nature-50 hover:bg-nature-100 text-nature-800 rounded border border-nature-200 font-semibold flex items-center gap-1 transition-smooth"
                title="Insérer une case Nom / Note pour l'élève"
              >
                <IdentificationBadge size={14} weight="bold" />
                <span>+ Cartouche Élève</span>
              </button>

              <button
                type="button"
                onClick={() => insertQuickComponent('SIGNATURE')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold flex items-center gap-1 transition-smooth"
                title="Insérer signature prof & proviseur"
              >
                <span>+ Signatures</span>
              </button>

              <button
                type="button"
                onClick={() => insertQuickComponent('HR')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold transition-smooth"
                title="Ligne horizontale de séparation"
              >
                <hr className="w-4 border-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {/* ── ZONE DE RÉDACTION ET FEUILLE A4 RÉELLE (WYSIWYG) ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center print:p-0 print:overflow-visible bg-slate-200/80">
          <div
            id="printable-word-document"
            className="w-[210mm] min-h-[297mm] bg-white border border-slate-300 shadow-2xl p-[18mm] text-slate-900 flex flex-col justify-between relative print:border-none print:shadow-none print:m-0 print:p-[15mm] print:w-full print:min-h-[297mm]"
            style={{ boxSizing: 'border-box' }}
          >
            <AfricanMotif pattern={schoolSettings.watermark_pattern} opacity={0.02} className="absolute inset-0 pointer-events-none" />

            <div>
              {/* EN-TÊTE OFFICIEL MENAPLN TOGGLEABLE */}
              {showHeader && (
                <div className="flex justify-between items-start pb-4 border-b-2 border-slate-900 mb-6">
                  {/* Gauche : Ministère */}
                  <div className="w-[38%] text-left">
                    <div className="font-black uppercase text-[10px] tracking-wider text-slate-900 leading-tight">
                      BURKINA FASO
                    </div>
                    <div className="text-[9px] italic text-slate-600 font-serif">
                      Unité - Progrès - Justice
                    </div>
                    <div className="text-[9px] uppercase font-bold text-slate-800 mt-2 leading-tight">
                      Ministère de l&apos;Éducation Nationale, de l&apos;Alphabétisation et de la Promotion des Langues Nationales
                    </div>
                    <div className="text-[8px] text-slate-600 mt-0.5">
                      Direction Régionale du Centre · DREPS
                    </div>
                  </div>

                  {/* Centre : Logo ou Armoiries */}
                  <div className="w-[24%] flex flex-col items-center justify-center">
                    {schoolSettings.logo_url ? (
                      <div className="w-16 h-16 flex items-center justify-center mb-1">
                        <img src={schoolSettings.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <BurkinaCoatOfArms className="w-14 h-14" />
                    )}
                    <span className="text-[8px] font-mono font-bold text-slate-500 mt-1">
                      {schoolSettings.code_menapln}
                    </span>
                  </div>

                  {/* Droite : École */}
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
              )}

              {/* CORPS ÉDITABLE DIRECTEMENT DANS LA FEUILLE (CONTENTEDITABLE) */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setDocContent(e.currentTarget.innerHTML)}
                className="outline-none min-h-[550px] text-slate-900 leading-relaxed font-sans focus:ring-0 focus:border-none"
                style={{ wordBreak: 'break-word' }}
              />
            </div>

            {/* PIED DE PAGE STRICT RECOUVREMENT & SIGNATURE */}
            {showFooter && (
              <div className="pt-6 border-t border-slate-300 flex justify-between items-end text-xs mt-8">
                <div>
                  <div className="font-mono text-[9px] text-slate-400">
                    Système kalansso os · Document d'évaluation certifié
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    Année académique : <strong>{academicYear}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold text-slate-700">
                    Fait à {schoolSettings.city}, le {new Date().toLocaleDateString('fr-FR')}
                  </div>
                  <div className="font-bold text-slate-900 mt-1">
                    {schoolSettings.director_title || 'Le Chef d’Établissement / Proviseur'}
                  </div>
                  <div className="text-xs font-bold text-nature-800 mt-0.5">
                    {schoolSettings.director_name || 'M. ILBOUDO Marc'}
                  </div>

                  <div className="h-16 flex items-center justify-end mt-1">
                    <div className="w-16 h-16 border-2 border-dashed border-slate-400 rounded-full flex flex-col items-center justify-center text-[7px] text-slate-400 uppercase tracking-widest font-bold text-center p-0.5 bg-slate-50/50">
                      <span>Cachet</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* RÈGLES STRICTES D'IMPRESSION A4 PORTRAIT */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-word-document, #printable-word-document * {
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
          #printable-word-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 14mm 15mm !important;
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
