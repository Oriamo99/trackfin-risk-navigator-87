# TRACKFIN Risk Navigator

Outil d'évaluation des risques de blanchiment de capitaux et de financement du terrorisme (LCB-FT) pour les agents immobiliers français.

## Fonctionnalités

- **Évaluation multi-parties** — Gestion de plusieurs vendeurs et acquéreurs par transaction, avec support des personnes physiques et morales
- **Intégration CRM Apimo** — Import automatique des biens et contacts depuis l'API Apimo
- **Analyse OCR** — Extraction automatique des données depuis les pièces d'identité (CNI, passeport, Kbis) via Mistral OCR
- **Vérifications LCB-FT** — Contrôle automatisé des listes de sanctions (DG Trésor / gel des avoirs), des pays à haut risque (GAFI liste noire et grise), et détection des Personnes Politiquement Exposées (PPE)
- **Scoring de risque** — Évaluation sur 60 points couvrant les vendeurs (20 pts), les acquéreurs (20 pts) et la provenance des fonds (20 pts)
- **Export PDF** — Génération d'un rapport conforme prêt à archiver, avec signature manuscrite et mention légale (art. L.561-1 et L.561-12 CMF)
- **Upload Apimo** — Envoi du rapport directement dans le dossier du bien sur le CRM

## Stack technique

- **Frontend** — React 18, TypeScript, Vite
- **UI** — shadcn/ui, Tailwind CSS, Radix UI
- **PDF** — jsPDF
- **OCR** — API Mistral (`mistral-ocr-latest`)
- **CRM** — API Apimo v2

## Installation

```bash
git clone <repo-url>
cd trackfin-risk-navigator
npm install
```

### Variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
VITE_APIMO_API_KEY=<clé API Apimo>
VITE_APIMO_AGENCY_ID=<ID agence Apimo>
VITE_MISTRAL_API_KEY=<clé API Mistral>
```

> **Sécurité** : ne jamais commiter les clés API. Le `.gitignore` exclut déjà `.env.local`.

## Développement

```bash
npm run dev       # Serveur de développement (http://localhost:8080)
npm run build     # Build de production
npm run lint      # ESLint
npm run test      # Tests unitaires (Vitest)
```

## Architecture

```
src/
├── app/routes/           # Pages (Index.tsx = page principale)
├── components/
│   ├── assessment/       # Composants d'évaluation (PartyAssessment, FundOriginAssessment, RiskSummary)
│   ├── documents/        # Zone de dépôt OCR (DocumentDropZone)
│   ├── forms/            # Formulaires (PersonForm, SignaturePad)
│   ├── verification/     # Vérifications automatisées (VerificationPanel)
│   ├── apimo/            # Sélection de bien Apimo (PropertySelector)
│   └── ui/               # Composants shadcn/ui
├── config/               # Critères de risque, scoring, listes GAFI, PPE
├── contexts/             # GlobalDataContext (état partagé)
├── hooks/                # Hooks personnalisés (useLocalStorage, useGlobalData)
├── lib/
│   ├── pdf-export.ts     # Génération du rapport PDF
│   └── utils.ts          # Utilitaires
├── services/
│   ├── apimo.ts          # Client API Apimo
│   ├── apimo-mapper.ts   # Mapping données Apimo → modèle interne
│   ├── document-ocr.ts   # Client OCR Mistral
│   ├── sanctions-check.ts # Client DG Trésor
│   └── verification-service.ts  # Vérifications DG Trésor, GAFI, PPE
└── types/                # Types TypeScript (Party, Transaction, etc.)
```

## Conformité réglementaire

Cette application aide les agents immobiliers à respecter leurs obligations au titre de :
- **Articles L.561-1 et suivants du Code monétaire et financier** — obligations de vigilance
- **Article L.561-12 du CMF** — conservation des documents pendant 5 ans
- **Articles L.561-15 et suivants du CMF** — déclaration de soupçon à TRACFIN

L'outil ne se substitue pas au jugement professionnel de l'agent. Les vérifications automatisées (sanctions, GAFI, PPE) sont des aides à la décision.

## Licence

Propriétaire — Tous droits réservés.
