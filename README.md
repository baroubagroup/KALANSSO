# KALANSSO OS — MONOREPO OFFICIEL

> **Le Système d'Exploitation Intégré de l'Établissement Scolaire Africain**  
> *De la Crèche au Lycée & Supérieur • 100% Configurable • Résilient Hors-Ligne • Vert Nature & Motifs Africains*

---

## 🏗️ STRUCTURE DU MONOREPO

```
kalansso-os/
├── database/
│   ├── schema.sql             # Schéma PostgreSQL 16 pur (DDL, enums, tables, index)
│   ├── schema.prisma          # Modèle Prisma ORM pour développeurs TypeScript
│   └── README.md              # Guide Docker et migrations
│
├── apps/
│   ├── api/                   # Backend NestJS (REST API, Swagger, DTOs de validation)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── onboarding/# API de l'Assistant de Démarrage (Setup Wizard)
│   │   │   │   ├── finance/   # Guichet Caisse Express (< 15s) & Mobile Money
│   │   │   │   └── academics/ # Calcul délibérations & bulletins scellés QR Code
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── web-admin/             # Frontend Web Admin Next.js 15 (React 19 / Tailwind)
│       ├── src/
│       │   ├── app/
│       │   │   ├── setup-wizard/ # ASSISTANT D'INITIALISATION EN 5 ÉTAPES
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx      # Cockpit d'accueil et navigation
│       │   ├── components/
│       │   │   └── motifs/       # Motifs vectoriels Faso Dan Fani & Tiébélé
│       │   └── styles/
│       │       └── globals.css   # Tokens CSS Vert Nature (#1B4D3E)
│       ├── tailwind.config.ts
│       └── package.json
│
├── packages/
│   └── types/                 # Interfaces TypeScript partagées (@kalansso/types)
│       └── src/index.ts
│
├── package.json               # Racine npm workspaces
└── README.md
```

---

## ⚡ DÉMARRAGE RAPIDE EN DÉVELOPPEMENT

### 1. Installation des dépendances (Racine)
```bash
npm.cmd install
```

### 2. Lancement du Backend API (NestJS - Port 4000)
```bash
cd apps/api
npm.cmd run dev
# API disponible sur : http://localhost:4000/api/v1
# Documentation Swagger : http://localhost:4000/api/docs
```

### 3. Lancement du Frontend Web Admin (Next.js 15 - Port 3000)
```bash
cd apps/web-admin
npm.cmd run dev
# Web Admin disponible sur : http://localhost:3000
# Assistant de Démarrage direct : http://localhost:3000/setup-wizard
```

---

## 🎨 IDENTITÉ VISUELLE & ERGONOMIE (UI/UX PRO MAX)
- **Couleur Primaire :** `Vert Nature & Sécurité` (`#1B4D3E` et `#256B4C`), reposant pour les yeux.
- **Fond de Travail :** `#F5F8F6` (blanc végétal anti-fatigue).
- **Motifs Africains Subtils :** Filigranes géométriques authentiques inspirés du **Faso Dan Fani** et des fresques de **Tiébélé**.
