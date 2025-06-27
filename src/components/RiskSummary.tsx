import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, AlertTriangle, CheckCircle, XCircle, Users, Building, Coins, FileText, Download, Save, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useGlobalData } from "@/hooks/useGlobalData";

interface Assessment {
  score: number;
  level: string;
}

interface RiskSummaryProps {
  assessments: {
    vendor: Assessment;
    acquirer: Assessment;
    fundOrigin: Assessment;
  };
  totalScore: number;
  overallRisk: string;
}

const RiskSummary = ({ assessments, totalScore, overallRisk }: RiskSummaryProps) => {
  const { globalData, updateSummaryData } = useGlobalData();
  const [documentInfo, setDocumentInfo] = useLocalStorage('riskSummaryDocumentInfo', {
    date: new Date().toISOString().split('T')[0],
    location: '',
    advisorSignature: '',
    managerSignature: ''
  });

  const categories = [
    {
      name: 'Vendeurs',
      icon: Users,
      ...assessments.vendor
    },
    {
      name: 'Acquéreurs',
      icon: Building,
      ...assessments.acquirer
    },
    {
      name: 'Provenance des fonds',
      icon: Coins,
      ...assessments.fundOrigin
    }
  ];

  const getRecommendation = (risk: string) => {
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

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'Faible':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Modéré':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'Élevé':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleDocumentInfoChange = (field: string, value: string) => {
    setDocumentInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleFinalSave = () => {
    // Sauvegarder toutes les données finales
    updateSummaryData({
      assessments,
      totalScore,
      overallRisk,
      documentInfo,
      finalSaveTimestamp: new Date().toISOString()
    });
    
    toast.success("Enregistrement final effectué avec succès ! Toutes les données ont été sauvegardées.");
  };

  const generateCompleteTextContent = () => {
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

  const handleCompleteTextExport = () => {
    const completeContent = generateCompleteTextContent();
    const textBlob = new Blob([completeContent], { type: 'text/plain;charset=utf-8' });
    const textUrl = URL.createObjectURL(textBlob);
    
    const link = document.createElement('a');
    link.href = textUrl;
    link.download = `TRACFIN_Evaluation_Complete_${documentInfo.date || new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    
    URL.revokeObjectURL(textUrl);
    toast.success("Export texte complet terminé avec succès !");
  };

  const handleCompletePDFExport = async () => {
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
      
      const completeText = generateCompleteTextContent();
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

  const handleSaveDocument = () => {
    const documentData = {
      assessments,
      totalScore,
      overallRisk,
      documentInfo,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(documentData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `tracfin_evaluation_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success("Document sauvegardé avec succès !");
  };

  const handleExportPDF = async () => {
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

  const handleSaveAs = () => {
    const documentData = {
      assessments,
      totalScore,
      overallRisk,
      documentInfo,
      timestamp: new Date().toISOString()
    };
    
    const textContent = `
TRACFIN - ÉVALUATION DES RISQUES
================================

Date: ${documentInfo.date}
Lieu: ${documentInfo.location}

RÉSULTATS DE L'ÉVALUATION
-------------------------
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

Document généré le: ${new Date().toLocaleString('fr-FR')}
    `.trim();
    
    const textBlob = new Blob([textContent], { type: 'text/plain' });
    const textUrl = URL.createObjectURL(textBlob);
    
    const link = document.createElement('a');
    link.href = textUrl;
    link.download = `TRACFIN_Evaluation_${documentInfo.date || new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    
    URL.revokeObjectURL(textUrl);
    toast.success("Document texte sauvegardé avec succès !");
  };

  return (
    <div className="space-y-6">
      <div id="risk-summary-content">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Résumé de l'évaluation des risques
            </CardTitle>
            <CardDescription>
              Synthèse complète de l'analyse de risque de blanchiment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">Niveau de risque</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <TableRow key={category.name}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {category.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {category.score}/6
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getRiskIcon(category.level)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              category.level === 'Faible' ? 'bg-green-100 text-green-800' :
                              category.level === 'Modéré' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {category.level}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="border-t pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-2">
                    <CardHeader className="text-center">
                      <CardTitle className="text-lg">Score Total</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{totalScore}/18</div>
                    </CardContent>
                  </Card>

                  <Card className={`border-2 ${
                    overallRisk === 'Faible' ? 'border-green-200 bg-green-50' :
                    overallRisk === 'Modéré' ? 'border-yellow-200 bg-yellow-50' :
                    'border-red-200 bg-red-50'
                  }`}>
                    <CardHeader className="text-center">
                      <CardTitle className="text-lg">Risque Global</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getRiskIcon(overallRisk)}
                        <span className="text-2xl font-bold">{overallRisk}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-900">Recommandation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-800 font-medium">{getRecommendation(overallRisk)}</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Finalisation du Document
            </CardTitle>
            <CardDescription>
              Informations et signatures pour la validation du rapport
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date de rédaction</Label>
                  <Input
                    id="date"
                    type="date"
                    value={documentInfo.date}
                    onChange={(e) => handleDocumentInfoChange('date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Lieu</Label>
                  <Input
                    id="location"
                    value={documentInfo.location}
                    onChange={(e) => handleDocumentInfoChange('location', e.target.value)}
                    placeholder="Ville, bureau..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-dashed border-2 border-gray-300">
                  <CardHeader className="text-center">
                    <CardTitle className="text-base">Signature du Conseiller</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Input
                        value={documentInfo.advisorSignature}
                        onChange={(e) => handleDocumentInfoChange('advisorSignature', e.target.value)}
                        placeholder="Nom et prénom du conseiller"
                      />
                      <div className="h-24 border-2 border-dashed border-gray-200 rounded bg-gray-50 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Zone de signature</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-dashed border-2 border-gray-300">
                  <CardHeader className="text-center">
                    <CardTitle className="text-base">Signature du Responsable</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Input
                        value={documentInfo.managerSignature}
                        onChange={(e) => handleDocumentInfoChange('managerSignature', e.target.value)}
                        placeholder="Nom et prénom du responsable"
                      />
                      <div className="h-24 border-2 border-dashed border-gray-200 rounded bg-gray-50 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Zone de signature</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap justify-center gap-4 pt-4">
        <Button onClick={handleFinalSave} className="bg-blue-600 hover:bg-blue-700">
          <Database className="h-4 w-4 mr-2" />
          Enregistrement final
        </Button>
        <Button onClick={handleSaveDocument} className="bg-green-600 hover:bg-green-700">
          <Save className="h-4 w-4 mr-2" />
          Enregistrer (JSON)
        </Button>
        <Button onClick={handleSaveAs} className="bg-yellow-600 hover:bg-yellow-700">
          <FileText className="h-4 w-4 mr-2" />
          Enregistrer (Résumé)
        </Button>
        <Button onClick={handleCompleteTextExport} className="bg-purple-600 hover:bg-purple-700">
          <FileText className="h-4 w-4 mr-2" />
          Export Texte Complet
        </Button>
        <Button onClick={handleExportPDF} className="bg-orange-600 hover:bg-orange-700">
          <Download className="h-4 w-4 mr-2" />
          PDF Résumé
        </Button>
        <Button onClick={handleCompletePDFExport} className="bg-red-600 hover:bg-red-700">
          <Download className="h-4 w-4 mr-2" />
          PDF Complet
        </Button>
      </div>
    </div>
  );
};

export default RiskSummary;
