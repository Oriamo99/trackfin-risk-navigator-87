import { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generatePDF, downloadBlob } from "@/lib/pdf-export";
import { isApimoConfigured } from "@/config/apimo";
import { apimoService } from "@/services/apimo";
import type { AppSnapshot } from "@/types";

interface PdfPreviewModalProps {
  open: boolean;
  onClose: () => void;
  snapshot: AppSnapshot;
  apimoPropertyId: number | null;
  onApimoUploadSuccess: () => void;
}

export const PdfPreviewModal = ({
  open,
  onClose,
  snapshot,
  apimoPropertyId,
  onApimoUploadSuccess,
}: PdfPreviewModalProps) => {
  const [uploading, setUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const pdfData = useMemo(() => {
    if (!open) return null;
    try {
      return generatePDF(snapshot);
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast.error("Erreur lors de la génération du PDF.");
      return null;
    }
  }, [open, snapshot]);

  useEffect(() => {
    if (pdfData) {
      const url = URL.createObjectURL(pdfData.blob);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPdfUrl(null);
  }, [pdfData]);

  const handleDownload = () => {
    if (!pdfData) return;
    downloadBlob(pdfData.blob, pdfData.fileName);
    toast.success("PDF téléchargé !");
  };

  const handleApimoUpload = async () => {
    if (!pdfData || !apimoPropertyId) return;
    setUploading(true);
    try {
      await apimoService.uploadDocument(apimoPropertyId, pdfData.blob, pdfData.fileName);
      onApimoUploadSuccess();
    } catch (error) {
      console.error("Erreur upload Apimo:", error);
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(`Échec de l'envoi vers Apimo : ${message}. Vous pouvez télécharger le PDF localement.`);
    } finally {
      setUploading(false);
    }
  };

  const showApimoButton = isApimoConfigured() && apimoPropertyId != null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Prévisualisation du PDF</DialogTitle>
        </DialogHeader>

        {pdfUrl ? (
          <iframe src={pdfUrl} className="flex-1 w-full border rounded" title="Prévisualisation PDF" />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Génération du PDF en cours...
          </div>
        )}

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Fermer
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleDownload} disabled={!pdfData}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
            {showApimoButton && (
              <Button
                onClick={handleApimoUpload}
                disabled={uploading || !pdfData}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Envoyer vers Apimo
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
