import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MarketingCampaign } from '@quelyos/types';

export interface MarketingDashboardStats {
  active_campaigns: number;
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  sms_sent: number;
  total_contacts: number;
  avg_open_rate: number;
  avg_click_rate: number;
  email_variation: number;
  sms_variation: number;
}

export interface MarketingDashboardData {
  stats: MarketingDashboardStats;
  recent_campaigns: MarketingCampaign[];
}

export function useMarketingDashboard() {
  return useQuery({
    queryKey: ['marketing-dashboard'],
    queryFn: async () => {
      const response = await api.post<{
        success: boolean;
        error?: string;
        stats: MarketingDashboardStats;
        recent_campaigns: MarketingCampaign[];
      }>('/api/marketing/dashboard', {});

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement du dashboard');
      }

      return {
        stats: response.data.stats,
        recent_campaigns: response.data.recent_campaigns,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
