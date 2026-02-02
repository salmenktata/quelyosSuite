/**
 * Hook React pour workflows automation Marketing.
 * 
 * Endpoints :
 * - listAutomations() : Liste workflows
 * - getAutomation(id) : Détail workflow + activités
 * - startAutomation(id) : Activer workflow
 * - stopAutomation(id) : Désactiver workflow
 * - listParticipants(id) : Liste participants workflow
 * - addParticipant(id, partnerId) : Ajouter contact au workflow
 * - deleteAutomation(id) : Supprimer workflow
 */

import { useState } from 'react';
import { api } from '@/lib/api';

export interface AutomationWorkflow {
  id: number;
  name: string;
  active: boolean;
  trigger_type: string;
  participant_count: number;
  active_participant_count: number;
  completed_participant_count: number;
  activity_count: number;
}

export interface AutomationActivity {
  id: number;
  name: string;
  sequence: number;
  activity_type: string;
  wait_days: number;
  wait_hours: number;
}

export interface AutomationDetail extends AutomationWorkflow {
  filter_domain: string;
  activities: AutomationActivity[];
}

export interface AutomationParticipant {
  id: number;
  partner_id: number;
  partner_name: string;
  partner_email: string;
  state: string;
  activities_done: number;
  activities_total: number;
  progress_percent: number;
  current_activity: string | null;
  next_activity_date: string | null;
}

export function useMarketingAutomation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listAutomations = async (params: {
    tenant_id?: number;
    active_only?: boolean;
    limit?: number;
    offset?: number;
  } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<{
        success: boolean;
        automations: AutomationWorkflow[];
        total_count: number;
        error?: string;
      }>('/api/ecommerce/marketing/automations', params);
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur chargement workflows');
      }
      
      return result.data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAutomation = async (automationId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<{
        success: boolean;
        automation: AutomationDetail;
        error?: string;
      }>(`/api/ecommerce/marketing/automations/${automationId}`, {});
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Workflow non trouvé');
      }
      
      return result.data.automation;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startAutomation = async (automationId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<{
        success: boolean;
        active: boolean;
        error?: string;
      }>(`/api/ecommerce/marketing/automations/${automationId}/start`, {});
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur activation workflow');
      }
      
      return result.data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const stopAutomation = async (automationId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<{
        success: boolean;
        active: boolean;
        error?: string;
      }>(`/api/ecommerce/marketing/automations/${automationId}/stop`, {});
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur désactivation workflow');
      }
      
      return result.data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const listParticipants = async (automationId: number, params: {
    state?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<{
        success: boolean;
        participants: AutomationParticipant[];
        total_count: number;
        error?: string;
      }>(`/api/ecommerce/marketing/automations/${automationId}/participants`, params);
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur chargement participants');
      }
      
      return result.data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = async (automationId: number, partnerId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<{
        success: boolean;
        participant: { id: number; state: string };
        error?: string;
      }>(`/api/ecommerce/marketing/automations/${automationId}/add-participant`, { partner_id: partnerId });
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur ajout participant');
      }
      
      return result.data.participant;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAutomation = async (automationId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<{
        success: boolean;
        error?: string;
      }>(`/api/ecommerce/marketing/automations/${automationId}/delete`, {});
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Erreur suppression workflow');
      }
      
      return result.data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    listAutomations,
    getAutomation,
    startAutomation,
    stopAutomation,
    listParticipants,
    addParticipant,
    deleteAutomation,
    loading,
    error,
  };
}
