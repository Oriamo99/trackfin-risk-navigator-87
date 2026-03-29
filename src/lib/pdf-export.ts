import jsPDF from 'jspdf';
import type { AppSnapshot, Party, FundsDocumentChecks } from '@/types';
import { PPE_CATEGORIES } from '@/config/ppe';
import { partyQuestions, fundOriginQuestions } from '@/config/risk-questions';
import { calculateScore, getRiskLevel } from '@/config/risk-scoring';

// ─── Constants ────────────────────────────────────────────────────────────

const MARGIN = 15;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;
const PAGE_H = 297;
const BOTTOM_MARGIN = 20;
const MAX_Y = PAGE_H - BOTTOM_MARGIN;

// ─── Risk colors (R,G,B) ──────────────────────────────────────────────────

const RISK_COLORS: Record<string, [number, number, number]> = {
  Faible: [0, 128, 0],
  Modéré: [200, 100, 0],
  Élevé: [200, 0, 0],
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function ensureSpace(pdf: jsPDF, y: number, needed = 8): number {
  if (y + needed > MAX_Y) {
    pdf.addPage();
    addFooter(pdf);
    return 20;
  }
  return y;
}

function addFooter(pdf: jsPDF) {
  const pages = pdf.getNumberOfPages();
  pdf.setPage(pages);
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    `Document généré automatiquement le ${new Date().toLocaleString('fr-FR')} — Page ${pages}`,
    MARGIN,
    PAGE_H - 8
  );
  pdf.setTextColor(0, 0, 0);
}

function addPageTitle(pdf: jsPDF, title: string): number {
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 60, 120);
  pdf.text(title, MARGIN, 20);
  pdf.setDrawColor(30, 60, 120);
  pdf.line(MARGIN, 23, PAGE_W - MARGIN, 23);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  return 30;
}

function addSectionHeader(pdf: jsPDF, text: string, y: number): number {
  y = ensureSpace(pdf, y, 12);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(50, 50, 50);
  pdf.text(text, MARGIN, y);
  pdf.setDrawColor(200, 200, 200);
  pdf.line(MARGIN, y + 2, PAGE_W - MARGIN, y + 2);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  return y + 7;
}

function addRow(pdf: jsPDF, label: string, value: string, y: number): number {
  y = ensureSpace(pdf, y, 7);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text(label + ' :', MARGIN, y);
  pdf.setFont('helvetica', 'normal');
  const lines = pdf.splitTextToSize(value || '—', CONTENT_W - 55);
  pdf.text(lines, MARGIN + 55, y);
  return y + lines.length * 5 + 2;
}

function addRiskBadge(pdf: jsPDF, level: string, x: number, y: number) {
  const color = RISK_COLORS[level] ?? [100, 100, 100];
  pdf.setFontSize(9);
  pdf.setTextColor(...color);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`[${level}]`, x, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
}

function formatDateFR(isoDate: string): string {
  if (!isoDate) return new Date().toLocaleDateString('fr-FR');
  try {
    return new Date(isoDate).toLocaleDateString('fr-FR');
  } catch {
    return isoDate;
  }
}

function drawTable(
  pdf: jsPDF,
  headers: string[],
  rows: string[][],
  colWidths: number[],
  startY: number
): number {
  const cellPadding = 3;
  const lineHeight = 4.5;
  const fontSize = 8;
  let y = startY;

  pdf.setFontSize(fontSize);

  // ─── Header row ────────────────────────────────────────────
  y = ensureSpace(pdf, y, 10);
  const headerHeight = 8;
  let x = MARGIN;

  for (let i = 0; i < headers.length; i++) {
    pdf.setFillColor(30, 60, 120);
    pdf.setDrawColor(30, 60, 120);
    pdf.rect(x, y, colWidths[i], headerHeight, 'FD');

    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text(headers[i], x + cellPadding, y + headerHeight / 2 + 1);
    x += colWidths[i];
  }
  y += headerHeight;

  // Reset for data rows
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');

  // ─── Data rows ─────────────────────────────────────────────
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];

    // Calculate the height needed for this row
    let maxLines = 1;
    const cellLines: string[][] = [];
    for (let i = 0; i < row.length; i++) {
      const availableWidth = colWidths[i] - cellPadding * 2;
      const lines = pdf.splitTextToSize(row[i] || '\u2014', Math.max(availableWidth, 10));
      cellLines.push(lines);
      maxLines = Math.max(maxLines, lines.length);
    }
    const rowHeight = Math.max(8, maxLines * lineHeight + cellPadding * 2);

    y = ensureSpace(pdf, y, rowHeight + 2);

    // Draw each cell
    x = MARGIN;
    for (let i = 0; i < row.length; i++) {
      // Set fill color BEFORE rect for every cell
      if (rowIdx % 2 === 0) {
        pdf.setFillColor(245, 247, 250);
      } else {
        pdf.setFillColor(255, 255, 255);
      }
      pdf.setDrawColor(220, 220, 220);

      pdf.rect(x, y, colWidths[i], rowHeight, 'FD');

      // Text
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', 'normal');

      const textY = y + cellPadding + lineHeight * 0.6;
      for (let lineIdx = 0; lineIdx < cellLines[i].length; lineIdx++) {
        pdf.text(
          cellLines[i][lineIdx],
          x + cellPadding,
          textY + lineIdx * lineHeight
        );
      }

      x += colWidths[i];
    }

    y += rowHeight;
  }

  // Reset state for subsequent content
  pdf.setDrawColor(0, 0, 0);
  pdf.setFillColor(255, 255, 255);
  pdf.setTextColor(0, 0, 0);

  return y + 5;
}

function getPartyLabel(party: Party): string {
  if (party.personType === 'physical') {
    const name = `${party.physicalPerson.firstName} ${party.physicalPerson.lastName}`.trim();
    return name || 'Sans nom';
  }
  return party.legalEntity.companyName || 'Sans nom';
}

// ─── Section builders ─────────────────────────────────────────────────────

function buildPage1Header(pdf: jsPDF, snapshot: AppSnapshot) {
  const { transactionType, propertyType } = snapshot.global.transactionInfo;

  // Main title block
  pdf.setFillColor(30, 60, 120);
  pdf.rect(0, 0, PAGE_W, 50, 'F');

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('TRACKFIN', PAGE_W / 2, 18, { align: 'center' });
  pdf.setFontSize(11);
  pdf.text('ÉVALUATION DES RISQUES DE BLANCHIMENT', PAGE_W / 2, 28, { align: 'center' });
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, PAGE_W / 2, 38, { align: 'center' });

  pdf.setTextColor(0, 0, 0);

  let y = 65;
  y = addSectionHeader(pdf, 'INFORMATIONS DE LA TRANSACTION', y);

  const txLabels: Record<string, string> = {
    vente: 'Vente', location: 'Location',
  };
  const propLabels: Record<string, string> = {
    maison: 'Maison', appartement: 'Appartement', garage: 'Garage',
    commerce: 'Commerce', terrain: 'Terrain', bureau: 'Bureau',
    entrepot: 'Entrepôt', autre: 'Autre',
  };

  y = addRow(pdf, 'Type de transaction', txLabels[transactionType] ?? transactionType, y);
  y = addRow(pdf, 'Type de bien', propLabels[propertyType] ?? propertyType, y);

  const vendorCount = snapshot.global.vendor.parties.length;
  const acquirerCount = snapshot.global.acquirer.parties.length;
  y = addRow(pdf, 'Nombre de vendeurs', String(vendorCount), y);
  y = addRow(pdf, "Nombre d'acquéreurs", String(acquirerCount), y);

  y += 6;

  // Score summary table on page 1
  y = addSectionHeader(pdf, 'SYNTHÈSE DES SCORES', y);
  const { assessments, totalScore, overallRisk } = snapshot.global.summary;

  const scoreRows = [
    [`Vendeurs (${vendorCount})`, `${assessments.vendor.score}/20`, assessments.vendor.level],
    [`Acquéreurs (${acquirerCount})`, `${assessments.acquirer.score}/20`, assessments.acquirer.level],
    ['Provenance des fonds', `${assessments.fundOrigin.score}/20`, assessments.fundOrigin.level],
    ['TOTAL', `${totalScore}/60`, overallRisk],
  ];

  y = ensureSpace(pdf, y, 40);
  y = addRow(pdf, 'Score total', `${totalScore}/60`, y);

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  const color = RISK_COLORS[overallRisk] ?? [100, 100, 100];
  pdf.setTextColor(...color);
  pdf.text(`Risque global : ${overallRisk}`, MARGIN, y);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  y += 8;

  y = drawTable(
    pdf,
    ['Catégorie', 'Score', 'Niveau'],
    scoreRows,
    [90, 30, 60],
    y
  );

  // Worst-case scoring note
  y += 2;
  pdf.setFontSize(7);
  pdf.setTextColor(130, 130, 130);
  pdf.text(
    'Le score de chaque section correspond au score le plus élevé parmi les parties (approche worst-case).',
    MARGIN,
    y
  );
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(9);
  y += 5;

  // Recommendation
  y += 4;
  y = addSectionHeader(pdf, 'RECOMMANDATION', y);
  const recommendations: Record<string, string> = {
    Faible: 'Transaction autorisée. Surveillance standard recommandée.',
    Modéré: 'Surveillance renforcée recommandée. Vérifications supplémentaires nécessaires.',
    Élevé: 'Transaction à haut risque. Enquête approfondie requise avant autorisation.',
  };
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...(RISK_COLORS[overallRisk] ?? [100, 100, 100]));
  const recLines = pdf.splitTextToSize(recommendations[overallRisk] ?? '', CONTENT_W);
  pdf.text(recLines, MARGIN, y);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
}

function buildSingleParty(
  pdf: jsPDF,
  party: Party,
  index: number,
  sideLabel: string,
  isAcquirer: boolean,
  y: number,
): number {
  const score = calculateScore(party.riskChecks, partyQuestions);
  const level = getRiskLevel(score);
  const label = getPartyLabel(party);

  // Sub-header for this party
  y = ensureSpace(pdf, y, 15);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 60, 120);
  pdf.text(`${sideLabel} ${index + 1} : ${label}`, MARGIN, y);
  pdf.setDrawColor(30, 60, 120);
  pdf.line(MARGIN, y + 2, PAGE_W - MARGIN, y + 2);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  y += 8;

  // Person type
  const personTypeLabel = party.personType === 'physical' ? 'Personne physique' : 'Personne morale';
  y = addRow(pdf, 'Type de personne', personTypeLabel, y);
  y += 2;

  if (party.personType === 'physical') {
    const p = party.physicalPerson;
    y = addSectionHeader(pdf, 'Identité', y);
    y = addRow(pdf, 'Nom', p.lastName, y);
    y = addRow(pdf, 'Prénom', p.firstName, y);
    y = addRow(pdf, 'Date de naissance', p.birthDate, y);
    y = addRow(pdf, 'Lieu de naissance', p.birthPlace, y);
    y = addRow(pdf, 'Nationalité', p.nationality, y);
    y = addRow(pdf, 'Résidence fiscale', p.fiscalResidence, y);
    if (isAcquirer) {
      y = addRow(pdf, 'Profession', p.profession, y);
      y = addRow(pdf, 'Revenus annuels', p.income, y);
    }
    y += 2;
    y = addSectionHeader(pdf, 'Coordonnées', y);
    y = addRow(pdf, 'Adresse', p.address, y);
    if (p.country) y = addRow(pdf, 'Pays', p.country, y);
    y = addRow(pdf, 'Ville', p.city, y);
    y = addRow(pdf, 'Code postal', p.postalCode, y);
    y = addRow(pdf, 'Téléphone', p.phone, y);
    y = addRow(pdf, 'Email', p.email, y);
    y += 2;
    y = addSectionHeader(pdf, "Pièce d'identité", y);
    const idLabels: Record<string, string> = { cni: "Carte d'identité", passeport: 'Passeport' };
    y = addRow(pdf, "Type de pièce", idLabels[p.idDocument] ?? p.idDocument, y);
    y = addRow(pdf, "Numéro", p.idNumber, y);
  } else {
    const e = party.legalEntity;
    y = addSectionHeader(pdf, 'Personne morale', y);
    y = addRow(pdf, 'Raison sociale', e.companyName, y);
    y = addRow(pdf, 'Forme juridique', e.legalForm, y);
    y = addRow(pdf, 'N° SIRET', e.siret, y);
    if (isAcquirer && e.activity) y = addRow(pdf, "Secteur d'activité", e.activity, y);
    y = addRow(pdf, 'Résidence fiscale', e.fiscalResidence, y);
    y += 2;
    y = addSectionHeader(pdf, 'Siège social', y);
    y = addRow(pdf, 'Adresse', e.address, y);
    if (e.country) y = addRow(pdf, 'Pays', e.country, y);
    y = addRow(pdf, 'Ville', e.city, y);
    y = addRow(pdf, 'Code postal', e.postalCode, y);
    y = addRow(pdf, 'Téléphone', e.phone, y);
    y = addRow(pdf, 'Email', e.email, y);
    y += 2;
    y = addSectionHeader(pdf, 'Représentant légal', y);
    y = addRow(pdf, 'Nom', e.representativeName, y);
    y = addRow(pdf, 'Fonction', e.representativePosition, y);
  }

  // Documents analysés (OCR)
  y += 2;
  y = addSectionHeader(pdf, 'Documents analysés', y);

  const docs = party.ocrDocuments ?? [];
  if (docs.length === 0) {
    y = addRow(pdf, 'Documents', 'Aucun document analysé', y);
  } else {
    const typeLabels: Record<string, string> = {
      cni: "Carte nationale d'identité",
      passeport: 'Passeport',
      kbis: 'Extrait Kbis',
      justificatif_domicile: 'Justificatif de domicile',
      autre: 'Autre document',
    };
    for (const doc of docs) {
      const label = typeLabels[doc.detectedType] ?? doc.detectedType;
      const date = new Date(doc.processedAt).toLocaleString('fr-FR');
      const conf = Math.round(doc.confidence * 100);
      y = addRow(pdf, label, `${doc.fileName} — confiance ${conf}% — analysé le ${date}`, y);
    }
  }

  // Risk checks
  y += 2;
  y = addSectionHeader(pdf, 'Évaluation des risques', y);

  const checkRows = partyQuestions.map(q => {
    const val = party.riskChecks[q.id] ?? false;
    const response = q.invertedLogic
      ? (val ? 'Oui (conforme)' : 'Non (risque)')
      : (val ? 'Oui (risque)' : 'Non (conforme)');
    return [q.label, response, q.risk];
  });
  y = drawTable(pdf, ['Critère', 'Réponse', 'Risque'], checkRows, [90, 50, 40], y);

  // ─── Vérifications automatisées ────────────────────────────────────────

  if (party.verificationResult?.completedAt) {
    y += 2;
    y = addSectionHeader(pdf, 'Vérifications LCB-FT automatisées', y);

    const vr = party.verificationResult;

    // Sanctions DG Trésor
    const sanctionsLabel =
      vr.sanctions.status === 'clear' ? '✓ Aucune correspondance'
      : vr.sanctions.status === 'hit' ? `✗ ${vr.sanctions.matches.length} correspondance(s) trouvée(s)`
      : vr.sanctions.status === 'error' ? '⚠ Erreur de vérification'
      : '— Non vérifiée';
    y = addRow(pdf, 'Sanctions DG Trésor', sanctionsLabel, y);
    if (vr.sanctions.checkedAt) {
      y = addRow(pdf, 'Date vérification sanctions', new Date(vr.sanctions.checkedAt).toLocaleString('fr-FR'), y);
    }

    if (vr.sanctions.status === 'hit' && vr.sanctions.matches.length > 0) {
      for (const match of vr.sanctions.matches.slice(0, 5)) {
        const name = [match.lastName, match.firstName, match.entityName].filter(Boolean).join(' ');
        y = addRow(pdf, '  Correspondance', `${name} (${match.nature})`, y);
      }
      if (vr.sanctions.matches.length > 5) {
        y = addRow(pdf, '', `... et ${vr.sanctions.matches.length - 5} autre(s)`, y);
      }
    }

    if (vr.sanctions.status === 'error') {
      y = addRow(pdf, 'Note', `Erreur : ${vr.sanctions.errorMessage ?? 'connexion échouée'}. Vérification manuelle requise.`, y);
    }

    // GAFI
    const gafiLabel =
      vr.gafi.listType === 'black' ? `✗ Liste noire GAFI — ${vr.gafi.country}`
      : vr.gafi.listType === 'grey' ? `⚠ Liste grise GAFI — ${vr.gafi.country}`
      : vr.gafi.checkedAt ? '✓ Aucun pays à risque'
      : '— Non vérifiée';
    y = addRow(pdf, 'Pays à risque GAFI', gafiLabel, y);
    if (vr.gafi.checkedAt) {
      y = addRow(pdf, 'Date vérification GAFI', new Date(vr.gafi.checkedAt).toLocaleString('fr-FR'), y);
    }

    // PPE
    const ppeLabel =
      vr.ppe.status === 'declared' ? '✗ PPE déclarée'
      : vr.ppe.checkedAt ? '✓ Non PPE'
      : '— Non déclarée';
    y = addRow(pdf, 'Personne Politiquement Exposée', ppeLabel, y);
    if (vr.ppe.status === 'declared' && vr.ppe.declaration) {
      if (vr.ppe.declaration.categoryId) {
        const cat = PPE_CATEGORIES.find(c => c.id === vr.ppe.declaration.categoryId);
        y = addRow(pdf, '  Catégorie PPE', cat?.label ?? vr.ppe.declaration.categoryId, y);
      }
      if (vr.ppe.declaration.relationship) {
        const relLabels: Record<string, string> = {
          direct: 'Directement PPE',
          family: 'Membre de la famille',
          associate: 'Personne associée',
        };
        y = addRow(pdf, '  Relation', relLabels[vr.ppe.declaration.relationship] ?? vr.ppe.declaration.relationship, y);
      }
      if (vr.ppe.declaration.details) {
        y = addRow(pdf, '  Détails', vr.ppe.declaration.details, y);
      }
    }
    if (vr.ppe.checkedAt) {
      y = addRow(pdf, 'Date déclaration PPE', new Date(vr.ppe.checkedAt).toLocaleString('fr-FR'), y);
    }

    y += 2;
  }

  // Individual score
  y += 4;
  y = ensureSpace(pdf, y, 10);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Score individuel : ${score}/20`, MARGIN, y);
  addRiskBadge(pdf, level, MARGIN + 55, y);
  pdf.setFont('helvetica', 'normal');
  y += 8;

  return y;
}

function buildPartySectionPages(
  pdf: jsPDF,
  snapshot: AppSnapshot,
  side: 'vendor' | 'acquirer'
) {
  pdf.addPage();
  addFooter(pdf);

  const parties = snapshot.global[side].parties;
  const sideLabel = side === 'vendor' ? 'VENDEUR' : 'ACQUÉREUR';
  const isAcquirer = side === 'acquirer';

  let y = addPageTitle(pdf, `SECTION ${sideLabel}${parties.length > 1 ? 'S' : ''} (${parties.length})`);

  parties.forEach((party, idx) => {
    // If not the first party and we're past half the page, start a new page
    if (idx > 0) {
      y = ensureSpace(pdf, y, 80); // Need at least ~80mm for a party section
    }
    y = buildSingleParty(pdf, party, idx, sideLabel, isAcquirer, y);
  });

  // Section-level score (max)
  const scores = parties.map(p => calculateScore(p.riskChecks, partyQuestions));
  const maxScore = Math.max(0, ...scores);
  const maxLevel = getRiskLevel(maxScore);

  y = ensureSpace(pdf, y, 15);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setFillColor(240, 240, 245);
  pdf.rect(MARGIN, y - 5, CONTENT_W, 12, 'F');
  pdf.setDrawColor(30, 60, 120);
  pdf.rect(MARGIN, y - 5, CONTENT_W, 12, 'S');
  const sectionLbl = side === 'vendor' ? 'vendeurs' : 'acquéreurs';
  pdf.text(`Score global ${sectionLbl} (max) : ${maxScore}/20`, MARGIN + 3, y + 2);
  addRiskBadge(pdf, maxLevel, MARGIN + 105, y + 2);
  pdf.setFont('helvetica', 'normal');
}

function buildFundPage(pdf: jsPDF, snapshot: AppSnapshot) {
  pdf.addPage();
  addFooter(pdf);

  const { data, checks } = snapshot.fund;
  let y = addPageTitle(pdf, 'PROVENANCE DES FONDS');

  y = addSectionHeader(pdf, 'Informations financières', y);

  const paymentLabels: Record<string, string> = {
    cheque: 'Chèque', virement: 'Virement bancaire', especes: 'Espèces', autre: 'Autre',
  };
  const originLabels: Record<string, string> = {
    salaire: 'Salaire', heritage: 'Héritage', vente_bien: 'Vente de bien',
    epargne: 'Épargne', investissement: 'Investissement',
    pret_bancaire: 'Prêt bancaire', autre: 'Autre',
  };

  const cleanAmount = (data.transactionAmount || '').replace(/[\u00A0\u202F]/g, ' ').trim();
  y = addRow(pdf, 'Montant de la transaction', cleanAmount ? `${cleanAmount} €` : '—', y);
  y = addRow(pdf, 'Mode de paiement', paymentLabels[data.paymentMethod] ?? data.paymentMethod, y);
  y = addRow(pdf, 'Origine des fonds', originLabels[data.originDescription] ?? data.originDescription, y);
  y = addRow(pdf, 'Prêt bancaire', data.bankLoan === 'oui' ? 'Oui' : data.bankLoan === 'non' ? 'Non' : '—', y);
  if (data.bankLoan === 'oui') {
    y = addRow(pdf, 'Banque prêteuse', data.lenderBank, y);
  }

  if (data.bankDetails) {
    y += 3;
    y = addSectionHeader(pdf, 'Détails bancaires', y);
    y = addRow(pdf, 'Détails', data.bankDetails, y);
  }

  if (data.justificationDocuments) {
    y += 3;
    y = addSectionHeader(pdf, 'Documents justificatifs', y);
    y = addRow(pdf, 'Documents', data.justificationDocuments, y);
  }

  // Funds document checklist
  y += 3;
  y = addSectionHeader(pdf, 'Justificatifs de provenance des fonds', y);

  const fundsDocChecks: FundsDocumentChecks = snapshot.fund.documentChecks;
  const fundsDocItems: Array<{ key: keyof FundsDocumentChecks; label: string }> = [
    { key: 'pretBancaire', label: 'Prêt bancaire' },
    { key: 'acteVente', label: "Vente d'un autre bien" },
    { key: 'epargnePersonnelle', label: 'Épargne personnelle' },
    { key: 'donation', label: 'Donation' },
    { key: 'succession', label: 'Succession / héritage' },
    { key: 'fondsEtranger', label: "Fonds provenant de l'étranger" },
    { key: 'apportSociete', label: 'Apport société' },
    { key: 'autre', label: 'Autre source de financement' },
  ];

  for (const item of fundsDocItems) {
    const checked = fundsDocChecks[item.key];
    y = addRow(pdf, item.label, checked ? '✓ Fourni' : '✗ Non fourni', y);
  }

  if (fundsDocChecks.autre && fundsDocChecks.autreDetail) {
    y = addRow(pdf, 'Détail autre source', fundsDocChecks.autreDetail, y);
  }

  // Risk checks
  y += 3;
  y = addSectionHeader(pdf, 'Évaluation des risques — provenance des fonds', y);

  const checkRows = fundOriginQuestions.map(q => {
    const val = checks[q.id] ?? false;
    const response = q.invertedLogic
      ? (val ? 'Oui (conforme)' : 'Non (risque)')
      : (val ? 'Oui (risque)' : 'Non (conforme)');
    return [q.label, response, q.risk];
  });
  y = drawTable(pdf, ['Critère', 'Réponse', 'Risque'], checkRows, [90, 50, 40], y);

  // Score
  y += 4;
  const assessment = snapshot.global.summary.assessments.fundOrigin;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Score de risque provenance des fonds : ', MARGIN, y);
  pdf.setFont('helvetica', 'normal');
  addRiskBadge(pdf, assessment.level, MARGIN + 108, y);
  pdf.setFontSize(10);
  pdf.text(`${assessment.score}/20`, MARGIN + 140, y);
}

function buildSignaturePage(pdf: jsPDF, snapshot: AppSnapshot) {
  pdf.addPage();
  addFooter(pdf);

  let y = addPageTitle(pdf, 'VALIDATION DU RAPPORT');

  const date = formatDateFR(new Date().toISOString());
  const redactor = snapshot.documentInfo.redactorName || '___________________________';

  y = addRow(pdf, 'Rédigé par', redactor, y);
  y = addRow(pdf, 'Date', date, y);

  // Signature manuscrite
  if (snapshot.documentInfo.signature) {
    y += 5;
    y = ensureSpace(pdf, y, 35);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Signature :', MARGIN, y);
    pdf.setFont('helvetica', 'normal');
    y += 3;

    try {
      pdf.addImage(snapshot.documentInfo.signature, 'PNG', MARGIN, y, 60, 25);
      y += 28;
    } catch {
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('(signature non disponible)', MARGIN, y + 5);
      pdf.setTextColor(0, 0, 0);
      y += 10;
    }
  }

  y += 10;

  // Mention légale
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  const legalText = [
    "Ce rapport a été généré dans le cadre des obligations de vigilance LCB-FT",
    "prévues par les articles L.561-1 et suivants du Code monétaire et financier.",
    "Il doit être conservé pendant 5 ans conformément à l'article L.561-12 du CMF.",
  ];
  for (const line of legalText) {
    y = ensureSpace(pdf, y, 5);
    pdf.text(line, MARGIN, y);
    y += 4;
  }
  pdf.setTextColor(0, 0, 0);
}

// ─── Main export function ─────────────────────────────────────────────────

/**
 * Génère le PDF TRACKFIN et retourne le blob + le nom de fichier suggéré.
 * Ne déclenche PAS de téléchargement automatique.
 */
export function generatePDF(snapshot: AppSnapshot): { blob: Blob; fileName: string } {
  const pdf = new jsPDF('p', 'mm', 'a4');

  // Page 1 — En-tête + synthèse
  buildPage1Header(pdf, snapshot);
  addFooter(pdf);

  // Vendeur(s)
  buildPartySectionPages(pdf, snapshot, 'vendor');

  // Acquéreur(s)
  buildPartySectionPages(pdf, snapshot, 'acquirer');

  // Provenance des fonds
  buildFundPage(pdf, snapshot);

  // Signatures
  buildSignaturePage(pdf, snapshot);

  const fileName = `TRACKFIN_Evaluation_${new Date().toISOString().split('T')[0]}.pdf`;

  const blob = pdf.output('blob');
  return { blob, fileName };
}

/** Déclenche le téléchargement d'un blob dans le navigateur. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
