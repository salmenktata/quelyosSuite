import { useReducer } from "react";
import { importReducer, initialState } from "@/reducers/importReducer";
import { API_BASE_URL } from "@/lib/api-base";
import { logger } from "@quelyos/logger";
import type {
  UploadAnalysisResponse,
  PreviewResponse,
  ConfirmImportResponse,
  ColumnMapping,
} from "@/types/import";

export function useImportWizard() {
  const [state, dispatch] = useReducer(importReducer, initialState);

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
    } catch (error) {
      logger.error("Import analysis error:", error);
      const message = error instanceof Error ? error.message : "Erreur d'analyse";
      dispatch({ type: "ANALYSIS_ERROR", payload: message });
    }
  };

  const handleMappingChange = (field: string, mapping: ColumnMapping | null) => {
    dispatch({ type: "UPDATE_MAPPING", payload: { field, mapping } });
  };

  const handleProceedToValidation = async () => {
    if (!state.sessionId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/import/smart/preview/${state.sessionId}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Échec du chargement de la prévisualisation");
      }

      const result: PreviewResponse = await response.json();
      dispatch({ type: "PREVIEW_LOAD", payload: result });
    } catch (error) {
      logger.error("Import preview error:", error);
      const message = error instanceof Error ? error.message : "Erreur de prévisualisation";
      dispatch({ type: "ANALYSIS_ERROR", payload: message });
    }
  };

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
    } catch (error) {
      logger.error("Import confirm error:", error);
      const message = error instanceof Error ? error.message : "Erreur d'import";
      dispatch({ type: "IMPORT_ERROR", payload: message });
    }
  };

  return {
    state,
    dispatch,
    handlers: {
      handleFileSelect,
      handleMappingChange,
      handleProceedToValidation,
      handleConfirmImport,
    },
  };
}
