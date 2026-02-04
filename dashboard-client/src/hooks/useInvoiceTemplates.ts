/**
 * Hooks TanStack Query pour gestion templates factures
 *
 * Fonctionnalités :
 * - Liste templates (système + custom tenant)
 * - Création template custom
 * - Modification template
 * - Duplication template
 * - Définition template par défaut
 * - Preview PDF template
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

// ============================================================================
// Types
// ============================================================================

export type TemplateSector =
  | 'tech'
  | 'ecommerce'
  | 'btp'
  | 'consulting'
  | 'luxury'
  | 'medical'
  | 'legal'
  | 'education'
  | 'hospitality'
  | 'other';

export type TemplateType = 'system' | 'custom';

export interface InvoiceTemplate {
  id: number;
  name: string;
  code: string;
  sector: TemplateSector;
  template_type: TemplateType;
  is_default: boolean;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  logo_url?: string;
  header_content?: string;
  footer_content?: string;
  custom_css?: string;
  show_logo: boolean;
  show_company_info: boolean;
  show_bank_details: boolean;
  show_payment_terms?: boolean;
  show_tax_breakdown?: boolean;
  preview_url: string;
  usage_count: number;
  available_variables?: string[];
}

export interface TemplatesListParams {
  template_type?: 'system' | 'custom' | 'all';
  sector?: TemplateSector;
}

export interface CreateTemplateParams {
  name: string;
  code: string;
  sector: TemplateSector;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  logo_url?: string;
  header_content?: string;
  footer_content?: string;
  custom_css?: string;
  show_logo?: boolean;
  show_company_info?: boolean;
  show_bank_details?: boolean;
  show_payment_terms?: boolean;
  show_tax_breakdown?: boolean;
  is_default?: boolean;
}

export interface UpdateTemplateParams {
  name?: string;
  sector?: TemplateSector;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  logo_url?: string;
  header_content?: string;
  footer_content?: string;
  custom_css?: string;
  show_logo?: boolean;
  show_company_info?: boolean;
  show_bank_details?: boolean;
  show_payment_terms?: boolean;
  show_tax_breakdown?: boolean;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Liste templates (système + custom)
 */
export function useInvoiceTemplates(params: TemplatesListParams = {}) {
  return useQuery({
    queryKey: ['invoice-templates', params],
    queryFn: async () => {
      const response = await apiClient.post('/finance/invoices/templates', params);

      if (!response.success) {
        throw new Error(response.error || 'Erreur chargement templates');
      }

      return {
        templates: response.data.templates as InvoiceTemplate[],
        count: response.data.count as number,
      };
    },
    staleTime: 5 * 60 * 1000, // Cache 5 min (templates changent rarement)
  });
}

/**
 * Détail template
 */
export function useInvoiceTemplate(templateId: number | null) {
  return useQuery({
    queryKey: ['invoice-template', templateId],
    queryFn: async () => {
      if (!templateId) throw new Error('Template ID requis');

      const response = await apiClient.post(`/finance/invoices/templates/${templateId}`, {});

      if (!response.success) {
        throw new Error(response.error || 'Erreur chargement template');
      }

      return response.data.template as InvoiceTemplate;
    },
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Créer template custom
 */
export function useCreateInvoiceTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateTemplateParams) => {
      const response = await apiClient.post('/finance/invoices/templates/create', params);

      if (!response.success) {
        throw new Error(response.error || 'Erreur création template');
      }

      return {
        template_id: response.data.template_id as number,
        message: response.data.message as string,
      };
    },
    onMutate: () => {
      toast.loading('Création du template...', { id: 'create-template' });
    },
    onSuccess: (data) => {
      toast.success(`Template créé avec succès (ID: ${data.template_id})`, { id: 'create-template' });
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur : ${error.message}`, { id: 'create-template' });
    },
  });
}

/**
 * Modifier template
 */
export function useUpdateInvoiceTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, params }: { templateId: number; params: UpdateTemplateParams }) => {
      const response = await apiClient.post(`/finance/invoices/templates/${templateId}/update`, params);

      if (!response.success) {
        throw new Error(response.error || 'Erreur modification template');
      }

      return { message: response.data.message as string };
    },
    onMutate: () => {
      toast.loading('Modification du template...', { id: 'update-template' });
    },
    onSuccess: (_, variables) => {
      toast.success('Template modifié avec succès', { id: 'update-template' });
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-template', variables.templateId] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur : ${error.message}`, { id: 'update-template' });
    },
  });
}

/**
 * Dupliquer template
 */
export function useDuplicateInvoiceTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: number) => {
      const response = await apiClient.post(`/finance/invoices/templates/${templateId}/duplicate`, {});

      if (!response.success) {
        throw new Error(response.error || 'Erreur duplication template');
      }

      return {
        template_id: response.data.template_id as number,
        message: response.data.message as string,
      };
    },
    onMutate: () => {
      toast.loading('Duplication du template...', { id: 'duplicate-template' });
    },
    onSuccess: (data) => {
      toast.success(`Template dupliqué (ID: ${data.template_id})`, { id: 'duplicate-template' });
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur : ${error.message}`, { id: 'duplicate-template' });
    },
  });
}

/**
 * Définir template par défaut
 */
export function useSetDefaultInvoiceTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: number) => {
      const response = await apiClient.post(`/finance/invoices/templates/${templateId}/set-default`, {});

      if (!response.success) {
        throw new Error(response.error || 'Erreur définition template par défaut');
      }

      return { message: response.data.message as string };
    },
    onMutate: async (templateId) => {
      toast.loading('Définition du template par défaut...', { id: 'set-default-template' });

      // Optimistic update : marquer le nouveau template comme défaut
      await queryClient.cancelQueries({ queryKey: ['invoice-templates'] });

      const previousData = queryClient.getQueryData(['invoice-templates']);

      queryClient.setQueriesData<{ templates: InvoiceTemplate[]; count: number }>(
        { queryKey: ['invoice-templates'] },
        (old) => {
          if (!old) return old;

          return {
            templates: old.templates.map(t => ({
              ...t,
              is_default: t.id === templateId,
            })),
            count: old.count,
          };
        }
      );

      return { previousData };
    },
    onSuccess: () => {
      toast.success('Template défini comme par défaut', { id: 'set-default-template' });
    },
    onError: (error: Error, _variables, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(['invoice-templates'], context.previousData);
      }
      toast.error(`Erreur : ${error.message}`, { id: 'set-default-template' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
    },
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Obtenir URL preview PDF
 */
export function getTemplatePreviewUrl(templateId: number): string {
  return `/api/finance/invoices/templates/${templateId}/preview`;
}

/**
 * Labels secteurs
 */
export const SECTOR_LABELS: Record<TemplateSector, string> = {
  tech: 'Tech / SaaS',
  ecommerce: 'E-commerce',
  btp: 'BTP / Construction',
  consulting: 'Conseil',
  luxury: 'Luxe',
  medical: 'Médical',
  legal: 'Juridique',
  education: 'Éducation',
  hospitality: 'Hôtellerie',
  other: 'Autre',
};

/**
 * Labels polices
 */
export const FONT_FAMILY_LABELS: Record<string, string> = {
  helvetica: 'Helvetica (Standard)',
  arial: 'Arial (Classique)',
  georgia: 'Georgia (Élégante)',
  courier: 'Courier (Monospace)',
  times: 'Times New Roman (Formelle)',
  verdana: 'Verdana (Moderne)',
};
