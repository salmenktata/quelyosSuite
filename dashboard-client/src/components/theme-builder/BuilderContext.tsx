import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Types pour le Theme Builder
 */
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export interface ThemeTypography {
  headings: string;
  headingsWeight: number;
  body: string;
  bodyWeight: number;
}

export interface SectionConfig {
  id: string;
  type: string;
  variant: string;
  config?: Record<string, unknown>;
}

export interface BuilderState {
  colors: ThemeColors;
  typography: ThemeTypography;
  sections: SectionConfig[];
  selectedSection: SectionConfig | null;
  previewDevice: 'desktop' | 'tablet' | 'mobile';
}

interface BuilderContextValue {
  state: BuilderState;
  updateColors: (colors: Partial<ThemeColors>) => void;
  updateTypography: (typo: Partial<ThemeTypography>) => void;
  addSection: (section: Omit<SectionConfig, 'id'>) => void;
  removeSection: (id: string) => void;
  reorderSections: (oldIndex: number, newIndex: number) => void;
  updateSection: (id: string, updates: Partial<SectionConfig>) => void;
  selectSection: (section: SectionConfig | null) => void;
  setPreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  exportJSON: () => string;
  importJSON: (json: string) => boolean;
  resetBuilder: () => void;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

/**
 * État initial du builder
 */
const initialState: BuilderState = {
  colors: {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    background: '#ffffff',
  },
  typography: {
    headings: 'Inter',
    headingsWeight: 700,
    body: 'Inter',
    bodyWeight: 400,
  },
  sections: [],
  selectedSection: null,
  previewDevice: 'desktop',
};

/**
 * Provider du BuilderContext
 */
export function BuilderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BuilderState>(initialState);

  // Synchroniser l'état avec localStorage pour la preview
  useEffect(() => {
    localStorage.setItem('theme-builder-preview', JSON.stringify(state));
  }, [state]);

  const updateColors = useCallback((colors: Partial<ThemeColors>) => {
    setState((prev) => ({
      ...prev,
      colors: { ...prev.colors, ...colors },
    }));
  }, []);

  const updateTypography = useCallback((typo: Partial<ThemeTypography>) => {
    setState((prev) => ({
      ...prev,
      typography: { ...prev.typography, ...typo },
    }));
  }, []);

  const addSection = useCallback((section: Omit<SectionConfig, 'id'>) => {
    const newSection: SectionConfig = {
      ...section,
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setState((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
    toast.success('Section ajoutée');
  }, []);

  const removeSection = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id),
      selectedSection: prev.selectedSection?.id === id ? null : prev.selectedSection,
    }));
    toast.success('Section supprimée');
  }, []);

  const reorderSections = useCallback((oldIndex: number, newIndex: number) => {
    setState((prev) => {
      const newSections = [...prev.sections];
      const [removed] = newSections.splice(oldIndex, 1);
      if (!removed) return prev;
      newSections.splice(newIndex, 0, removed);
      return { ...prev, sections: newSections };
    });
  }, []);

  const updateSection = useCallback((id: string, updates: Partial<SectionConfig>) => {
    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
      selectedSection:
        prev.selectedSection?.id === id
          ? { ...prev.selectedSection, ...updates }
          : prev.selectedSection,
    }));
  }, []);

  const selectSection = useCallback((section: SectionConfig | null) => {
    setState((prev) => ({ ...prev, selectedSection: section }));
  }, []);

  const setPreviewDevice = useCallback((device: 'desktop' | 'tablet' | 'mobile') => {
    setState((prev) => ({ ...prev, previewDevice: device }));
  }, []);

  const exportJSON = useCallback(() => {
    const themeConfig = {
      colors: state.colors,
      typography: state.typography,
      layouts: {
        homepage: {
          sections: state.sections.map(({ id: _id, ...section }) => section),
        },
      },
    };
    return JSON.stringify(themeConfig, null, 2);
  }, [state]);

  const importJSON = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json);

      // Validation basique
      if (!parsed.colors || !parsed.typography || !parsed.layouts?.homepage?.sections) {
        toast.error('Format JSON invalide');
        return false;
      }

      // Importer la config
      setState((prev) => ({
        ...prev,
        colors: parsed.colors,
        typography: parsed.typography,
        sections: parsed.layouts.homepage.sections.map((section: Omit<SectionConfig, 'id'>) => ({
          ...section,
          id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        })),
        selectedSection: null,
      }));

      toast.success('Thème importé avec succès');
      return true;
    } catch (_error) {
      toast.error('Erreur lors de l\'import du JSON');
      return false;
    }
  }, []);

  const resetBuilder = useCallback(() => {
    setState(initialState);
    toast.success('Builder réinitialisé');
  }, []);

  const value: BuilderContextValue = {
    state,
    updateColors,
    updateTypography,
    addSection,
    removeSection,
    reorderSections,
    updateSection,
    selectSection,
    setPreviewDevice,
    exportJSON,
    importJSON,
    resetBuilder,
  };

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

/**
 * Hook pour utiliser le BuilderContext
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useBuilder() {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error('useBuilder doit être utilisé dans un BuilderProvider');
  }
  return context;
}
