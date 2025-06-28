
import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useGlobalData } from "@/hooks/useGlobalData";
import { toast } from "sonner";
import RiskTable from "./RiskTable";
import DocumentInfoForm from "./DocumentInfoForm";
import ExportButtons from "./ExportButtons";

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

  return (
    <div className="space-y-6">
      <div id="risk-summary-content">
        <RiskTable 
          assessments={assessments}
          totalScore={totalScore}
          overallRisk={overallRisk}
        />
        <DocumentInfoForm 
          documentInfo={documentInfo}
          onDocumentInfoChange={handleDocumentInfoChange}
        />
      </div>

      <ExportButtons
        assessments={assessments}
        totalScore={totalScore}
        overallRisk={overallRisk}
        documentInfo={documentInfo}
        globalData={globalData}
        onFinalSave={handleFinalSave}
      />
    </div>
  );
};

export default RiskSummary;
