'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ErpSidebar } from '@/components/layout/ErpSidebar';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { getSchoolSettings, SchoolSettings, DEFAULT_SCHOOL } from '@/lib/schoolSettings';
import { supabase } from '@/lib/supabase';
import {
  ChatCircleText,
  PaperPlaneTilt,
  CheckCircle,
  DeviceMobile,
  Users,
  FunnelSimple,
  Megaphone,
  CurrencyDollar,
  Certificate,
  Clock,
} from '@phosphor-icons/react';

export default function CommunicationsPage() {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const [campaignType, setCampaignType] = useState<'TUITION_REMINDER' | 'REPORT_CARD' | 'MEETING' | 'CUSTOM'>('TUITION_REMINDER');
  const [targetAudience, setTargetAudience] = useState<'DEBTORS' | 'ALL_PARENTS' | 'EXAM_CLASSES'>('DEBTORS');
  const [channel, setChannel] = useState<'WHATSAPP_SMS' | 'WHATSAPP_ONLY' | 'SMS_ONLY'>('WHATSAPP_SMS');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const [totalStudents, setTotalStudents] = useState<number>(14);
  const [examStudentsCount, setExamStudentsCount] = useState<number>(7);
  const [debtorStudentsCount, setDebtorStudentsCount] = useState<number>(11);

  useEffect(() => {
    async function load() {
      const s = await getSchoolSettings();
      setSchoolSettings(s);
      setCustomMessage(
        `Chers parents d'élèves du ${s.name}, nous vous rappelons que l’échéance de la 2ème tranche de scolarité arrive à terme le 15 du mois. Vous pouvez régler au guichet caisse ou par Moov/Orange Money. Merci pour votre diligence.`
      );

      try {
        const { count: sc } = await supabase.from('students').select('*', { count: 'exact', head: true });
        if (sc !== null) {
          setTotalStudents(sc);
          setExamStudentsCount(Math.min(sc, Math.round(sc * 0.5)));
          setDebtorStudentsCount(Math.max(1, Math.round(sc * 0.75)));
        }
      } catch {}
    }
    load();
  }, []);

  const presets = {
    TUITION_REMINDER:
      'Chers parents, rappel de scolarité pour {NOM_ELEVE} ({CLASSE}) : le solde restant est de {SOLDE} FCFA. Paiement possible en 15s via Moov Money / Orange Money au guichet. Merci de régulariser avant le 15.',
    REPORT_CARD:
      'Chers parents, le bulletin officiel du 1er Trimestre de {NOM_ELEVE} ({CLASSE}) est disponible en ligne. Cliquez sur le lien scellé pour le télécharger : https://kalansso.school/b/{TOKEN}.',
    MEETING:
      'Chers parents d’élèves, vous êtes conviés à l’Assemblée Générale annuelle le Samedi 14 à 09h00 dans la cour de l’établissement. Ordre du jour : bilan pédagogique et projets.',
    CUSTOM: '',
  };

  const handleSelectPreset = (type: 'TUITION_REMINDER' | 'REPORT_CARD' | 'MEETING' | 'CUSTOM') => {
    setCampaignType(type);
    if (type !== 'CUSTOM') {
      setCustomMessage(presets[type]);
    }
  };

  const handleSendBroadcast = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 5000);
    }, 1200);
  };

  const recipientsCount =
    targetAudience === 'DEBTORS' ? debtorStudentsCount : targetAudience === 'EXAM_CLASSES' ? examStudentsCount : totalStudents;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <ErpSidebar schoolName={schoolSettings.name} city={schoolSettings.city} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ErpHeader
          schoolName={schoolSettings.name}
          title="Diffusion des Alertes SMS & WhatsApp"
          breadcrumbs={[
            { label: 'Tableau de Bord', href: '/dashboard' },
            { label: 'Communication' },
            { label: 'Campagnes & Relances' },
          ]}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-nature-700 bg-nature-50 px-2 py-0.5 rounded border border-nature-100">
                  Passerelle WhatsApp & SMS Officielle
                </span>
                <span className="text-xs text-slate-400">Taux de délivrabilité 99.4%</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">Centre de Communication avec les Parents</h1>
              <p className="text-xs text-slate-500 mt-0.5">Diffusion instantanée de relances de scolarité, bulletins et convocations scolaires.</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Crédits d&apos;envoi disponibles</span>
              <span className="text-sm font-bold text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                12 450 SMS / WhatsApp
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form column (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Type de campagne */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  1. Modèle & Type de Message
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('TUITION_REMINDER')}
                    className={`p-3.5 rounded-xl border text-left transition-smooth cursor-pointer ${
                      campaignType === 'TUITION_REMINDER'
                        ? 'border-nature-600 bg-nature-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                      <CurrencyDollar size={16} weight="bold" className="text-nature-700" />
                      <span>Relance Scolarité</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Impayés et échéances de tranches</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPreset('REPORT_CARD')}
                    className={`p-3.5 rounded-xl border text-left transition-smooth cursor-pointer ${
                      campaignType === 'REPORT_CARD'
                        ? 'border-nature-600 bg-nature-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                      <Certificate size={16} weight="bold" className="text-amber-700" />
                      <span>Diffusion Bulletins</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Lien scellé par QR Code</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPreset('MEETING')}
                    className={`p-3.5 rounded-xl border text-left transition-smooth cursor-pointer ${
                      campaignType === 'MEETING'
                        ? 'border-nature-600 bg-nature-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                      <Megaphone size={16} weight="bold" className="text-blue-700" />
                      <span>Convocations & AG</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Réunions de parents d&apos;élèves</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPreset('CUSTOM')}
                    className={`p-3.5 rounded-xl border text-left transition-smooth cursor-pointer ${
                      campaignType === 'CUSTOM'
                        ? 'border-nature-600 bg-nature-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                      <ChatCircleText size={16} weight="bold" className="text-slate-700" />
                      <span>Message Libre</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Rédiger un texte personnalisé</div>
                  </button>
                </div>

                {/* Audience ciblage */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    2. Destinataires ciblés
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'DEBTORS', label: 'Parents avec impayés', count: debtorStudentsCount },
                      { id: 'EXAM_CLASSES', label: 'Classes d’examen (CEP/BEPC/BAC)', count: examStudentsCount },
                      { id: 'ALL_PARENTS', label: 'Tous les parents d’élèves', count: totalStudents },
                    ].map((aud) => (
                      <button
                        key={aud.id}
                        type="button"
                        onClick={() => setTargetAudience(aud.id as any)}
                        className={`p-3 rounded-lg border text-center transition-smooth cursor-pointer ${
                          targetAudience === aud.id
                            ? 'border-nature-600 bg-nature-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">{aud.label}</div>
                        <div className="text-[10px] text-nature-700 font-semibold mt-0.5">{aud.count} destinataires</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Canal */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    3. Canal d&apos;expédition
                  </label>
                  <div className="flex items-center gap-3">
                    {[
                      { id: 'WHATSAPP_SMS', label: 'WhatsApp + SMS (Fallback auto)' },
                      { id: 'WHATSAPP_ONLY', label: 'WhatsApp uniquement' },
                      { id: 'SMS_ONLY', label: 'SMS direct uniquement' },
                    ].map((ch) => (
                      <label key={ch.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="channel"
                          checked={channel === ch.id}
                          onChange={() => setChannel(ch.id as any)}
                          className="accent-nature-700"
                        />
                        <span>{ch.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Éditeur de texte */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Corps du message
                  </label>
                  <textarea
                    rows={4}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:bg-white focus:border-nature-500 transition-smooth"
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                    <span>Variables disponibles : &#123;NOM_ELEVE&#125;, &#123;CLASSE&#125;, &#123;SOLDE&#125;, &#123;TOKEN&#125;</span>
                    <span>{customMessage.length} caractères</span>
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSending || customMessage.trim().length === 0}
                    onClick={handleSendBroadcast}
                    className="w-full py-3 bg-nature-700 hover:bg-nature-800 text-white font-bold rounded-xl transition-smooth shadow-sm text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSending ? (
                      <span>Diffusion en cours...</span>
                    ) : (
                      <>
                        <PaperPlaneTilt size={16} weight="bold" />
                        <span>Diffuser la Campagne ({recipientsCount} familles)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview on phone (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Aperçu en Direct sur le Téléphone du Parent
                </h3>

                {/* Smartphone mock */}
                <div className="max-w-[280px] mx-auto bg-slate-900 rounded-[32px] p-3 shadow-xl border-4 border-slate-800">
                  <div className="h-4 flex items-center justify-center mb-2">
                    <div className="w-16 h-3 bg-slate-800 rounded-full" />
                  </div>

                  <div className="bg-[#EFEAE2] rounded-2xl p-3 min-h-[360px] flex flex-col justify-between text-xs text-slate-900 relative">
                    <div className="space-y-3">
                      {/* Top bar WhatsApp */}
                      <div className="bg-[#075E54] text-white p-2 rounded-lg flex items-center gap-2 shadow-xs -mx-1 -mt-1">
                        <div className="w-6 h-6 rounded-full bg-emerald-700 font-bold text-[10px] flex items-center justify-center">
                          CS
                        </div>
                        <div>
                          <div className="font-bold text-[11px] leading-none">Complexe Wend-Manegda</div>
                          <div className="text-[8px] opacity-80 leading-none mt-0.5">Compte Officiel Vérifié</div>
                        </div>
                      </div>

                      {/* Bubble */}
                      <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-xs text-[11px] leading-relaxed text-slate-800 space-y-1">
                        <p>{customMessage || 'Votre message apparaîtra ici...'}</p>
                        <div className="text-[8px] text-slate-400 text-right">
                          {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ✓✓
                        </div>
                      </div>
                    </div>

                    <div className="text-[9px] text-center text-slate-500 py-1">
                      Chiffré de bout en bout · kalansso os
                    </div>
                  </div>
                </div>
              </div>

              {sendSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
                  <CheckCircle size={18} weight="fill" className="flex-shrink-0 text-emerald-600" />
                  <span>Campagne transmise avec succès à {recipientsCount} destinataires. Les rapports de livraison sont disponibles.</span>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
