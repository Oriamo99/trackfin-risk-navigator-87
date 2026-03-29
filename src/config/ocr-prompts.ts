// ─── OCR Document Prompts ────────────────────────────────────────────────
// Single auto-detection prompt for Mistral OCR.
// The model detects the document type automatically.

export type DetectedDocumentType = 'cni' | 'passeport' | 'kbis' | 'justificatif_domicile' | 'autre';

export const DOCUMENT_TYPE_LABELS: Record<DetectedDocumentType, string> = {
  cni: 'CNI',
  passeport: 'Passeport',
  kbis: 'Kbis',
  justificatif_domicile: 'Justificatif',
  autre: 'Autre',
};

export const DOCUMENT_TYPE_COLORS: Record<DetectedDocumentType, string> = {
  cni: 'bg-blue-100 text-blue-800 border-blue-200',
  passeport: 'bg-blue-100 text-blue-800 border-blue-200',
  kbis: 'bg-purple-100 text-purple-800 border-purple-200',
  justificatif_domicile: 'bg-green-100 text-green-800 border-green-200',
  autre: 'bg-gray-100 text-gray-800 border-gray-200',
};

/**
 * Single universal prompt that auto-detects the document type and extracts
 * all relevant fields in one pass.
 */
export const AUTO_DETECT_PROMPT = `Tu es un assistant spécialisé dans l'analyse de documents d'identité et administratifs français.

Analyse ce document et réponds UNIQUEMENT avec un objet JSON valide (pas de texte autour, pas de backticks).

Étape 1 — Détecte le type de document parmi :
- "cni" (carte nationale d'identité française)
- "passeport" (passeport français ou étranger)
- "kbis" (extrait Kbis / registre du commerce)
- "justificatif_domicile" (facture, avis d'imposition, attestation de domicile)
- "autre" (tout autre document)

Étape 2 — Extrais les champs pertinents selon le type détecté.

Format de réponse attendu :

{
  "detected_type": "cni|passeport|kbis|justificatif_domicile|autre",
  "confidence": 0.95,
  "person_type": "physical|legal",
  "fields": {
    // Pour CNI / Passeport :
    "last_name": "nom de famille",
    "first_name": "1er prénom",
    "birth_date": "JJ/MM/AAAA",
    "birth_place": "lieu de naissance",
    "nationality": "nationalité",
    "gender": "M ou F",
    "document_type": "cni ou passeport",
    "document_number": "numéro unique du document",
    "expiry_date": "JJ/MM/AAAA",

    // Pour Kbis :
    "company_name": "raison sociale",
    "legal_form": "forme juridique",
    "siren": "numéro SIREN",
    "siret": "numéro SIRET",
    "address": "adresse du siège",
    "city": "ville",
    "postal_code": "code postal",
    "activity": "activité",
    "capital": "capital social",
    "representative_name": "représentant légal",
    "representative_position": "fonction",

    // Pour justificatif de domicile :
    "holder_name": "titulaire",
    "address": "adresse complète",
    "city": "ville",
    "postal_code": "code postal",
    "country": "pays"
  }
}

Règles :
- Utilise null pour tout champ non lisible ou absent
- N'inclus que les champs pertinents pour le type détecté
- person_type = "legal" si c'est un Kbis, sinon "physical"
- confidence = estimation de 0.0 à 1.0 de ta certitude sur le type détecté`;
