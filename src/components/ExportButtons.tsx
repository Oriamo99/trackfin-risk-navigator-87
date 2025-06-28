
import { Button } from "@/components/ui/button";
import { Database, Save, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { generateCompleteTextContent, exportCompletePDF, exportPDFFromElement } from "@/utils/pdfExportUtils";

interface Assessment {
  score: number;
  level: string;
}

interface DocumentInfo {
  date: string;
  location: string;
  advisorSignature: string;
  managerSignature: string;
}

interface ExportButtonsProps {
  assessments: {
    vendor: Assessment;
    acquirer: Assessment;
    fundOrigin: Assessment;
  };
  totalScore: number;
  overallRisk: string;
  documentInfo: DocumentInfo;
  globalData: any;
  onFinalSave: () => void;
}

const ExportButtons = ({ 
  assessments, 
  totalScore, 
  overallRisk, 
  documentInfo, 
  globalData,
  onFinalSave 
}: ExportButtonsProps) => {
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

  const handleCompleteTextExport = () => {
    const completeContent = generateCompleteTextContent(globalData, assessments, totalScore, overallRisk, documentInfo);
    const textBlob = new Blob([completeContent], { type: 'text/plain;charset=utf-8' });
    const textUrl = URL.createObjectURL(textBlob);
    
    const link = document.createElement('a');
    link.href = textUrl;
    link.download = `TRACFIN_Evaluation_Complete_${documentInfo.date || new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    
    URL.revokeObjectURL(textUrl);
    toast.success("Export texte complet terminé avec succès !");
  };

  const handleCompletePDFExport = () => {
    exportCompletePDF(globalData, assessments, totalScore, overallRisk, documentInfo);
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

  const handleExportPDF = () => {
    exportPDFFromElement(documentInfo);
  };

  const handleSaveAs = () => {
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
    <div className="flex flex-wrap justify-center gap-4 pt-4">
      <Button onClick={onFinalSave} className="bg-blue-600 hover:bg-blue-700">
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
  );
};

export default ExportButtons;
