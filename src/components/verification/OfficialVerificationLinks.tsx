import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink } from "lucide-react";

interface VerificationSite {
  id: string;
  title: string;
  description: string;
  tooltip: string;
  url: string;
  buttonLabel: string;
}

const verificationSites: VerificationSite[] = [
  {
    id: 'sanctions',
    title: 'Gel des Avoirs - DG Trésor',
    description: 'Vérification des listes de sanctions internationales',
    tooltip: 'Veuillez cliquer sur le bouton "Accéder au site internet", inscrire le nom de la personne recherchée, réaliser une capture d\'écran de l\'affichage, puis insérer l\'image dans "Sélection fichier".',
    url: 'https://gels-avoirs.dgtresor.gouv.fr/',
    buttonLabel: 'Accéder au site internet',
  },
  {
    id: 'gafi',
    title: 'GAFI - Pays à Haut Risque',
    description: 'Liste noire et grise du GAFI',
    tooltip: 'Appuyez sur "Accès au GAFI" pour vous rendre sur le site internet. Ensuite, il faudra faire une capture d\'écran du pays concerné et l\'ajouter dans "Sélection fichier".',
    url: 'https://www.fatf-gafi.org/fr/countries/liste-noire-et-liste-gris.html',
    buttonLabel: 'Accès au GAFI',
  },
  {
    id: 'google',
    title: 'Vérification Google',
    description: "Recherche d'informations complémentaires",
    tooltip: 'Accéder à Google. Une fois sur le site, vous devez rechercher le nom de la personne désirée, faire une capture d\'écran de l\'image et la télécharger dans "Sélection fichier".',
    url: 'https://www.google.com',
    buttonLabel: 'Accès à Google',
  },
  {
    id: 'pappers',
    title: 'Vérification Pappers',
    description: 'Informations sur les entreprises françaises',
    tooltip: 'Cliquez sur "Accès à Pappers" pour visiter le site de Pappers. Ensuite, effectuez une recherche sur le nom de la personne ou de la société, réalisez une capture d\'écran de l\'affichage et intégrez-la dans "Sélection fichier".',
    url: 'https://www.pappers.fr/',
    buttonLabel: 'Accès à Pappers',
  },
  {
    id: 'ppe',
    title: 'Personne Politiquement Exposée (PPE)',
    description: 'Liste officielle des PPE (ACPR – Banque de France)',
    tooltip: 'En cliquant sur le bouton d\'accès, suivez le même processus : sélectionner le métier, rechercher, capturer l\'écran, puis insérer l\'image dans "Sélection fichier".',
    url: 'https://acpr.banque-france.fr/liste-des-personnes-politiquement-exposees',
    buttonLabel: 'Accéder',
  },
];

interface OfficialVerificationLinksProps {
  idPrefix: string;
}

export const OfficialVerificationLinks = ({ idPrefix }: OfficialVerificationLinksProps) => {
  const [screenshots, setScreenshots] = useState<Record<string, File[]>>(
    Object.fromEntries(verificationSites.map(s => [s.id, []]))
  );

  const handleUpload = (siteId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setScreenshots(prev => ({ ...prev, [siteId]: [...prev[siteId], ...files] }));
  };

  const handleRemove = (siteId: string, index: number) => {
    setScreenshots(prev => ({
      ...prev,
      [siteId]: prev[siteId].filter((_, i) => i !== index),
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Vérifications Officielles
        </CardTitle>
        <CardDescription>
          Liens vers les sites officiels pour les vérifications et capture d'écran
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {verificationSites.map((site) => (
            <div key={site.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h4 className="font-medium cursor-help hover:text-blue-600">{site.title}</h4>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{site.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-sm text-gray-600">{site.description}</p>
                </div>
                <Button variant="outline" asChild>
                  <a href={site.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {site.buttonLabel}
                  </a>
                </Button>
              </div>
              <div>
                <Label htmlFor={`${idPrefix}-${site.id}Upload`}>Capture d'écran</Label>
                <Input
                  id={`${idPrefix}-${site.id}Upload`}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleUpload(site.id, e)}
                  className="mt-2"
                />
                {screenshots[site.id]?.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {screenshots[site.id].map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemove(site.id, index)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
