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

Prompts 1–8 completed: cleanup, restructure, component refactoring, data layer, validation, multi-party support, Apimo integration, automated verifications. Prompts 9–11 pending.

```
src/
├── app/
│   ├── App.tsx
│   ├── main.tsx
│   └── routes/
│       ├── Index.tsx                # Main page: select → form flow
│       └── NotFound.tsx
├── components/
│   ├── ui/                          # shadcn/ui primitives (only used ones)
│   ├── forms/
│   │   ├── PersonForm.tsx           # Shared form for physical/legal person
│   │   ├── DocumentUpload.tsx       # Reusable file upload with checkbox
│   │   └── CountrySelect.tsx        # Country selector
│   ├── assessment/
│   │   ├── PartyAssessment.tsx      # Generic vendor/acquirer assessment
│   │   ├── RiskAssessmentTable.tsx  # Risk evaluation table with RadioGroup + auto-flags
│   │   ├── FundOriginAssessment.tsx
│   │   └── RiskSummary.tsx
│   ├── verification/
│   │   ├── VerificationPanel.tsx    # Auto checks (sanctions, GAFI, PPE) + status bar
│   │   └── OfficialVerificationLinks.tsx  # Manual fallback links (collapsible)
│   ├── documents/
│   │   ├── DocumentDropZone.tsx       # File drop + OCR auto-detect per party
│   │   ├── ExtractionResult.tsx       # OCR extraction result display
│   │   └── FundsDocumentChecklist.tsx # Declarative checkboxes for fund proofs
│   └── apimo/
│       └── PropertySelector.tsx     # Property picker from Apimo
├── config/
│   ├── apimo.ts                     # Env vars only (VITE_APIMO_* in .env.local)
│   ├── countries.ts                 # Country list (single source of truth)
│   ├── gafi-lists.ts               # GAFI black/grey lists + country aliases + staleness check
│   ├── ocr-prompts.ts             # Mistral OCR prompts per document type
│   ├── ppe.ts                      # PPE categories (art. R.561-18 CMF)
│   ├── risk-questions.ts           # Risk criteria definitions
│   ├── risk-scoring.ts             # Scoring logic + thresholds
│   └── validation-schemas.ts       # Zod schemas for all forms
├── services/
│   ├── apimo.ts                    # Apimo REST API client (via Vite proxy in dev)
│   ├── apimo-mapper.ts            # Apimo → TRACFIN data mapping
│   ├── document-ocr.ts            # Mistral OCR client + field mappers
│   ├── sanctions-check.ts         # DG Trésor API client + name matching
│   └── verification-service.ts    # Orchestrator: sanctions + GAFI + PPE
├── hooks/
│   ├── useGlobalData.ts            # Typed global state
│   └── useVerification.ts         # Auto-verification with debounce
├── types/
│   ├── index.ts                    # All TypeScript interfaces + VerificationResult
│   └── apimo.ts                    # Apimo API response types
├── lib/
│   ├── utils.ts                    # cn() utility
│   └── pdf-export.ts              # Structured PDF generation with jsPDF
└── index.css
```

## App Flow

```
1. Apimo configured (.env.local) → PropertySelector → select property
2. TRACFIN form (4 tabs):
   a. Vendors tab: document drop zone (OCR auto-detect) + pre-filled form + auto-verifications
   b. Acquirers tab: same as vendors
   c. Funds tab: document checklist (declarative checkboxes) + risk questions
   d. Summary tab: review + PDF generation

If Apimo not configured → skip step 1, go directly to form
If Mistral OCR not configured → hide drop zones, manual entry only
```

## Apimo Integration [Prompt 7]

- **API**: `https://api.apimo.pro` — REST, JSON, HTTP Basic Auth (`provider_id:token`)
- **Credentials**: env vars only (`VITE_APIMO_*` in `.env.local`). No sessionStorage, no setup screen.
- **CORS**: Vite dev proxy at `/apimo-api` → `api.apimo.pro`. Production needs a backend proxy (`VITE_APIMO_PROXY_URL`).
- **Endpoints used**: `/agencies/{id}/properties` (list, filter `step=1`), `/agencies/{id}/properties/{id}` (detail), `/agencies/{id}/contacts/{id}` (single contact), `/agencies/{id}/properties/{id}/documents` (upload PDF)
- **Apimo referentials**: `category` = transaction type (1=Vente, 2=Location, etc.), `type` = property type (1=Appartement, 2=Maison, etc.). Contact `category`: "1"=particulier, "2"=couple, "3"=société. Property `owner`/`tenant` = contact ID (string), not embedded objects.
- **Mapper**: `apimo-mapper.ts` converts Apimo data to TRACFIN form fields. Must be fault-tolerant (optional chaining everywhere, never crash on missing fields).

## Automated Verifications [Prompt 8]

Three mandatory LCB-FT checks per party:

1. **DG Trésor sanctions** — Public API at `https://gels-avoirs.dgtresor.gouv.fr/ApiPublic/api/v1/publication/derniere-publication-flux-json`. No auth required. Full registry downloaded once and cached in memory (module-level variable, NOT localStorage). Matching by normalized name (case-insensitive, accent-insensitive). CORS fallback: manual link + screenshot upload.

2. **GAFI lists** — Static config in `gafi-lists.ts`. Black list (Iran, North Korea, Myanmar) and grey list (~22 countries). Updated manually 3× per year. Includes country aliases (e.g., "Birmanie" → "Myanmar"). Show warning if lists are >6 months old.

3. **PPE declaration** — Declarative only (no public database). Categories from art. R.561-18 CMF. Includes family members and associates.

Verifications trigger automatically: sanctions on name change (1s debounce), GAFI on nationality change (instant), PPE is manual. Results are timestamped and included in PDF as compliance proof.

Auto-flagging: verification results pre-check corresponding risk questions in RiskAssessmentTable (agent can override).

## Document Analysis (Mistral OCR)

- **API**: `https://api.mistral.ai/v1/ocr` — model `mistral-ocr-latest`
- **Auth**: Bearer token (`VITE_MISTRAL_API_KEY` in `.env.local`). Optional — app works without it.
- **CORS**: Vite dev proxy at `/mistral-api` → `api.mistral.ai`. Production needs `VITE_MISTRAL_PROXY_URL`.
- **Drop zones**: Integrated in vendor/acquirer tabs (not separate pages)
- **Auto-detection**: Single universal prompt detects doc type (CNI, passport, Kbis, proof of address) and person type (physical vs legal)
- **Extraction**: Structured JSON via `document_annotation_format: { type: "json_object" }`
- **Merge**: Fills only empty fields, never overwrites existing data. Kbis → switches to legal person. CNI/passport → switches to physical person.
- **Document checkbox auto-check**: CNI/passport → `pieceIdentite`, justificatif → `justificatifDomicile`, Kbis → `kbis`
- **Fields `idDocument` and `idNumber`**: Hidden from form, filled by OCR internally, included in PDF export.

## Funds Document Checklist

- Declarative checkboxes in Funds tab (no OCR)
- Documents: bank loan, property sale, personal savings, donation, inheritance, foreign funds, company contribution, other
- A bank balance attestation alone does NOT justify fund origin (DGCCRF-Tracfin 2018 guidelines)
- Stored in localStorage key `fundsDocumentChecks`
- Checklist data included in final PDF

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
| 8 | ✅ Done | Automated verifications (DG Trésor, GAFI, PPE) |
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
- Do NOT store Apimo credentials in localStorage or sessionStorage (use env vars only).
- Do NOT store the DG Trésor registry in localStorage (too large, use memory cache).
- Do NOT block the app if an external API fails — always provide manual fallback.
- Do NOT use `any` type — use typed interfaces or `unknown` with guards.
- Do NOT ask the user to select the document type — Mistral OCR auto-detects it.
- Do NOT create separate pages for document upload — drop zones are IN the form tabs.
- Do NOT block the app if Mistral OCR is not configured or fails.
- Do NOT overwrite non-empty fields when merging OCR results.
- Do NOT store uploaded files in localStorage — React state only.