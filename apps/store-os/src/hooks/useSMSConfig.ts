import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SMSConfig {
  apiKey: string;
  senderName: string;
  endpoint: string;
  isActive: boolean;
  storeEnabled: boolean;
  financeEnabled: boolean;
  marketingEnabled: boolean;
  crmEnabled: boolean;
  hrEnabled: boolean;
  stockEnabled: boolean;
}

export interface SMSPreferences {
  abandonedCartEmailEnabled: boolean;
  abandonedCartSmsEnabled: boolean;
  abandonedCartDelay: number; // hours
  orderConfirmationEmailEnabled: boolean;
  orderConfirmationSmsEnabled: boolean;
  shippingUpdateEmailEnabled: boolean;
  shippingUpdateSmsEnabled: boolean;
}

export interface SMSLog {
  id: number;
  mobile: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'fallback_email';
  notificationType: string;
  createdAt: string;
}

export interface SMSQuota {
  used: number;
  total: number;
  period: string; // "month"
}

export interface SendTestSMSData {
  mobile: string;
  message: string;
}

// Note: Ces endpoints seront créés dans le module quelyos_sms_tn (Task #7)
// Pour l'instant, on crée les hooks avec les structures de données attendues

export function useSMSConfig() {
  return useQuery({
    queryKey: ['sms-config'],
    queryFn: async () => {
      const response = await api.post<{ success: boolean; error?: string; config: SMSConfig }>('/api/admin/sms/config', {});
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch SMS config');
      }
      return response.data.config;
    },
  });
}

export function useUpdateSMSConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<SMSConfig>) => {
      const response = await api.post<{ success: boolean; error?: string; config: SMSConfig }>('/api/admin/sms/config/update', data);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update SMS config');
      }
      return response.data.config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-config'] });
    },
  });
}

export function useSMSPreferences() {
  return useQuery({
    queryKey: ['sms-preferences'],
    queryFn: async () => {
      const response = await api.post<{ success: boolean; error?: string; preferences: SMSPreferences }>('/api/admin/sms/preferences', {});
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch SMS preferences');
      }
      return response.data.preferences;
    },
  });
}

export function useUpdateSMSPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<SMSPreferences>) => {
      const response = await api.post<{ success: boolean; error?: string; preferences: SMSPreferences }>('/api/admin/sms/preferences/update', data);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update SMS preferences');
      }
      return response.data.preferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-preferences'] });
    },
  });
}

export function useSendTestSMS() {
  return useMutation({
    mutationFn: async (data: SendTestSMSData) => {
      const response = await api.post('/api/admin/sms/send-test', data);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to send test SMS');
      }
      return response.data;
    },
  });
}

export function useSMSHistory() {
  return useQuery({
    queryKey: ['sms-history'],
    queryFn: async () => {
      const response = await api.post<{ success: boolean; error?: string; logs: SMSLog[] }>('/api/admin/sms/history', { limit: 10 });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch SMS history');
      }
      return response.data.logs;
    },
    refetchInterval: 30000, // Refresh every 30s
  });
}

export function useSMSQuota() {
  return useQuery({
    queryKey: ['sms-quota'],
    queryFn: async () => {
      const response = await api.post<{ success: boolean; error?: string; quota: SMSQuota }>('/api/admin/sms/quota', {});
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch SMS quota');
      }
      return response.data.quota;
    },
  });
}
