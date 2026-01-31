/**
 * Hooks React pour Calendriers Entrepôts OCA (stock_warehouse_calendar module).
 * 
 * Fonctionnalités:
 * - Liste entrepôts avec calendriers assignés
 * - Assignation calendrier à un entrepôt
 * - Gestion calendriers ressources (création, liste)
 * - Calcul dates livraison selon jours ouvrables
 */

import { useState, useEffect, useCallback } from 'react';
import { api as apiClient } from '@/lib/api';

// ============================================================================
// TYPES
// ============================================================================

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  calendar_id: number | null;
  calendar_name: string | null;
  calendar_tz: string | null;
  company_id: number;
  company_name: string;
}

export interface CalendarAttendance {
  dayofweek: string;
  day_period: 'morning' | 'afternoon';
  hour_from: number;
  hour_to: number;
  name: string;
}

export interface ResourceCalendar {
  id: number;
  name: string;
  tz: string;
  hours_per_day: number;
  full_time_required_hours: number;
  company_id: number | null;
  attendances: CalendarAttendance[];
}

export interface CreateCalendarParams {
  name: string;
  tz?: string;
  hours_per_day?: number;
  attendances?: Array<{
    dayofweek: string;
    hour_from: number;
    hour_to: number;
    name?: string;
    day_period?: 'morning' | 'afternoon';
  }>;
  tenant_id?: number;
}

// ============================================================================
// HOOK: useWarehouses - Liste entrepôts avec calendriers
// ============================================================================

export function useWarehouses(tenantId?: number) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.post('/api/ecommerce/warehouses', {
        params: {
          tenant_id: tenantId,
          limit: 100,
          offset: 0,
        },
      });

      if (result.data.success) {
        setWarehouses(result.data.data.warehouses || []);
        setTotalCount(result.data.data.total_count || 0);
      } else {
        setError(result.data.error || 'Erreur lors du chargement des entrepôts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  return {
    warehouses,
    totalCount,
    loading,
    error,
    refetch: fetchWarehouses,
  };
}

// ============================================================================
// HOOK: useSetWarehouseCalendar - Assigner calendrier à entrepôt
// ============================================================================

export function useSetWarehouseCalendar() {
  const [setting, setSetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setCalendar = async (warehouseId: number, calendarId: number | null) => {
    try {
      setSetting(true);
      setError(null);

      const result = await apiClient.post(`/api/ecommerce/warehouses/${warehouseId}/set-calendar`, {
        params: {
          calendar_id: calendarId,
        },
      });

      if (result.data.success) {
        return result.data.data.warehouse;
      } else {
        setError(result.data.error || 'Erreur lors de l\'assignation');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
      return null;
    } finally {
      setSetting(false);
    }
  };

  return {
    setCalendar,
    setting,
    error,
  };
}

// ============================================================================
// HOOK: useCalendars - Liste calendriers ressources
// ============================================================================

export function useCalendars(tenantId?: number) {
  const [calendars, setCalendars] = useState<ResourceCalendar[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendars = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.post('/api/ecommerce/calendars', {
        params: {
          tenant_id: tenantId,
          limit: 100,
          offset: 0,
        },
      });

      if (result.data.success) {
        setCalendars(result.data.data.calendars || []);
        setTotalCount(result.data.data.total_count || 0);
      } else {
        setError(result.data.error || 'Erreur lors du chargement des calendriers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchCalendars();
  }, [fetchCalendars]);

  return {
    calendars,
    totalCount,
    loading,
    error,
    refetch: fetchCalendars,
  };
}

// ============================================================================
// HOOK: useCreateCalendar - Créer calendrier
// ============================================================================

export function useCreateCalendar() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCalendar = async (data: CreateCalendarParams) => {
    try {
      setCreating(true);
      setError(null);

      const result = await apiClient.post('/api/ecommerce/calendars/create', {
        params: {
          name: data.name,
          tz: data.tz || 'UTC',
          hours_per_day: data.hours_per_day || 8.0,
          attendances: data.attendances,
          tenant_id: data.tenant_id,
        },
      });

      if (result.data.success) {
        return result.data.data.calendar;
      } else {
        setError(result.data.error || 'Erreur lors de la création');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
      return null;
    } finally {
      setCreating(false);
    }
  };

  return {
    createCalendar,
    creating,
    error,
  };
}

// ============================================================================
// HOOK: usePlanDeliveryDate - Calculer date livraison
// ============================================================================

export function usePlanDeliveryDate() {
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planDelivery = async (
    warehouseId: number,
    dateFrom: string,
    deltaDays: number
  ): Promise<{ deliveryDate: string; usedCalendar: string | null } | null> => {
    try {
      setPlanning(true);
      setError(null);

      const result = await apiClient.post(`/api/ecommerce/warehouses/${warehouseId}/plan-delivery`, {
        params: {
          date_from: dateFrom,
          delta_days: deltaDays,
        },
      });

      if (result.data.success) {
        return {
          deliveryDate: result.data.data.delivery_date,
          usedCalendar: result.data.data.used_calendar || null,
        };
      } else {
        setError(result.data.error || 'Erreur lors du calcul');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
      return null;
    } finally {
      setPlanning(false);
    }
  };

  return {
    planDelivery,
    planning,
    error,
  };
}

// ============================================================================
// HELPER: Générer horaires standards (Lun-Ven 8h-17h)
// ============================================================================

export function getStandardWorkingHours(): CreateCalendarParams['attendances'] {
  const days = ['0', '1', '2', '3', '4']; // Lun-Ven
  const attendances: CreateCalendarParams['attendances'] = [];

  days.forEach((dayofweek) => {
    // Matin 8h-12h
    attendances.push({
      dayofweek,
      hour_from: 8.0,
      hour_to: 12.0,
      day_period: 'morning',
      name: 'Matin',
    });
    // Après-midi 13h-17h
    attendances.push({
      dayofweek,
      hour_from: 13.0,
      hour_to: 17.0,
      day_period: 'afternoon',
      name: 'Après-midi',
    });
  });

  return attendances;
}
