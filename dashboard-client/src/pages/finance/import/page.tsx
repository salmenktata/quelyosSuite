

import { useReducer, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileSpreadsheet, CheckSquare, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FileUploadZone } from "@/components/finance/import/FileUploadZone";
import { ImportWizardSteps } from "@/components/finance/import/ImportWizardSteps";
import { ColumnMappingTable } from "@/components/finance/import/ColumnMappingTable";
import { ValidationErrors } from "@/components/finance/import/ValidationErrors";
import { ImportSummary } from "@/components/finance/import/ImportSummary";
import { API_BASE_URL } from "@/lib/api-base";
import { logger } from '@quelyos/logger';
import type {
  ImportState,
  ImportAction,
  ImportStep,
  StepInfo,
  UploadAnalysisResponse,
  PreviewResponse,
  ConfirmImportResponse,
  ColumnMapping,
} from "@/types/import";

// Initial state
const initialState: ImportState = {
  currentStep: "upload",
  file: null,
  uploadProgress: 0,
  sessionId: null,
  analysisResult: null,
  previewData: null,
  userMappings: {},
  selectedAccountId: null,
  importResults: null,
  isUploading: false,
  isAnalyzing: false,
  isImporting: false,
  error: null,
};

// Reducer
function importReducer(state: ImportState, action: ImportAction): ImportState {
  switch (action.type) {
    case "FILE_SELECTED":
      return {
        ...state,
        file: action.payload,
        error: null,
      };

    case "UPLOAD_PROGRESS":
      return { ...state, uploadProgress: action.payload };

    case "ANALYSIS_START":
      return {
        ...state,
        isAnalyzing: true,
        error: null,
      };

    case "ANALYSIS_SUCCESS":
      return {
        ...state,
        isAnalyzing: false,
        analysisResult: action.payload,
        sessionId: action.payload.sessionId,
        // Initialize userMappings with detected columns
        userMappings: action.payload.detectedColumns.mappings,
        currentStep: "mapping",
      };

    case "ANALYSIS_ERROR":
      return {
        ...state,
        isAnalyzing: false,
        error: action.payload,
      };

    case "UPDATE_MAPPING":
      const newMappings = { ...state.userMappings };
      if (action.payload.mapping === null) {
        delete newMappings[action.payload.field];
      } else {
        newMappings[action.payload.field] = action.payload.mapping;
      }
      return {
        ...state,
        userMappings: newMappings,
      };

    case "RESET_MAPPINGS":
      return {
        ...state,
        userMappings: state.analysisResult?.detectedColumns.mappings || {},
      };

    case "SELECT_ACCOUNT":
      return {
        ...state,
        selectedAccountId: action.payload,
      };

    case "PREVIEW_LOAD":
      return {
        ...state,
        previewData: action.payload,
        currentStep: "validation",
      };

    case "IMPORT_START":
      return {
        ...state,
        isImporting: true,
        error: null,
      };

    case "IMPORT_SUCCESS":
      return {
        ...state,
        isImporting: false,
        importResults: action.payload,
        currentStep: "complete",
      };

    case "IMPORT_ERROR":
      return {
        ...state,
        isImporting: false,
        error: action.payload,
      };

    case "NEXT_STEP":
      const steps: ImportStep[] = ["upload", "mapping", "validation", "complete"];
      const currentIndex = steps.indexOf(state.currentStep);
      return {
        ...state,
        currentStep: currentIndex < steps.length - 1 ? steps[currentIndex + 1] : state.currentStep,
      };

    case "PREVIOUS_STEP":
      const stepsRev: ImportStep[] = ["upload", "mapping", "validation", "complete"];
      const currentIndexRev = stepsRev.indexOf(state.currentStep);
      return {
        ...state,
        currentStep: currentIndexRev > 0 ? stepsRev[currentIndexRev - 1] : state.currentStep,
      };

    case "RESET_WIZARD":
      return initialState;

    default:
      return state;
  }
}

// Step configuration
const STEPS: StepInfo[] = [
  { id: "upload", label: "Téléversement", icon: Upload, completed: false },
  { id: "mapping", label: "Correspondance", icon: FileSpreadsheet, completed: false },
  { id: "validation", label: "Validation", icon: CheckSquare, completed: false },
  { id: "complete", label: "Terminé", icon: CheckCircle, completed: false },
];

const REQUIRED_FIELDS: import("@/types/import").FieldType[] = ["date", "description"];

export default function ImportPage() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(importReducer, initialState);
  const [accounts, setAccounts] = useState<Array<{ id: number; name: string }>>([]);

  // Fetch user accounts
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await fetch(`${API_BASE_URL}/accounts`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setAccounts(data);
          // Auto-select first account if available
          if (data.length > 0 && !state.selectedAccountId) {
            dispatch({ type: "SELECT_ACCOUNT", payload: data[0].id });
          }
        }
      } catch (error) {
        logger.error("Error fetching accounts:", error);
      }
    }
    fetchAccounts();
  }, []);

  // Handle file upload and analysis
  const handleFileSelect = async (file: File) => {
    dispatch({ type: "FILE_SELECTED", payload: file });
    dispatch({ type: "ANALYSIS_START" });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/company/import/smart/analyze`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Échec de l'analyse du fichier");
      }

      const result: UploadAnalysisResponse = await response.json();
      dispatch({ type: "ANALYSIS_SUCCESS", payload: result });
    } catch (error: any) {
      dispatch({ type: "ANALYSIS_ERROR", payload: error.message });
    }
  };

  // Handle mapping change
  const handleMappingChange = (field: string, mapping: ColumnMapping | null) => {
    dispatch({ type: "UPDATE_MAPPING", payload: { field, mapping } });
  };

  // Proceed to validation step
  const handleProceedToValidation = async () => {
    if (!state.sessionId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/import/smart/preview/${state.sessionId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Échec du chargement de la prévisualisation");
      }

      const result: PreviewResponse = await response.json();
      dispatch({ type: "PREVIEW_LOAD", payload: result });
    } catch (error: any) {
      dispatch({ type: "ANALYSIS_ERROR", payload: error.message });
    }
  };

  // Handle final import confirmation
  const handleConfirmImport = async () => {
    if (!state.sessionId || !state.selectedAccountId) return;

    dispatch({ type: "IMPORT_START" });

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/import/smart/confirm/${state.sessionId}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: state.selectedAccountId,
            columnMappings: state.userMappings,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Échec de l'import");
      }

      const result: ConfirmImportResponse = await response.json();
      dispatch({ type: "IMPORT_SUCCESS", payload: result });
    } catch (error: any) {
      dispatch({ type: "IMPORT_ERROR", payload: error.message });
    }
  };

  // Get current step index
  const currentStepIndex = STEPS.findIndex((s) => s.id === state.currentStep);

  // Check if can proceed from mapping step
  const canProceedFromMapping = REQUIRED_FIELDS.every(
    (field) => state.userMappings[field] !== undefined
  );

  return (
    <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-3">
            Import intelligent
          </h1>
          <p className="text-lg text-indigo-200/80">
            Importez vos transactions bancaires en quelques clics
          </p>
        </div>

        {/* Progress Steps */}
        <ImportWizardSteps
          steps={STEPS}
          currentStep={currentStepIndex}
          onStepClick={(idx) => {
            // Allow going back to previous steps
            if (idx < currentStepIndex) {
              const targetStep = STEPS[idx].id;
              for (let i = currentStepIndex; i > idx; i--) {
                dispatch({ type: "PREVIOUS_STEP" });
              }
            }
          }}
        />

        {/* Error Display */}
        {state.error && (
          <Card  className="p-6">
            <div className="flex items-start gap-3">
              <div className="text-rose-400">⚠️</div>
              <div className="flex-1">
                <p className="font-semibold text-white">Erreur</p>
                <p className="text-sm text-rose-200/90 mt-1">{state.error}</p>
              </div>
              <button
                onClick={() => dispatch({ type: "RESET_WIZARD" })}
                className="text-sm text-rose-200/70 hover:text-rose-200 transition"
              >
                Recommencer
              </button>
            </div>
          </Card>
        )}

        {/* Step Content */}
        <Card  className="p-8">
          {/* Step 1: Upload */}
          {state.currentStep === "upload" && (
            <div className="space-y-6">
              <FileUploadZone
                onFileSelect={handleFileSelect}
                onError={(error) => dispatch({ type: "ANALYSIS_ERROR", payload: error })}
                maxSizeMB={15}
              />

              {state.isAnalyzing && (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent mb-4"></div>
                  <p className="text-white font-medium">Analyse du fichier en cours...</p>
                  <p className="text-sm text-indigo-200/70 mt-1">
                    Détection des colonnes et de votre banque
                  </p>
                </div>
              )}

              {state.analysisResult && (
                <div className="text-center space-y-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Fichier analysé avec succès !</p>
                    <p className="text-sm text-indigo-200/70 mt-1">
                      {state.analysisResult.rowCount} lignes détectées
                      {state.analysisResult.detectedBank && (
                        <> · Banque : {state.analysisResult.detectedBank.name}</>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Mapping */}
          {state.currentStep === "mapping" && state.analysisResult && (
            <div className="space-y-6">
              {/* Account Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-white">
                  Compte bancaire <span className="text-rose-400">*</span>
                </label>
                <select
                  value={state.selectedAccountId || ""}
                  onChange={(e) =>
                    dispatch({ type: "SELECT_ACCOUNT", payload: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Sélectionnez un compte --</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id} className="bg-gray-900">
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Column Mapping */}
              <ColumnMappingTable
                detectedColumns={state.analysisResult.detectedColumns.mappings}
                previewData={state.analysisResult.preview}
                currentMappings={state.userMappings}
                onMappingChange={handleMappingChange}
                requiredFields={REQUIRED_FIELDS}
              />

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => dispatch({ type: "PREVIOUS_STEP" })}
                  className="px-6 py-3 rounded-xl border border-white/20 bg-white/5 text-white font-semibold hover:bg-white/10 transition"
                >
                  Retour
                </button>
                <button
                  onClick={handleProceedToValidation}
                  disabled={!canProceedFromMapping || !state.selectedAccountId}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg hover:from-indigo-400 hover:to-purple-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuer vers la validation
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Validation */}
          {state.currentStep === "validation" && state.previewData && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Validation des données
                </h3>
                <p className="text-sm text-indigo-200/70">
                  Vérifiez les erreurs potentielles avant l&apos;import final
                </p>
              </div>

              {/* Preview Summary */}
              <Card  className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{state.previewData.totalRows}</p>
                    <p className="text-sm text-blue-200">Lignes totales</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{state.previewData.previewRows.length}</p>
                    <p className="text-sm text-blue-200">Aperçu</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {state.previewData.previewRows.filter((r) => !r.error).length}
                    </p>
                    <p className="text-sm text-emerald-300">Valides</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {state.previewData.previewRows.filter((r) => r.error).length}
                    </p>
                    <p className="text-sm text-rose-300">Erreurs</p>
                  </div>
                </div>
              </Card>

              {/* Validation Errors */}
              {state.previewData.previewRows.filter((r) => r.error).length > 0 && (
                <ValidationErrors
                  errors={state.previewData.previewRows
                    .filter((r) => r.error)
                    .map((r) => ({
                      line: r.lineNumber,
                      message: r.error || "",
                      severity: "error",
                    }))}
                />
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => dispatch({ type: "PREVIOUS_STEP" })}
                  className="px-6 py-3 rounded-xl border border-white/20 bg-white/5 text-white font-semibold hover:bg-white/10 transition"
                >
                  Retour
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={state.isImporting}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg hover:from-emerald-400 hover:to-teal-400 transition disabled:opacity-50"
                >
                  {state.isImporting ? "Import en cours..." : "Confirmer l'import"}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {state.currentStep === "complete" && state.importResults && (
            <ImportSummary
              results={state.importResults}
              onViewTransactions={() => navigate("/finance/transactions")}
              onImportAnother={() => dispatch({ type: "RESET_WIZARD" })}
            />
          )}
        </Card>
    </div>
  );
}
