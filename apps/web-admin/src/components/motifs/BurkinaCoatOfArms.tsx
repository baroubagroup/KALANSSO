import React from 'react';

export function BurkinaCoatOfArms({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bouclier central avec le drapeau du Burkina Faso */}
      <path
        d="M32 30 C32 24, 68 24, 68 30 C68 55, 58 72, 50 78 C42 72, 32 55, 32 30 Z"
        fill="#FFFFFF"
        stroke="#1B4D3E"
        strokeWidth="2"
      />
      {/* Moitié supérieure rouge */}
      <path
        d="M33 30 C33 25, 67 25, 67 30 L67 46 L33 46 Z"
        fill="#EF4444"
      />
      {/* Moitié inférieure verte */}
      <path
        d="M33 46 L67 46 C67 55, 58 71, 50 76 C42 71, 33 55, 33 46 Z"
        fill="#10B981"
      />
      {/* Étoile jaune dorée centrale */}
      <polygon
        points="50,40 52,44 56,44 53,47 54,51 50,48 46,51 47,47 44,44 48,44"
        fill="#FBBF24"
      />

      {/* Lances croisées traditionnelles */}
      <line x1="22" y1="20" x2="78" y2="76" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="20,18 25,18 22,23" fill="#334155" />
      <line x1="78" y1="20" x2="22" y2="76" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="80,18 75,18 78,23" fill="#334155" />

      {/* Étalon cabré gauche */}
      <path
        d="M20 62 C18 52, 22 42, 26 36 C28 33, 31 34, 30 38 C28 42, 26 48, 28 54 C30 58, 29 64, 25 66 C22 66, 20 64, 20 62 Z"
        fill="#FFFFFF"
        stroke="#1E293B"
        strokeWidth="1.2"
      />
      <circle cx="27" cy="36" r="1" fill="#1E293B" />

      {/* Étalon cabré droit */}
      <path
        d="M80 62 C82 52, 78 42, 74 36 C72 33, 69 34, 70 38 C72 42, 74 48, 72 54 C70 58, 71 64, 75 66 C78 66, 80 64, 80 62 Z"
        fill="#FFFFFF"
        stroke="#1E293B"
        strokeWidth="1.2"
      />
      <circle cx="73" cy="36" r="1" fill="#1E293B" />

      {/* Épis de mil latéraux */}
      <path
        d="M16 45 C15 52, 17 62, 22 68"
        stroke="#EAB308"
        strokeWidth="2"
        strokeDasharray="2 2"
      />
      <path
        d="M84 45 C85 52, 83 62, 78 68"
        stroke="#EAB308"
        strokeWidth="2"
        strokeDasharray="2 2"
      />

      {/* Livre ouvert en bas */}
      <path
        d="M42 76 C46 75, 50 77, 50 77 C50 77, 54 75, 58 76 L58 81 C54 80, 50 82, 50 82 C50 82, 46 80, 42 81 Z"
        fill="#FFFFFF"
        stroke="#334155"
        strokeWidth="1"
      />

      {/* Bannière BURKINA FASO */}
      <path
        d="M26 84 C38 81, 62 81, 74 84 L72 89 C60 86, 40 86, 28 89 Z"
        fill="#F8FAFC"
        stroke="#1E293B"
        strokeWidth="1"
      />
      <text
        x="50"
        y="87.5"
        fontSize="5"
        fontFamily="sans-serif"
        fontWeight="bold"
        textAnchor="middle"
        fill="#0F172A"
        letterSpacing="0.5"
      >
        BURKINA FASO
      </text>

      {/* Devise "La Patrie ou la Mort, nous vaincrons" */}
      <text
        x="50"
        y="95"
        fontSize="3.2"
        fontFamily="sans-serif"
        fontStyle="italic"
        textAnchor="middle"
        fill="#475569"
      >
        Unité - Progrès - Justice
      </text>
    </svg>
  );
}
