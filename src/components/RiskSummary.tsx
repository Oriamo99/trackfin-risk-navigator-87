
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, AlertTriangle, CheckCircle, XCircle, Users, Building, Coins, FileText, Download, Database } from "lucide-react";
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

  const handleCompletePDFExport = async () => {
    try {
      toast.info("Génération du PDF complet en cours... Cela peut prendre quelques instants.");
      
      // Capturer le contenu entier de la page visible
      const bodyElement = document.body;
      
      const canvas = await html2canvas(bodyElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: bodyElement.scrollHeight,
        width: bodyElement.scrollWidth,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 30000,
        onclone: (clonedDoc) => {
          // S'assurer que tous les styles sont copiés
          const clonedBody = clonedDoc.body;
          clonedBody.style.backgroundColor = '#ffffff';
          
          // Forcer l'affichage de tous les éléments cachés pour la capture
          const hiddenElements = clonedDoc.querySelectorAll('[style*="display: none"]');
          hiddenElements.forEach(el => {
            (el as HTMLElement).style.display = 'block';
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - (2 * margin);
      const contentHeight = pdfHeight - (2 * margin);
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(contentWidth / (imgWidth * 0.264583), contentHeight / (imgHeight * 0.264583));
      
      const scaledWidth = (imgWidth * 0.264583) * ratio;
      const scaledHeight = (imgHeight * 0.264583) * ratio;
      
      let yPosition = margin;
      let remainingHeight = scaledHeight;
      
      // En-tête du document
      pdf.setFontSize(16);
      pdf.text('TRACFIN - ÉVALUATION COMPLÈTE DES RISQUES', pdfWidth / 2, 15, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, pdfWidth / 2, 22, { align: 'center' });
      
      yPosition = 30;
      
      // Ajout de l'image capturée
      while (remainingHeight > 0) {
        const pageHeight = Math.min(remainingHeight, contentHeight - (yPosition - margin));
        
        pdf.addImage(
          imgData, 
          'PNG', 
          margin, 
          yPosition, 
          scaledWidth, 
          pageHeight,
          undefined,
          'FAST'
        );
        
        remainingHeight -= pageHeight;
        
        if (remainingHeight > 0) {
          pdf.addPage();
          yPosition = margin;
        }
      }
      
      // Page supplémentaire avec les détails des fichiers téléchargés
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.text('FICHIERS TÉLÉCHARGÉS', margin, 30);
      
      let currentY = 45;
      const vendorFiles = globalData.vendor.uploadedFiles || [];
      const acquirerFiles = globalData.acquirer.uploadedFiles || [];
      const fundFiles = globalData.fundOrigin.uploadedFiles || [];
      
      pdf.setFontSize(12);
      pdf.text('Fichiers Vendeur:', margin, currentY);
      currentY += 10;
      pdf.setFontSize(10);
      
      if (vendorFiles.length > 0) {
        vendorFiles.forEach((file: any) => {
          pdf.text(`• ${file.name || 'Fichier sans nom'} (${file.size ? Math.round(file.size / 1024) + ' KB' : 'Taille inconnue'})`, margin + 5, currentY);
          currentY += 7;
        });
      } else {
        pdf.text('• Aucun fichier téléchargé', margin + 5, currentY);
        currentY += 7;
      }
      
      currentY += 10;
      pdf.setFontSize(12);
      pdf.text('Fichiers Acquéreur:', margin, currentY);
      currentY += 10;
      pdf.setFontSize(10);
      
      if (acquirerFiles.length > 0) {
        acquirerFiles.forEach((file: any) => {
          pdf.text(`• ${file.name || 'Fichier sans nom'} (${file.size ? Math.round(file.size / 1024) + ' KB' : 'Taille inconnue'})`, margin + 5, currentY);
          currentY += 7;
        });
      } else {
        pdf.text('• Aucun fichier téléchargé', margin + 5, currentY);
        currentY += 7;
      }
      
      currentY += 10;
      pdf.setFontSize(12);
      pdf.text('Fichiers Provenance des fonds:', margin, currentY);
      currentY += 10;
      pdf.setFontSize(10);
      
      if (fundFiles.length > 0) {
        fundFiles.forEach((file: any) => {
          pdf.text(`• ${file.name || 'Fichier sans nom'} (${file.size ? Math.round(file.size / 1024) + ' KB' : 'Taille inconnue'})`, margin + 5, currentY);
          currentY += 7;
        });
      } else {
        pdf.text('• Aucun fichier téléchargé', margin + 5, currentY);
        currentY += 7;
      }
      
      // Page de signatures
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.text('SIGNATURES ET VALIDATION', margin, 30);
      
      pdf.setFontSize(12);
      pdf.text('Date:', margin, 60);
      pdf.text(documentInfo.date || '___________', margin + 30, 60);
      
      pdf.text('Lieu:', margin, 80);
      pdf.text(documentInfo.location || '___________', margin + 30, 80);
      
      pdf.text('Conseiller:', margin, 120);
      pdf.text(documentInfo.advisorSignature || '___________________', margin, 135);
      pdf.line(margin, 140, margin + 80, 140);
      
      pdf.text('Responsable:', margin, 170);
      pdf.text(documentInfo.managerSignature || '___________________', margin, 185);
      pdf.line(margin, 190, margin + 80, 190);
      
      pdf.setFontSize(10);
      pdf.text(`Document généré automatiquement le ${new Date().toLocaleString('fr-FR')}`, margin, pdfHeight - 15);
      
      const fileName = `TRACFIN_Evaluation_Complete_${documentInfo.date || new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success("PDF complet exporté avec succès ! Le document reflète fidèlement l'interface utilisateur.");
    } catch (error) {
      console.error('Erreur lors de l\'export PDF complet:', error);
      toast.error("Erreur lors de l'export PDF complet. Veuillez réessayer.");
    }
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
        <Button onClick={handleCompletePDFExport} className="bg-red-600 hover:bg-red-700">
          <Download className="h-4 w-4 mr-2" />
          PDF Complet
        </Button>
      </div>
    </div>
  );
};

export default RiskSummary;
