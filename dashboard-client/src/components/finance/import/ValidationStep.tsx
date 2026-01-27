import { Card } from "@/components/ui/card";
import { ValidationErrors } from "./ValidationErrors";
import { Button } from "@/components/common";
import { ArrowLeft, CheckCircle } from "lucide-react";
import type { PreviewResponse } from "@/types/import";

interface ValidationStepProps {
  previewData: PreviewResponse;
  isImporting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

export function ValidationStep({
  previewData,
  isImporting,
  onBack,
  onConfirm,
}: ValidationStepProps) {
  const errorRows = previewData.previewRows.filter((r) => r.error);
  const validRows = previewData.previewRows.filter((r) => !r.error);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Validation des données
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Vérifiez les erreurs potentielles avant l&apos;import final
        </p>
      </div>

      {/* Preview Summary */}
      <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {previewData.totalRows}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Lignes totales</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {previewData.previewRows.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Aperçu</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {validRows.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Valides</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {errorRows.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Erreurs</p>
          </div>
        </div>
      </Card>

      {/* Validation Errors */}
      {errorRows.length > 0 && (
        <ValidationErrors
          errors={errorRows.map((r) => ({
            line: r.lineNumber,
            message: r.error || "",
            severity: "error",
          }))}
        />
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={onBack}
          icon={<ArrowLeft />}
        >
          Retour
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={isImporting}
          icon={<CheckCircle />}
          className="flex-1"
        >
          {isImporting ? "Import en cours..." : "Confirmer l'import"}
        </Button>
      </div>
    </div>
  );
}
