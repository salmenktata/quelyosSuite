import { ColumnMappingTable } from "./ColumnMappingTable";
import { Button } from "@/components/common";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type {
  UploadAnalysisResponse,
  ColumnMapping,
  FieldType,
  CurrentMappings,
} from "@/types/import";

interface MappingStepProps {
  analysisResult: UploadAnalysisResponse;
  userMappings: CurrentMappings;
  selectedAccountId: number | null;
  accounts: Array<{ id: number; name: string }>;
  requiredFields: FieldType[];
  canProceed: boolean;
  onMappingChange: (field: string, mapping: ColumnMapping | null) => void;
  onAccountChange: (accountId: number) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function MappingStep({
  analysisResult,
  userMappings,
  selectedAccountId,
  accounts,
  requiredFields,
  canProceed,
  onMappingChange,
  onAccountChange,
  onBack,
  onContinue,
}: MappingStepProps) {
  return (
    <div className="space-y-6">
      {/* Account Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
          Compte bancaire <span className="text-rose-500 dark:text-rose-400">*</span>
        </label>
        <select
          value={selectedAccountId || ""}
          onChange={(e) => onAccountChange(Number(e.target.value))}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">-- Sélectionnez un compte --</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      {/* Column Mapping */}
      <ColumnMappingTable
        detectedColumns={analysisResult.detectedColumns.mappings}
        previewData={analysisResult.preview}
        currentMappings={userMappings}
        onMappingChange={onMappingChange}
        requiredFields={requiredFields}
      />

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
          onClick={onContinue}
          disabled={!canProceed || !selectedAccountId}
          icon={<ArrowRight />}
          className="flex-1"
        >
          Continuer vers la validation
        </Button>
      </div>
    </div>
  );
}
