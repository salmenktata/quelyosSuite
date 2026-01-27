import type {
  ImportState,
  ImportAction,
  ImportStep,
} from "@/types/import";

export const initialState: ImportState = {
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

const STEP_ORDER: ImportStep[] = ["upload", "mapping", "validation", "complete"];

export function importReducer(state: ImportState, action: ImportAction): ImportState {
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
      const currentIndex = STEP_ORDER.indexOf(state.currentStep);
      return {
        ...state,
        currentStep: currentIndex < STEP_ORDER.length - 1
          ? STEP_ORDER[currentIndex + 1]
          : state.currentStep,
      };

    case "PREVIOUS_STEP":
      const currentIndexRev = STEP_ORDER.indexOf(state.currentStep);
      return {
        ...state,
        currentStep: currentIndexRev > 0
          ? STEP_ORDER[currentIndexRev - 1]
          : state.currentStep,
      };

    case "RESET_WIZARD":
      return initialState;

    default:
      return state;
  }
}
