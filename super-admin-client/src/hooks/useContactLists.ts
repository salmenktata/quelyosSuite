import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Contact {
  id: number;
  name: string;
  email: string;
  mobile: string;
}

export interface ContactList {
  id: number;
  name: string;
  description: string;
  list_type: 'static' | 'dynamic';
  contact_count: number;
  filter_domain: string;
  created_at: string;
  updated_at: string;
  contacts?: Contact[];
}

export interface CreateContactListData {
  name: string;
  description?: string;
  list_type?: 'static' | 'dynamic';
  filter_domain?: string;
  contact_ids?: number[];
}

export interface UpdateContactListData {
  name?: string;
  description?: string;
  filter_domain?: string;
  contact_ids?: number[];
}

export function useContactLists() {
  return useQuery({
    queryKey: ['contact-lists'],
    queryFn: async () => {
      const response = await api.post<{
        success: boolean;
        error?: string;
        contact_lists: ContactList[];
        total: number;
      }>('/api/marketing/contact-lists', {});

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement des listes');
      }

      return {
        lists: response.data.contact_lists,
        total: response.data.total,
      };
    },
  });
}

export function useContactList(id: number | null) {
  return useQuery({
    queryKey: ['contact-list', id],
    queryFn: async () => {
      if (!id) return null;

      const response = await api.post<{
        success: boolean;
        error?: string;
        contact_list: ContactList;
      }>(`/api/marketing/contact-lists/${id}`, {});

      if (!response.data.success) {
        throw new Error(response.data.error || 'Liste introuvable');
      }

      return response.data.contact_list;
    },
    enabled: !!id,
  });
}

export function useCreateContactList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateContactListData) => {
      const response = await api.post<{
        success: boolean;
        error?: string;
        contact_list: ContactList;
      }>('/api/marketing/contact-lists/create', data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la création');
      }

      return response.data.contact_list;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-lists'] });
    },
  });
}

export function useUpdateContactList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateContactListData }) => {
      const response = await api.post<{
        success: boolean;
        error?: string;
        contact_list: ContactList;
      }>(`/api/marketing/contact-lists/${id}/update`, data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la mise à jour');
      }

      return response.data.contact_list;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contact-lists'] });
      queryClient.invalidateQueries({ queryKey: ['contact-list', id] });
    },
  });
}

export function useDeleteContactList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{
        success: boolean;
        error?: string;
      }>(`/api/marketing/contact-lists/${id}/delete`, {});

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la suppression');
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-lists'] });
    },
  });
}

// ============================================================================
// IMPORT CSV
// ============================================================================

export interface CSVPreviewResult {
  headers: string[];
  column_mapping: {
    name?: string;
    email?: string;
    phone?: string;
  };
  total_rows: number;
  preview: {
    name: string;
    email: string;
    phone: string;
    _raw: Record<string, string>;
  }[];
}

export interface CSVImportResult {
  created: number;
  updated: number;
  total: number;
  errors: string[];
  list_id: number;
  list_name: string;
}

export function usePreviewCSV() {
  return useMutation({
    mutationFn: async (csvData: string) => {
      const response = await api.post<{
        success: boolean;
        error?: string;
      } & CSVPreviewResult>('/api/marketing/contacts/import/preview', { csv_data: csvData });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la lecture du fichier');
      }

      return response.data as CSVPreviewResult;
    },
  });
}

export function useImportCSV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      csv_data: string;
      list_id?: number;
      list_name?: string;
      column_mapping: Record<string, string>;
    }) => {
      const response = await api.post<{
        success: boolean;
        error?: string;
      } & CSVImportResult>('/api/marketing/contacts/import', data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de l\'import');
      }

      return response.data as CSVImportResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-lists'] });
    },
  });
}
