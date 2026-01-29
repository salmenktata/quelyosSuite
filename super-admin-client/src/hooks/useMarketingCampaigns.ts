import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
}

export interface CampaignRates {
  delivery: number;
  open: number;
  click: number;
}

export interface Campaign {
  id: number;
  name: string;
  channel: 'email' | 'sms';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  subject: string;
  content: string;
  sms_message: string;
  contact_list_id: number | null;
  contact_list_name: string;
  recipient_count: number;
  scheduled_date: string | null;
  sent_date: string | null;
  stats: CampaignStats;
  rates: CampaignRates;
  created_at: string;
  updated_at: string;
}

export interface CampaignFilters {
  channel?: 'email' | 'sms';
  status?: string;
  limit?: number;
  offset?: number;
}

export interface CreateCampaignData {
  name: string;
  channel: 'email' | 'sms';
  subject?: string;
  content?: string;
  sms_message?: string;
  contact_list_id?: number;
  scheduled_date?: string;
}

export interface UpdateCampaignData {
  name?: string;
  subject?: string;
  content?: string;
  sms_message?: string;
  contact_list_id?: number;
  scheduled_date?: string;
}

export function useMarketingCampaigns(filters: CampaignFilters = {}) {
  return useQuery({
    queryKey: ['marketing-campaigns', filters],
    queryFn: async () => {
      const response = await api.post<{
        success: boolean;
        error?: string;
        campaigns: Campaign[];
        total: number;
      }>('/api/marketing/campaigns', filters);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement des campagnes');
      }

      return {
        campaigns: response.data.campaigns,
        total: response.data.total,
      };
    },
  });
}

export function useCampaign(id: number | null) {
  return useQuery({
    queryKey: ['marketing-campaign', id],
    queryFn: async () => {
      if (!id) return null;

      const response = await api.post<{
        success: boolean;
        error?: string;
        campaign: Campaign;
      }>(`/api/marketing/campaigns/${id}`, {});

      if (!response.data.success) {
        throw new Error(response.data.error || 'Campagne introuvable');
      }

      return response.data.campaign;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCampaignData) => {
      const response = await api.post<{
        success: boolean;
        error?: string;
        campaign: Campaign;
      }>('/api/marketing/campaigns/create', data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la création');
      }

      return response.data.campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-dashboard'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCampaignData }) => {
      const response = await api.post<{
        success: boolean;
        error?: string;
        campaign: Campaign;
      }>(`/api/marketing/campaigns/${id}/update`, data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la mise à jour');
      }

      return response.data.campaign;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-campaign', id] });
    },
  });
}

export function useSendCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{
        success: boolean;
        error?: string;
        campaign: Campaign;
      }>(`/api/marketing/campaigns/${id}/send`, {});

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de l\'envoi');
      }

      return response.data.campaign;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['marketing-dashboard'] });
    },
  });
}

export function useScheduleCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, scheduled_date }: { id: number; scheduled_date: string }) => {
      const response = await api.post<{
        success: boolean;
        error?: string;
        campaign: Campaign;
      }>(`/api/marketing/campaigns/${id}/schedule`, { scheduled_date });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la planification');
      }

      return response.data.campaign;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-campaign', id] });
    },
  });
}

export function useDuplicateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{
        success: boolean;
        error?: string;
        campaign: Campaign;
      }>(`/api/marketing/campaigns/${id}/duplicate`, {});

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la duplication');
      }

      return response.data.campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{
        success: boolean;
        error?: string;
      }>(`/api/marketing/campaigns/${id}/delete`, {});

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la suppression');
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-dashboard'] });
    },
  });
}
