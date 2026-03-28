import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Shield, Users, Building, Coins, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import VendorAssessment from "@/components/VendorAssessment";
import AcquirerAssessment from "@/components/AcquirerAssessment";
import FundOriginAssessment from "@/components/FundOriginAssessment";
import RiskSummary from "@/components/RiskSummary";
import { useGlobalData } from "@/hooks/useGlobalData";

const Index = () => {
  const { globalData, updateTransactionInfo, updateSummaryData } = useGlobalData();
  const [assessments, setAssessments] = useState({
    vendor: { score: 0, level: 'Faible' },
    acquirer: { score: 0, level: 'Faible' },
    fundOrigin: { score: 0, level: 'Faible' }
  });

  const [transactionType, setTransactionType] = useState(globalData.transactionInfo.transactionType || '');
  const [propertyType, setPropertyType] = useState(globalData.transactionInfo.propertyType || '');

  useEffect(() => {
    updateTransactionInfo({ transactionType, propertyType });
  }, [transactionType, propertyType, updateTransactionInfo]);

  const updateAssessment = (type: string, score: number, level: string) => {
    setAssessments(prev => {
      const newAssessments = {
        ...prev,
        [type]: { score, level }
      };
      
      // Mettre à jour les données globales
      updateSummaryData({
        assessments: newAssessments,
        totalScore: newAssessments.vendor.score + newAssessments.acquirer.score + newAssessments.fundOrigin.score,
        overallRisk: (newAssessments.vendor.score + newAssessments.acquirer.score + newAssessments.fundOrigin.score) <= 3 ? 'Faible' : 
                    (newAssessments.vendor.score + newAssessments.acquirer.score + newAssessments.fundOrigin.score) <= 6 ? 'Modéré' : 'Élevé'
      });
      
      return newAssessments;
    });
  };

  const totalScore = assessments.vendor.score + assessments.acquirer.score + assessments.fundOrigin.score;
  const overallRisk = totalScore <= 3 ? 'Faible' : totalScore <= 6 ? 'Modéré' : 'Élevé';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 tracking-widest">T R A C F I N</h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">Lutte contre le blanchiment des capitaux</p>
          <p className="text-lg text-gray-500">Évaluation des risques et classification</p>
        </div>

        {/* Transaction and Property Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informations de la Transaction
            </CardTitle>
            <CardDescription>
              Sélectionnez le type de transaction et les caractéristiques du bien
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="transactionType">Type de transaction</Label>
                <Select value={transactionType} onValueChange={setTransactionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type de transaction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vente">Vente</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="propertyType">Type de bien</Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type de bien" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maison">Maison</SelectItem>
                    <SelectItem value="appartement">Appartement</SelectItem>
                    <SelectItem value="garage">Garage</SelectItem>
                    <SelectItem value="commerce">Commerce</SelectItem>
                    <SelectItem value="terrain">Terrain</SelectItem>
                    <SelectItem value="bureau">Bureau</SelectItem>
                    <SelectItem value="entrepot">Entrepôt</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Overview */}
        <Card className="mb-8 border-2">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              Niveau de risque global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-xl font-bold ${
                overallRisk === 'Faible' ? 'bg-green-100 text-green-800' :
                overallRisk === 'Modéré' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {overallRisk === 'Faible' ? <CheckCircle className="h-6 w-6" /> :
                 overallRisk === 'Modéré' ? <AlertTriangle className="h-6 w-6" /> :
                 <XCircle className="h-6 w-6" />}
                {overallRisk}
              </div>
              <p className="text-gray-600 mt-2">Score total: {totalScore}/18</p>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Tabs */}
        <Tabs defaultValue="vendor" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="vendor" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Vendeurs
            </TabsTrigger>
            <TabsTrigger value="acquirer" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Acquéreurs
            </TabsTrigger>
            <TabsTrigger value="funds" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Provenance des fonds
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Résumé
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendor">
            <VendorAssessment onScoreUpdate={(score, level) => updateAssessment('vendor', score, level)} />
          </TabsContent>

          <TabsContent value="acquirer">
            <AcquirerAssessment onScoreUpdate={(score, level) => updateAssessment('acquirer', score, level)} />
          </TabsContent>

          <TabsContent value="funds">
            <FundOriginAssessment onScoreUpdate={(score, level) => updateAssessment('fundOrigin', score, level)} />
          </TabsContent>

          <TabsContent value="summary">
            <RiskSummary assessments={assessments} totalScore={totalScore} overallRisk={overallRisk} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
