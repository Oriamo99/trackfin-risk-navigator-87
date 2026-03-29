import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { saveApimoCredentials } from '@/config/apimo';
import { apimoService } from '@/services/apimo';

interface ApimoSetupProps {
  onConnected: () => void;
  onSkip: () => void;
}

export const ApimoSetup = ({ onConnected, onSkip }: ApimoSetupProps) => {
  const [providerId, setProviderId] = useState('');
  const [token, setToken] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const canTest = providerId.trim() && token.trim() && agencyId.trim();

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    setErrorMsg('');

    // Save temporarily to sessionStorage so the service can use them
    saveApimoCredentials({
      providerId: providerId.trim(),
      token: token.trim(),
      agencyId: agencyId.trim(),
    });

    try {
      const ok = await apimoService.testConnection();
      if (ok) {
        setResult('success');
        setTimeout(() => onConnected(), 1000);
      } else {
        setResult('error');
        setErrorMsg('Impossible de se connecter à Apimo. Vérifiez vos identifiants.');
      }
    } catch (err) {
      setResult('error');
      setErrorMsg(err instanceof Error ? err.message : 'Erreur de connexion inconnue');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 tracking-widest">T R A C F I N</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuration Apimo</CardTitle>
            <CardDescription>
              Connectez votre compte Apimo pour pré-remplir automatiquement les formulaires TRACFIN à partir de vos biens et contacts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="providerId">Provider ID</Label>
                <Input
                  id="providerId"
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  placeholder="1234"
                />
              </div>
              <div>
                <Label htmlFor="token">Token API</Label>
                <Input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Votre clé API Apimo"
                />
              </div>
              <div>
                <Label htmlFor="agencyId">Agency ID</Label>
                <Input
                  id="agencyId"
                  value={agencyId}
                  onChange={(e) => setAgencyId(e.target.value)}
                  placeholder="56789"
                />
              </div>

              {result === 'success' && (
                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                  Connexion réussie ! Redirection en cours...
                </div>
              )}

              {result === 'error' && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <XCircle className="h-4 w-4" />
                  {errorMsg}
                </div>
              )}

              <Button
                onClick={handleTest}
                disabled={!canTest || testing}
                className="w-full"
              >
                {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Tester la connexion
              </Button>

              <div className="text-center pt-2">
                <button
                  onClick={onSkip}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Mode manuel (sans Apimo)
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
