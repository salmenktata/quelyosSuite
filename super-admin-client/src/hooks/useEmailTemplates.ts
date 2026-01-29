import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type TemplateCategory =
  | 'welcome'
  | 'ecommerce'
  | 'promo'
  | 'newsletter'
  | 'loyalty'
  | 'transactional'
  | 'reminder'
  | 'custom';

export interface EmailTemplate {
  id: number;
  name: string;
  category: TemplateCategory;
  subject: string;
  content: string;
  preview_text: string;
}

export const TEMPLATE_CATEGORIES: { key: TemplateCategory; label: string; color: string }[] = [
  { key: 'welcome', label: 'Bienvenue', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { key: 'ecommerce', label: 'E-commerce', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { key: 'promo', label: 'Promotion', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400' },
  { key: 'newsletter', label: 'Newsletter', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  { key: 'loyalty', label: 'Fidélité', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  { key: 'transactional', label: 'Transactionnel', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
  { key: 'reminder', label: 'Relance', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
];

export function useEmailTemplates(category?: string) {
  return useQuery({
    queryKey: ['email-templates', category],
    queryFn: async () => {
      const response = await api.post<{
        success: boolean;
        error?: string;
        templates: EmailTemplate[];
      }>('/api/marketing/email-templates', { category });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement des templates');
      }

      return response.data.templates;
    },
  });
}
