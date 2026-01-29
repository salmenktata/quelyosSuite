import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type EmailProvider = 'smtp' | 'brevo' | 'sendgrid' | 'mailgun';
export type SmtpEncryption = 'none' | 'tls' | 'ssl';

export interface EmailConfig {
  provider: EmailProvider;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpEncryption: SmtpEncryption;
  apiKey: string;
  emailFrom: string;
  emailFromName: string;
  isActive: boolean;
  storeEnabled: boolean;
  financeEnabled: boolean;
  marketingEnabled: boolean;
  crmEnabled: boolean;
  hrEnabled: boolean;
  stockEnabled: boolean;
}

export interface UpdateEmailConfigData {
  provider?: EmailProvider;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpEncryption?: SmtpEncryption;
  apiKey?: string;
  emailFrom?: string;
  emailFromName?: string;
  isActive?: boolean;
  storeEnabled?: boolean;
  financeEnabled?: boolean;
  marketingEnabled?: boolean;
  crmEnabled?: boolean;
  hrEnabled?: boolean;
  stockEnabled?: boolean;
}

export interface TestEmailData {
  testEmail?: string;
}

export function useEmailConfig() {
  return useQuery({
    queryKey: ['email-config'],
    queryFn: async () => {
      const response = await api.post<{ success: boolean; error?: string; config: EmailConfig }>(
        '/api/admin/email/config',
        {}
      );
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch email config');
      }
      return response.data.config;
    },
  });
}

export function useUpdateEmailConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEmailConfigData) => {
      const response = await api.post<{ success: boolean; error?: string; config: EmailConfig }>(
        '/api/admin/email/config/update',
        data
      );
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update email config');
      }
      return response.data.config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-config'] });
    },
  });
}

export function useTestEmailConnection() {
  return useMutation({
    mutationFn: async (data?: TestEmailData) => {
      const response = await api.post<{ success: boolean; error?: string; message?: string }>(
        '/api/admin/email/test',
        data || {}
      );
      if (!response.data.success) {
        throw new Error(response.data.error || 'Connection test failed');
      }
      return response.data;
    },
  });
}
