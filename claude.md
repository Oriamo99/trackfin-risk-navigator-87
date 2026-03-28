# TRACFIN Risk Navigator

## Project Overview

TRACFIN Risk Navigator is a French anti-money laundering (AML) risk assessment tool for real estate agents. It generates PDF compliance reports (évaluation LCB-FT) from property transaction data, with automated sanctions/GAFI/PPE checks. The app is an **ephemeral PDF generator**: localStorage = temporary draft only, PDF is the deliverable, sent to Apimo CRM then data is cleared.

**Target users**: Real estate agents using Apimo CRM in France.
**Language**: All UI text is in French. Code comments and variable names in English.

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite 5
- **UI**: shadcn/ui + Tailwind CSS 3 + Radix UI primitives
- **State**: React hooks + localStorage persistence (drafts only)
- **Forms**: zod + react-hook-form (mode: "onBlur")
- **PDF**: jsPDF (structured generation, NOT html2canvas)
- **External APIs**: Apimo CRM (REST, Basic Auth), DG Trésor gels-avoirs (public API)
- **Package manager**: npm
- **Linting**: ESLint 9 + typescript-eslint

## Commands

```bash
npm install         # Install dependencies
npm run dev         # Dev server on port 8080
npm run build       # Production build
npm run lint        # Run ESLint
```

## Current Architecture

Prompts 1–6 completed: cleanup, restructure, component refactoring, data layer, validation, multi-party support. Prompts 7–11 pending: Apimo integration, automated verifications, PDF→Apimo flow, templates, polish.

```
src/
├── components/
│   ├── ui/                          # shadcn/ui primitives (only used ones)
│   ├── forms/
│   │   ├── PersonForm.tsx           # Shared form for physical/legal person
│   │   ├── DocumentUpload.tsx       # Reusable file upload with checkbox
│   │   └── CountrySelect.tsx        # Country selector
│   ├── assessment/
│   │   ├── PartyAssessment.tsx      # Generic vendor/acquirer assessment
│   │   ├── RiskAssessmentTable.tsx  # Risk evaluation table with RadioGroup
│   │   └── FundOriginAssessment.tsx
│   ├── verification/
│   │   ├── VerificationPanel.tsx    # Auto checks + manual fallback links
│   │   └── VerificationLink.tsx     # Single verification link row
│   ├── apimo/                       # [Prompt 7] Apimo integration
│   │   ├── ApimoSetup.tsx           # Credentials configuration screen
│   │   └── PropertySelector.tsx     # Property picker from Apimo
│   ├── summary/
│   │   ├── RiskSummary.tsx
│   │   └── SignatureBlock.tsx
│   └── layout/
│       └── Header.tsx
├── config/
│   ├── apimo.ts                     # [Prompt 7] Credentials resolution (env → sessionStorage)
│   ├── countries.ts                 # Country list (single source of truth)
│   ├── gafi-lists.ts               # [Prompt 8] GAFI black/grey lists + country aliases
│   ├── ppe.ts                      # [Prompt 8] PPE categories (art. R.561-18 CMF)
│   ├── risk-questions.ts           # Risk criteria definitions
│   ├── risk-scoring.ts             # Scoring logic + thresholds
│   └── verification-links.ts       # Official verification URLs
├── services/
│   ├── apimo.ts                    # [Prompt 7] Apimo REST API client
│   ├── apimo-mapper.ts            # [Prompt 7] Apimo → TRACFIN data mapping
│   ├── sanctions-check.ts         # [Prompt 8] DG Trésor API client + matching
│   ├── verification-service.ts    # [Prompt 8] Orchestrator: sanctions + GAFI + PPE
│   └── pdf-export.ts              # Structured PDF generation with jsPDF
├── hooks/
│   ├── useLocalStorage.ts
│   ├── useGlobalData.ts            # Typed global state
│   ├── useRiskScore.ts             # Centralized scoring hook
│   └── useVerification.ts         # [Prompt 8] Auto-verification with debounce
├── types/
│   └── index.ts                    # All TypeScript interfaces
├── lib/
│   └── utils.ts                    # cn() utility
├── pages/
│   ├── Index.tsx                   # Main page: setup → select → form flow
│   └── NotFound.tsx
├── App.tsx
├── main.tsx
└── index.css
```

## App Flow

```
1. Apimo not configured → ApimoSetup screen
2. Apimo configured, no property selected → PropertySelector screen
3. Property selected (or manual mode) → TRACFIN form (4 tabs)
   a. Auto-verifications run on party data (sanctions, GAFI, PPE)
   b. Agent reviews, completes form, generates PDF
   c. PDF sent to Apimo → localStorage cleared → back to selector
```

Manual mode (no Apimo) is always available as fallback.

## Apimo Integration [Prompt 7]

- **API**: `https://api.apimo.pro` — REST, JSON, HTTP Basic Auth (`provider_id:token`)
- **Credentials priority**: (1) env vars `VITE_APIMO_*` in `.env.local`, (2) sessionStorage (cleared on browser close), (3) not configured → show setup screen
- **Endpoints used**: `/agencies/{id}/properties` (list/detail), `/agencies/{id}/contacts`, `/agencies/{id}/properties/{id}/documents` (upload PDF)
- **Mapper**: `apimo-mapper.ts` converts Apimo data to TRACFIN form fields. Must be fault-tolerant (optional chaining everywhere, never crash on missing fields).
- **NEVER store Apimo credentials in localStorage** — use sessionStorage or env vars only.

## Automated Verifications [Prompt 8]

Three mandatory LCB-FT checks per party:

1. **DG Trésor sanctions** — Public API at `https://gels-avoirs.dgtresor.gouv.fr/ApiPublic/api/v1/publication/derniere-publication-flux-json`. No auth required. Full registry downloaded once and cached in memory (module-level variable, NOT localStorage). Matching by normalized name (case-insensitive, accent-insensitive). CORS fallback: manual link + screenshot upload.

2. **GAFI lists** — Static config in `gafi-lists.ts`. Black list (Iran, North Korea, Myanmar) and grey list (~22 countries). Updated manually 3× per year. Includes country aliases (e.g., "Birmanie" → "Myanmar"). Show warning if lists are >6 months old.

3. **PPE declaration** — Declarative only (no public database). Categories from art. R.561-18 CMF. Includes family members and associates.

Verifications trigger automatically: sanctions on name change (1s debounce), GAFI on nationality change (instant), PPE is manual. Results are timestamped and included in PDF as compliance proof.

Auto-flagging: verification results pre-check corresponding risk questions in RiskAssessmentTable (agent can override).

## Scoring Rules

Scores are on a 0–20 scale per category. Thresholds:
- **0 points** → Faible (green)
- **1–5 points** → Modéré (yellow)
- **6+ points** → Élevé (red)

Global score = sum of 3 categories, max 60. Global thresholds:
- **0–5** → Faible
- **6–15** → Modéré
- **16+** → Élevé

Display: "{score}/20" per category, "{totalScore}/60" for global.

## Remaining Prompts

| Prompt | Status | Focus |
|--------|--------|-------|
| 1–3 | ✅ Done | Cleanup, restructure, component refactoring |
| 4 | ✅ Done | Data layer + PDF export (jsPDF) |
| 5 | ✅ Done | Zod validation + react-hook-form |
| 6 | ✅ Done | Multi-vendor/acquirer support |
| 7 | ✅ Done | Apimo integration (read + pre-fill) |
| 8 | 🔲 | Automated verifications (DG Trésor, GAFI, PPE) |
| 9 | 🔲 | PDF → Apimo upload → cleanup flow |
| 10 | 🔲 | Risk profile detection + fast mode |
| 11 | 🔲 | Polish, responsive, beforeunload, tests |

## Code Conventions

- `RadioGroup` from Radix for exclusive yes/no choices, never double Checkboxes.
- All scoring logic in `src/config/risk-scoring.ts`. Components call the hook, never reimplement.
- File uploads use `DocumentUpload` component. No inline upload logic.
- Country/nationality fields use the shared country list from config.
- Format amounts with `Intl.NumberFormat('fr-FR')`.
- Every required field has Zod validation via react-hook-form (mode: "onBlur").
- Components under 200 lines. Extract sub-components if longer.
- Named exports for non-page components.
- No `any` types. Use proper interfaces or `unknown` with type guards.
- All API calls wrapped in try/catch with user-friendly error messages in French.
- External API services are singletons (class instances exported from service files).

## Things to NEVER do

- Do NOT use html2canvas for PDF generation.
- Do NOT duplicate component logic between vendor and acquirer.
- Do NOT hardcode country lists or GAFI lists inside components.
- Do NOT use two Checkbox components to simulate a radio button.
- Do NOT add shadcn/ui components that are not actively used.
- Do NOT store File objects in localStorage (not serializable).
- Do NOT store Apimo credentials in localStorage (use sessionStorage or env vars).
- Do NOT store the DG Trésor registry in localStorage (too large, use memory cache).
- Do NOT block the app if an external API fails — always provide manual fallback.
- Do NOT use `any` type — use typed interfaces or `unknown` with guards.