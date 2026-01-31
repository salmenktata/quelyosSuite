/**
 * Hook React pour gérer les listes de diffusion marketing (mailing.list natif)
 *
 * Endpoints :
 * - list_mailing_lists() : Liste listes avec filtres
 * - get_mailing_list(id) : Détail liste + contacts
 * - create_mailing_list() : Créer liste
 * - add_contacts() : Ajouter contacts à liste
 * - remove_contact() : Retirer contact de liste
 * - delete_mailing_list(id) : Supprimer liste
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface MailingList {
  id: number;
  name: string;
  active: boolean;
  contact_count: number;
  create_date: string | null;
}

export interface MailingContact {
  id: number;
  name: string;
  email: string;
  company_name?: string;
  list_ids: number[];
}

export interface ListsQueryParams {
  tenant_id?: number;
  limit?: number;
  offset?: number;
}

export function useMarketingLists(params?: ListsQueryParams) {
  return useQuery({
    queryKey: ['marketing-lists', params],
    queryFn: async () => {
      const result = await api.post<{
        success: boolean;
        mailing_lists: MailingList[];
        total_count: number;
        error?: string;
      }>('/api/ecommerce/marketing/lists', params || {});

      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur lors du chargement des listes');
      }

      return result.data;
    },
  });
}

export function useMarketingList(listId: number) {
  return useQuery({
    queryKey: ['marketing-list', listId],
    queryFn: async () => {
      const result = await api.post<{
        success: boolean;
        mailing_list: MailingList;
        contacts: MailingContact[];
        error?: string;
      }>(`/api/ecommerce/marketing/lists/${listId}`, {});

      if (!result.data.success) {
        throw new Error(result.data.error || 'Liste non trouvée');
      }

      return result.data;
    },
    enabled: !!listId,
  });
}

export function useCreateMailingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      tenant_id?: number;
    }) => {
      const result = await api.post<{
        success: boolean;
        mailing_list: MailingList;
        error?: string;
      }>('/api/ecommerce/marketing/lists/create', data);

      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur lors de la création');
      }

      return result.data.mailing_list;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-lists'] });
    },
  });
}

export function useAddContactsToList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      list_id: number;
      contact_ids: number[];
    }) => {
      const result = await api.post<{
        success: boolean;
        added_count: number;
        error?: string;
      }>(`/api/ecommerce/marketing/lists/${data.list_id}/contacts`, {
        contact_ids: data.contact_ids,
      });

      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur lors de l\'ajout');
      }

      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-list', variables.list_id] });
    },
  });
}

export function useRemoveContactFromList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      list_id: number;
      contact_id: number;
    }) => {
      const result = await api.post<{
        success: boolean;
        error?: string;
      }>(`/api/ecommerce/marketing/lists/${data.list_id}/contacts/${data.contact_id}`, {
        action: 'remove',
      });

      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur lors de la suppression');
      }

      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-list', variables.list_id] });
    },
  });
}

export function useDeleteMailingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: number) => {
      const result = await api.post<{
        success: boolean;
        error?: string;
      }>(`/api/ecommerce/marketing/lists/${listId}/delete`, {});

      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur lors de la suppression');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-lists'] });
    },
  });
}
