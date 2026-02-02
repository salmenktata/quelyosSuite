/**
 * Hook React pour tracking avancé Marketing.
 * 
 * Endpoints :
 * - getCampaignTracking(id) : Stats détaillées + top clickers + inactifs
 * - getCampaignHeatmap(id) : Clics par lien
 * - getCampaignTimeline(id, limit) : Timeline interactions chronologique
 */

import { useState } from 'react';
import { api } from '@/lib/api';

export interface TrackingStats {
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  unique_opens: number;
  unique_clicks: number;
  total_open_events: number;
  total_click_events: number;
  avg_open_time_hours: number;
  avg_engagement_score: number;
  top_clickers: Array<{
    email: string;
    clicks: number;
    opens: number;
    engagement_score: number;
  }>;
  inactive_contacts: Array<{
    email: string;
    sent_date: string | null;
  }>;
  inactive_count: number;
}

export interface HeatmapLink {
  url: string;
  clicks: number;
  unique_clickers: number;
}

export interface TimelineEvent {
  type: 'open' | 'click';
  date: string;
  email: string;
  url?: string;
  count?: number;
}

export function useMarketingTracking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCampaignTracking = async (campaignId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<{
        success: boolean;
        tracking: TrackingStats;
        error?: string;
      }>(`/api/ecommerce/marketing/campaigns/${campaignId}/tracking`, {});
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur chargement tracking');
      }
      
      return result.data.tracking;
    } catch (_err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getCampaignHeatmap = async (campaignId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<{
        success: boolean;
        heatmap: HeatmapLink[];
        error?: string;
      }>(`/api/ecommerce/marketing/campaigns/${campaignId}/heatmap`, {});
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur chargement heatmap');
      }
      
      return result.data.heatmap;
    } catch (_err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getCampaignTimeline = async (campaignId: number, limit = 100) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<{
        success: boolean;
        timeline: TimelineEvent[];
        total_events: number;
        error?: string;
      }>(`/api/ecommerce/marketing/campaigns/${campaignId}/timeline`, { limit });
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur chargement timeline');
      }
      
      return {
        timeline: result.data.timeline,
        total_events: result.data.total_events,
      };
    } catch (_err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    getCampaignTracking,
    getCampaignHeatmap,
    getCampaignTimeline,
    loading,
    error,
  };
}
