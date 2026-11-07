import React from 'react';

export type WatermarkPattern =
  | 'FASO_DAN_FANI'
  | 'TIEBELE_KASSENA'
  | 'ETALON_BURKINA'
  | 'ETOILE_REVOLUTION'
  | 'GRENIER_GOUROUNSI'
  | 'MASQUE_BOBO_BWA'
  | 'JARRE_UNITE'
  | 'GUILLOCHE_OFFICIEL'
  | 'BAO_BAORE_MOSSI'
  | 'FLECHES_JUSTICE';

export interface WatermarkMeta {
  id: WatermarkPattern;
  name: string;
  category: 'Patrimoine Textile' | 'Architecture Royale' | 'Symboles de l’État' | 'Arts & Traditions';
  description: string;
}

export const WATERMARK_CATALOG: WatermarkMeta[] = [
  {
    id: 'FASO_DAN_FANI',
    name: 'Tissage Faso Dan Fani (Recommandé)',
    category: 'Patrimoine Textile',
    description: 'Trame textile nationale à chevrons croisés, sobre et représentative de l’identité burkinabè.',
  },
  {
    id: 'TIEBELE_KASSENA',
    name: 'Fresques Royales de Tiébélé',
    category: 'Architecture Royale',
    description: 'Géométrie sacrée Kasséna (patrimoine mondial UNESCO) aux losanges et triangles imbriqués.',
  },
  {
    id: 'ETALON_BURKINA',
    name: 'Étalon Cabré du Faso',
    category: 'Symboles de l’État',
    description: 'Silhouette de l’étalon noble burkinabè, emblème de bravoure, de fierté et d’excellence académique.',
  },
  {
    id: 'ETOILE_REVOLUTION',
    name: 'Étoile Dorée du Progrès',
    category: 'Symboles de l’État',
    description: 'Étoile centrale à cinq branches du drapeau national, symbole de repère et de réussite pour les élèves.',
  },
  {
    id: 'GRENIER_GOUROUNSI',
    name: 'Grenier Traditionnel de Sécurité',
    category: 'Architecture Royale',
    description: 'Voûtes protectrices circulaires évoquant la réserve du savoir, la rigueur et la transmission pérenne.',
  },
  {
    id: 'MASQUE_BOBO_BWA',
    name: 'Masque Soleil Voltaïque',
    category: 'Arts & Traditions',
    description: 'Disque solaire concentrique traditionnel Bwa, diffusant la lumière de la connaissance et de la sagesse.',
  },
  {
    id: 'JARRE_UNITE',
    name: 'Jarre de l’Unité & Concorde',
    category: 'Arts & Traditions',
    description: 'Entrelacs symbolisant l’union sacrée entre enseignants, parents et apprenants pour boucher toute faille.',
  },
  {
    id: 'GUILLOCHE_OFFICIEL',
    name: 'Guilloché Sécurisé Anti-Fraude',
    category: 'Symboles de l’État',
    description: 'Rosaces et courbes géométriques fines style billet de banque et diplôme d’État pour empêcher la contrefaçon.',
  },
  {
    id: 'BAO_BAORE_MOSSI',
    name: 'Motifs Royaux Bao-Baoré (Mossi)',
    category: 'Architecture Royale',
    description: 'Chevrons royaux du plateau central évoquant la stabilité, l’ordre républicain et la persévérance.',
  },
  {
    id: 'FLECHES_JUSTICE',
    name: 'Bouclier & Flèches de l’Armoirie',
    category: 'Symboles de l’État',
    description: 'Deux flèches entrecroisées et bouclier traditionnel issu de l’armoirie officielle de la République.',
  },
];

interface AfricanMotifProps {
  pattern?: WatermarkPattern | string;
  className?: string;
  opacity?: number;
  color?: string;
}

export const AfricanMotif: React.FC<AfricanMotifProps> = ({
  pattern = 'FASO_DAN_FANI',
  className = '',
  opacity = 0.05,
  color = '#1B4D3E',
}) => {
  const pId = String(pattern).toUpperCase();

  // 1. TIEBELE KASSENA
  if (pId === 'TIEBELE_KASSENA') {
    return (
      <svg className={`pointer-events-none select-none ${className}`} width="100%" height="100%" viewBox="0 0 120 40" preserveAspectRatio="none" style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
        <pattern id="tiebele-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 20 L20 0 L40 20 L20 40 Z" fill="none" stroke={color} strokeWidth="1.2" />
          <path d="M10 20 L20 10 L30 20 L20 30 Z" fill={color} fillOpacity="0.4" />
          <line x1="0" y1="0" x2="40" y2="40" stroke={color} strokeWidth="0.6" />
          <line x1="40" y1="0" x2="0" y2="40" stroke={color} strokeWidth="0.6" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#tiebele-pattern)" />
      </svg>
    );
  }

  // 2. ETALON BURKINA
  if (pId === 'ETALON_BURKINA') {
    return (
      <svg className={`pointer-events-none select-none ${className}`} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
        <pattern id="etalon-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <circle cx="30" cy="30" r="24" fill="none" stroke={color} strokeWidth="0.8" strokeDasharray="3,3" />
          <path d="M22 42 C24 35 26 28 30 20 C34 24 38 22 40 18 C41 24 36 28 38 34 C36 38 32 40 28 42 Z" fill={color} fillOpacity="0.6" />
          <path d="M18 44 L42 44" stroke={color} strokeWidth="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#etalon-pattern)" />
      </svg>
    );
  }

  // 3. ETOILE REVOLUTION
  if (pId === 'ETOILE_REVOLUTION') {
    return (
      <svg className={`pointer-events-none select-none ${className}`} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
        <pattern id="etoile-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <polygon points="25,5 31,18 45,18 34,27 38,40 25,32 12,40 16,27 5,18 19,18" fill="none" stroke={color} strokeWidth="1" />
          <circle cx="25" cy="25" r="4" fill={color} fillOpacity="0.4" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#etoile-pattern)" />
      </svg>
    );
  }

  // 4. GRENIER GOUROUNSI
  if (pId === 'GRENIER_GOUROUNSI') {
    return (
      <svg className={`pointer-events-none select-none ${className}`} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
        <pattern id="grenier-pattern" x="0" y="0" width="45" height="45" patternUnits="userSpaceOnUse">
          <circle cx="22.5" cy="22.5" r="18" fill="none" stroke={color} strokeWidth="0.8" />
          <circle cx="22.5" cy="22.5" r="10" fill="none" stroke={color} strokeWidth="0.6" strokeDasharray="2,2" />
          <path d="M22.5 4.5 L22.5 40.5 M4.5 22.5 L40.5 22.5" stroke={color} strokeWidth="0.5" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grenier-pattern)" />
      </svg>
    );
  }

  // 5. MASQUE BOBO BWA
  if (pId === 'MASQUE_BOBO_BWA') {
    return (
      <svg className={`pointer-events-none select-none ${className}`} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
        <pattern id="masque-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="1" />
          <path d="M4 20 L36 20 M20 4 L20 36 M8 8 L32 32 M8 32 L32 8" stroke={color} strokeWidth="0.6" />
          <circle cx="20" cy="20" r="6" fill={color} fillOpacity="0.3" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#masque-pattern)" />
      </svg>
    );
  }

  // 6. JARRE UNITE
  if (pId === 'JARRE_UNITE') {
    return (
      <svg className={`pointer-events-none select-none ${className}`} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
        <pattern id="jarre-pattern" x="0" y="0" width="35" height="35" patternUnits="userSpaceOnUse">
          <ellipse cx="17.5" cy="17.5" rx="14" ry="11" fill="none" stroke={color} strokeWidth="0.9" />
          <path d="M10 10 Q17.5 15 25 10 M10 25 Q17.5 20 25 25" stroke={color} strokeWidth="0.6" fill="none" />
          <circle cx="17.5" cy="17.5" r="2.5" fill={color} />
        </pattern>
        <rect width="100%" height="100%" fill="url(#jarre-pattern)" />
      </svg>
    );
  }

  // 7. GUILLOCHE OFFICIEL
  if (pId === 'GUILLOCHE_OFFICIEL') {
    return (
      <svg className={`pointer-events-none select-none ${className}`} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
        <pattern id="guilloche-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <circle cx="25" cy="25" r="20" fill="none" stroke={color} strokeWidth="0.6" />
          <circle cx="25" cy="25" r="16" fill="none" stroke={color} strokeWidth="0.5" strokeDasharray="1,1" />
          <circle cx="25" cy="25" r="12" fill="none" stroke={color} strokeWidth="0.5" />
          <circle cx="25" cy="25" r="8" fill="none" stroke={color} strokeWidth="0.6" strokeDasharray="2,1" />
          <circle cx="25" cy="25" r="4" fill={color} fillOpacity="0.2" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#guilloche-pattern)" />
      </svg>
    );
  }

  // 8. BAO BAORE MOSSI
  if (pId === 'BAO_BAORE_MOSSI') {
    return (
      <svg className={`pointer-events-none select-none ${className}`} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
        <pattern id="baobaore-pattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M0 0 L15 15 L30 0 M0 30 L15 15 L30 30" fill="none" stroke={color} strokeWidth="1" />
          <line x1="15" y1="0" x2="15" y2="30" stroke={color} strokeWidth="0.6" strokeDasharray="2,2" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#baobaore-pattern)" />
      </svg>
    );
  }

  // 9. FLECHES JUSTICE
  if (pId === 'FLECHES_JUSTICE') {
    return (
      <svg className={`pointer-events-none select-none ${className}`} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
        <pattern id="fleches-pattern" x="0" y="0" width="45" height="45" patternUnits="userSpaceOnUse">
          <line x1="5" y1="5" x2="40" y2="40" stroke={color} strokeWidth="1" />
          <line x1="40" y1="5" x2="5" y2="40" stroke={color} strokeWidth="1" />
          <polygon points="5,5 12,5 5,12" fill={color} />
          <polygon points="40,5 33,5 40,12" fill={color} />
          <circle cx="22.5" cy="22.5" r="6" fill="none" stroke={color} strokeWidth="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#fleches-pattern)" />
      </svg>
    );
  }

  // 10. FASO DAN FANI (Par défaut)
  return (
    <svg className={`pointer-events-none select-none ${className}`} width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none" style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
      <pattern id="danfani-pattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M0 15 L15 0 L30 15 L15 30 Z" fill="none" stroke={color} strokeWidth="1.2" />
        <line x1="0" y1="15" x2="30" y2="15" stroke={color} strokeWidth="0.8" strokeDasharray="2,2" />
        <line x1="15" y1="0" x2="15" y2="30" stroke={color} strokeWidth="0.8" strokeDasharray="2,2" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#danfani-pattern)" />
    </svg>
  );
};
