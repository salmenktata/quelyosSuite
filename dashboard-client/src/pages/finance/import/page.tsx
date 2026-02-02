/**
 * Page d'import intelligent de transactions bancaires
 *
 * Fonctionnalités :
 * - Upload de fichiers CSV/Excel avec détection automatique de banque
 * - Mapping intelligent des colonnes avec suggestions basées sur l'analyse
 * - Validation des données avec rapport d'erreurs détaillé en temps réel
 * - Preview des transactions avant import définitif
 * - Import en lot avec gestion automatique des doublons
 * - Wizard multi-étapes guidé (upload → mapping → validation → résumé)
 * - Support des formats CSV, XLS et XLSX jusqu'à 15MB
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileSpreadsheet, CheckSquare, CheckCircle, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Breadcrumbs, Button, PageNotice } from "@/components/common";
import { ImportWizardSteps } from "@/components/finance/import/ImportWizardSteps";
import { ImportSummary } from "@/components/finance/import/ImportSummary";
import { UploadStep } from "@/components/finance/import/UploadStep";
import { MappingStep } from "@/components/finance/import/MappingStep";
import { ValidationStep } from "@/components/finance/import/ValidationStep";
import { useImportWizard } from "@/hooks/useImportWizard";
import { logger } from "@quelyos/logger";
import type { StepInfo, FieldType } from "@/types/import";
import { apiFetchJson } from "@/lib/apiFetch";

const STEPS: StepInfo[] = [
  { id: "upload", label: "Téléversement", icon: Upload, completed: false },
  { id: "mapping", label: "Correspondance", icon: FileSpreadsheet, completed: false },
  { id: "validation", label: "Validation", icon: CheckSquare, completed: false },
  { id: "complete", label: "Terminé", icon: CheckCircle, completed: false },
];

const REQUIRED_FIELDS: FieldType[] = ["date", "description"];

export default function ImportPage() {
  const navigate = useNavigate();
  const { state, dispatch, handlers } = useImportWizard();
  const [accounts, setAccounts] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchAccounts() {
      try {
        const data = await apiFetchJson<Array<{ id: number; name: string }>>(
          '/api/ecommerce/accounts'
        );
        if (cancelled) return;
        setAccounts(data);
        if (data.length > 0 && !state.selectedAccountId) {
          dispatch({ type: "SELECT_ACCOUNT", payload: data[0].id });
        }
      } catch (err) {
        if (cancelled) return;
        logger.error("Error fetching accounts:", err);
      }
    }
    fetchAccounts();
    return () => { cancelled = true; };
  }, [state.selectedAccountId, dispatch]);

  const currentStepIndex = STEPS.findIndex((s) => s.id === state.currentStep);
  const canProceedFromMapping = REQUIRED_FIELDS.every(
    (field) => state.userMappings[field] !== undefined
  );

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Import', href: '/finance/import' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Import intelligent
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Importez vos transactions bancaires en quelques clics
            </p>
          </div>
        </div>

        {/* PageNotice */}
        <PageNotice
          config={{
            pageId: 'finance-import',
            moduleColor: 'indigo',
            icon: Upload,
            title: 'Import guidé de transactions',
            purpose: 'Utilisez ce wizard pour importer vos relevés bancaires CSV/Excel.',
            sections: [
              {
                title: 'Fonctionnalités',
                items: [
                  'Détection automatique de votre banque',
                  'Mapping intelligent des colonnes',
                  'Validation en temps réel des données',
                  'Gestion automatique des doublons',
                ],
              },
            ],
          }}
          className="mb-6"
        />

      {/* Progress Steps */}
      <ImportWizardSteps
        steps={STEPS}
        currentStep={currentStepIndex}
        onStepClick={(idx) => {
          if (idx < currentStepIndex) {
            for (let i = currentStepIndex; i > idx; i--) {
              dispatch({ type: "PREVIOUS_STEP" });
            }
          }
        }}
      />

      {/* Error Display */}
      {state.error && (
        <Card className="p-6 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800">
          <div className="flex items-start gap-3">
            <div className="text-rose-600 dark:text-rose-400">⚠️</div>
            <div className="flex-1">
              <p className="font-semibold text-rose-900 dark:text-rose-100">Erreur</p>
              <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">{state.error}</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => dispatch({ type: "RESET_WIZARD" })}
              icon={<RotateCcw />}
            >
              Recommencer
            </Button>
          </div>
        </Card>
      )}

      {/* Step Content */}
      <Card className="p-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        {state.currentStep === "upload" && (
          <UploadStep
            isAnalyzing={state.isAnalyzing}
            analysisResult={state.analysisResult}
            onFileSelect={handlers.handleFileSelect}
            onError={(error) => dispatch({ type: "ANALYSIS_ERROR", payload: typeof error === 'string' ? error : error.message })}
          />
        )}

        {state.currentStep === "mapping" && state.analysisResult && (
          <MappingStep
            analysisResult={state.analysisResult}
            userMappings={state.userMappings}
            selectedAccountId={state.selectedAccountId}
            accounts={accounts}
            requiredFields={REQUIRED_FIELDS}
            canProceed={canProceedFromMapping}
            onMappingChange={handlers.handleMappingChange}
            onAccountChange={(id) => dispatch({ type: "SELECT_ACCOUNT", payload: id })}
            onBack={() => dispatch({ type: "PREVIOUS_STEP" })}
            onContinue={handlers.handleProceedToValidation}
          />
        )}

        {state.currentStep === "validation" && state.previewData && (
          <ValidationStep
            previewData={state.previewData}
            isImporting={state.isImporting}
            onBack={() => dispatch({ type: "PREVIOUS_STEP" })}
            onConfirm={handlers.handleConfirmImport}
          />
        )}

        {state.currentStep === "complete" && state.importResults && (
          <ImportSummary
            results={state.importResults}
            onViewTransactions={() => navigate("/finance/transactions")}
            onImportAnother={() => dispatch({ type: "RESET_WIZARD" })}
          />
        )}
      </Card>
      </div>
    </Layout>
  );
}
