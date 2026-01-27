import { CheckCircle } from "lucide-react";
import { FileUploadZone } from "./FileUploadZone";
import { SkeletonTable } from "@/components/common";
import type { UploadAnalysisResponse } from "@/types/import";

interface UploadStepProps {
  isAnalyzing: boolean;
  analysisResult: UploadAnalysisResponse | null;
  onFileSelect: (file: File) => void;
  onError: (error: string) => void;
}

export function UploadStep({
  isAnalyzing,
  analysisResult,
  onFileSelect,
  onError,
}: UploadStepProps) {
  return (
    <div className="space-y-6">
      <FileUploadZone
        onFileSelect={onFileSelect}
        onError={onError}
        maxSizeMB={15}
      />

      {isAnalyzing && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-900 dark:text-white font-medium">
              Analyse du fichier en cours...
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Détection des colonnes et de votre banque
            </p>
          </div>
          <SkeletonTable rows={5} columns={4} />
        </div>
      )}

      {analysisResult && (
        <div className="text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <div>
            <p className="text-gray-900 dark:text-white font-semibold">
              Fichier analysé avec succès !
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {analysisResult.rowCount} lignes détectées
              {analysisResult.detectedBank && (
                <> · Banque : {analysisResult.detectedBank.name}</>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
