
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from "sonner";

export interface DocumentInfo {
  date: string;
  location: string;
  advisorSignature: string;
  managerSignature: string;
}

export interface Assessment {
  score: number;
  level: string;
}

export interface GlobalAppData {
  vendor: any;
  acquirer: any;
  fundOrigin: any;
  transactionInfo: {
    transactionType: string;
    propertyType: string;
  };
}

export const getRecommendation = (risk: string) => {
  switch (risk) {
    case 'Faible':
      return 'Transaction autorisée. Surveillance standard recommandée.';
    case 'Modéré':
      return 'Surveillance renforcée recommandée. Vérifications supplémentaires nécessaires.';
    case 'Élevé':
      return 'Transaction à haut risque. Enquête approfondie requise avant autorisation.';
    default:
      return '';
  }
};

export const generateCompleteTextContent = (
  globalData: GlobalAppData,
  assessments: { vendor: Assessment; acquirer: Assessment; fundOrigin: Assessment },
  totalScore: number,
  overallRisk: string,
  documentInfo: DocumentInfo
) => {
  const vendorData = globalData.vendor;
  const acquirerData = globalData.acquirer;
  const fundData = globalData.fundOrigin;
  
  return `
TRACFIN - ÉVALUATION COMPLÈTE DES RISQUES
========================================

Date de génération: ${new Date().toLocaleString('fr-FR')}
Date de rédaction: ${documentInfo.date}
Lieu: ${documentInfo.location}

INFORMATIONS DE TRANSACTION
---------------------------
Type de transaction: ${globalData.transactionInfo?.transactionType || 'Non renseigné'}
Type de bien: ${globalData.transactionInfo?.propertyType || 'Non renseigné'}

=== SECTION VENDEURS ===
-----------------------
Informations vendeur:
${Object.entries(vendorData.vendorInfo || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Évaluation des risques vendeur:
${Object.entries(vendorData.riskAssessment || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Vérification officielle vendeur:
${Object.entries(vendorData.officialVerification || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Fichiers téléchargés vendeur: ${vendorData.uploadedFiles?.length || 0} fichier(s)

=== SECTION ACQUÉREURS ===
-------------------------
Informations acquéreur:
${Object.entries(acquirerData.acquirerInfo || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Évaluation des risques acquéreur:
${Object.entries(acquirerData.riskAssessment || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Vérification officielle acquéreur:
${Object.entries(acquirerData.officialVerification || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Fichiers téléchargés acquéreur: ${acquirerData.uploadedFiles?.length || 0} fichier(s)

=== SECTION PROVENANCE DES FONDS ===
-----------------------------------
Informations provenance des fonds:
${Object.entries(fundData.fundOriginInfo || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Évaluation des risques provenance:
${Object.entries(fundData.riskAssessment || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Fichiers téléchargés provenance: ${fundData.uploadedFiles?.length || 0} fichier(s)

=== RÉSUMÉ DE L'ÉVALUATION ===
-----------------------------
Vendeurs: ${assessments.vendor.score}/6 - ${assessments.vendor.level}
Acquéreurs: ${assessments.acquirer.score}/6 - ${assessments.acquirer.level}
Provenance des fonds: ${assessments.fundOrigin.score}/6 - ${assessments.fundOrigin.level}

SCORE TOTAL: ${totalScore}/18
RISQUE GLOBAL: ${overallRisk}

RECOMMANDATION: ${getRecommendation(overallRisk)}

SIGNATURES
----------
Conseiller: ${documentInfo.advisorSignature}
Responsable: ${documentInfo.managerSignature}

RÉSUMÉ DES FICHIERS TÉLÉCHARGÉS
------------------------------
Total fichiers vendeur: ${vendorData.uploadedFiles?.length || 0}
Total fichiers acquéreur: ${acquirerData.uploadedFiles?.length || 0}
Total fichiers provenance: ${fundData.uploadedFiles?.length || 0}
Total général: ${(vendorData.uploadedFiles?.length || 0) + (acquirerData.uploadedFiles?.length || 0) + (fundData.uploadedFiles?.length || 0)}

Document généré le: ${new Date().toLocaleString('fr-FR')}
  `.trim();
};

export const exportCompletePDF = async (
  globalData: GlobalAppData,
  assessments: { vendor: Assessment; acquirer: Assessment; fundOrigin: Assessment },
  totalScore: number,
  overallRisk: string,
  documentInfo: DocumentInfo
) => {
  try {
    toast.info("Génération du PDF complet en cours... Cela peut prendre quelques instants.");
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    
    // Page de titre
    pdf.setFontSize(20);
    pdf.text('TRACFIN - ÉVALUATION COMPLÈTE', pageWidth / 2, 30, { align: 'center' });
    pdf.setFontSize(16);
    pdf.text('LUTTE CONTRE LE BLANCHIMENT', pageWidth / 2, 45, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text(`Date: ${documentInfo.date}`, margin, 70);
    pdf.text(`Lieu: ${documentInfo.location}`, margin, 85);
    pdf.text(`Risque Global: ${overallRisk}`, margin, 100);
    pdf.text(`Score Total: ${totalScore}/18`, margin, 115);
    
    // Résumé des évaluations
    pdf.setFontSize(14);
    pdf.text('RÉSUMÉ DES ÉVALUATIONS', margin, 140);
    pdf.setFontSize(10);
    let yPos = 155;
    
    const categories = [
      { name: 'Vendeurs', ...assessments.vendor },
      { name: 'Acquéreurs', ...assessments.acquirer },
      { name: 'Provenance des fonds', ...assessments.fundOrigin }
    ];
    
    categories.forEach((category) => {
      pdf.text(`${category.name}: ${category.score}/6 - ${category.level}`, margin, yPos);
      yPos += 15;
    });
    
    // Recommandation
    yPos += 10;
    pdf.setFontSize(12);
    pdf.text('RECOMMANDATION:', margin, yPos);
    yPos += 15;
    pdf.setFontSize(10);
    const recommendation = getRecommendation(overallRisk);
    const splitRecommendation = pdf.splitTextToSize(recommendation, contentWidth);
    pdf.text(splitRecommendation, margin, yPos);
    
    // Nouvelle page pour les détails complets
    pdf.addPage();
    yPos = 30;
    
    pdf.setFontSize(14);
    pdf.text('DONNÉES COMPLÈTES', margin, yPos);
    yPos += 20;
    
    const completeText = generateCompleteTextContent(globalData, assessments, totalScore, overallRisk, documentInfo);
    pdf.setFontSize(8);
    const splitText = pdf.splitTextToSize(completeText, contentWidth);
    
    splitText.forEach((line: string) => {
      if (yPos > pageHeight - margin) {
        pdf.addPage();
        yPos = 30;
      }
      pdf.text(line, margin, yPos);
      yPos += 5;
    });
    
    // Page de signatures
    pdf.addPage();
    pdf.setFontSize(14);
    pdf.text('SIGNATURES', margin, 30);
    
    pdf.setFontSize(12);
    pdf.text('Conseiller:', margin, 60);
    pdf.text(documentInfo.advisorSignature || '___________________', margin, 75);
    
    pdf.text('Responsable:', margin, 110);
    pdf.text(documentInfo.managerSignature || '___________________', margin, 125);
    
    pdf.text(`Document généré le: ${new Date().toLocaleString('fr-FR')}`, margin, pageHeight - 30);
    
    const fileName = `TRACFIN_Evaluation_Complete_${documentInfo.date || new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    toast.success("PDF complet exporté avec succès !");
  } catch (error) {
    console.error('Erreur lors de l\'export PDF complet:', error);
    toast.error("Erreur lors de l'export PDF complet. Veuillez réessayer.");
  }
};

export const exportPDFFromElement = async (documentInfo: DocumentInfo) => {
  try {
    toast.info("Génération du PDF en cours...");
    
    const element = document.getElementById('risk-summary-content');
    if (!element) {
      toast.error("Impossible de trouver le contenu à exporter");
      return;
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      height: element.scrollHeight,
      width: element.scrollWidth
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 30;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    const fileName = `TRACFIN_Evaluation_${documentInfo.date || new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    toast.success("PDF exporté avec succès !");
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    toast.error("Erreur lors de l'export PDF. Veuillez réessayer.");
  }
};
