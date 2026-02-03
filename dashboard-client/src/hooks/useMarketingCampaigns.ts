/**
 * Hook React pour gérer les campagnes marketing (mass_mailing natif)
 *
 * Endpoints :
 * - list_campaigns() : Liste campagnes avec filtres
 * - get_campaign(id) : Détail campagne
 * - create_campaign() : Créer campagne
 * - send_campaign(id) : Envoyer campagne
 * - get_campaign_stats(id) : Statistiques campagne
 * - delete_campaign(id) : Supprimer campagne
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MarketingCampaign, CampaignStats } from '@/types';

export interface CampaignsQueryParams {
  tenant_id?: number;
  state?: string;
  channel?: string;
  limit?: number;
  offset?: number;
}

export function useMarketingCampaigns(params?: CampaignsQueryParams) {
  return useQuery({
    queryKey: ['marketing-campaigns', params],
    queryFn: async () => {
      const result = await api.post<{
        success: boolean;
        campaigns: MarketingCampaign[];
        total_count: number;
        error?: string;
      }>('/api/ecommerce/marketing/campaigns', params || {});

      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur lors du chargement des campagnes');
      }

      return result.data;
    },
  });
}

export function useMarketingCampaign(campaignId: number) {
  return useQuery({
    queryKey: ['marketing-campaign', campaignId],
    queryFn: async () => {
      const result = await api.post<{
        success: boolean;
        campaign: MarketingCampaign;
        error?: string;
      }>(`/api/ecommerce/marketing/campaigns/${campaignId}`, {});

      if (!result.data.success) {
        throw new Error(result.data.error || 'Campagne non trouvée');
      }

      return result.data.campaign;
    },
    enabled: !!campaignId,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      subject: string;
      body_html: string;
      mailing_model?: string;
      mailing_domain?: string;
      tenant_id?: number;
    }) => {
      const result = await api.post<{
        success: boolean;
        campaign: MarketingCampaign;
        error?: string;
      }>('/api/ecommerce/marketing/campaigns/create', data);

      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur lors de la création');
      }

      return result.data.campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
    },
  });
}

export function useSendCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: number) => {
      const result = await api.post<{
        success: boolean;
        state: string;
        error?: string;
      }>(`/api/ecommerce/marketing/campaigns/${campaignId}/send`, {});

      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur lors de l\'envoi');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-campaign'] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: number) => {
      const result = await api.post<{
        success: boolean;
        error?: string;
      }>(`/api/ecommerce/marketing/campaigns/${campaignId}/delete`, {});

      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur lors de la suppression');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
    },
  });
}

export function useCampaignStats(campaignId: number) {
  return useQuery({
    queryKey: ['marketing-campaign-stats', campaignId],
    queryFn: async () => {
      const result = await api.post<{
        success: boolean;
        stats: CampaignStats;
        error?: string;
      }>(`/api/ecommerce/marketing/campaigns/${campaignId}/stats`, {});

      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur lors du chargement des stats');
      }

      return result.data.stats;
    },
    enabled: !!campaignId,
  });
}

export function useDuplicateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: number) => {
      const result = await api.post<{
        success: boolean;
        campaign: MarketingCampaign;
        error?: string;
      }>(`/api/ecommerce/marketing/campaigns/${campaignId}/duplicate`, {});

      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur lors de la duplication');
      }

      return result.data.campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
    },
  });
}

// Alias pour compatibilité avec code existant
export const useCampaign = useMarketingCampaign;
