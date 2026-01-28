/**
 * API Client pour le self-service onboarding
 *
 * Endpoints:
 * - checkSlugAvailability: Vérifie si un slug est disponible
 * - createTenant: Crée un nouveau tenant
 * - getPlans: Récupère les plans d'abonnement
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8069';

interface CheckSlugResponse {
  success: boolean;
  available?: boolean;
  slug?: string;
  suggestion?: string;
  error?: string;
}

interface CreateTenantRequest {
  name: string;
  slug: string;
  email: string;
  password: string;
  plan?: string;
  sector?: string;
  primary_color?: string;
  stripe_customer_id?: string;
}

interface CreateTenantResponse {
  success: boolean;
  tenant_id?: number;
  tenant_code?: string;
  store_url?: string;
  admin_url?: string;
  status?: string;
  message?: string;
  error?: string;
  error_code?: string;
}

interface SubscriptionPlan {
  id: number;
  code: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_products: number;
  max_orders_per_year: number;
  features: string[];
  support_level: string;
  is_popular: boolean;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
}

interface GetPlansResponse {
  success: boolean;
  plans?: SubscriptionPlan[];
  error?: string;
}

/**
 * Vérifie si un slug est disponible pour un nouveau tenant
 */
export async function checkSlugAvailability(slug: string): Promise<CheckSlugResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/onboarding/check-slug`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return {
      success: false,
      error: 'Erreur de connexion au serveur',
    };
  }
}

/**
 * Crée un nouveau tenant via le wizard d'inscription
 */
export async function createTenant(request: CreateTenantRequest): Promise<CreateTenantResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/onboarding/create-tenant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating tenant:', error);
    return {
      success: false,
      error: 'Erreur de connexion au serveur',
      error_code: 'CONNECTION_ERROR',
    };
  }
}

/**
 * Récupère les plans d'abonnement disponibles
 */
export async function getSubscriptionPlans(): Promise<GetPlansResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/onboarding/plans`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching plans:', error);
    return {
      success: false,
      error: 'Erreur de connexion au serveur',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVISIONING ASYNCHRONE
// ═══════════════════════════════════════════════════════════════════════════

interface CreateTenantAsyncResponse {
  success: boolean;
  job_id?: number;
  tenant_code?: string;
  status_url?: string;
  error?: string;
}

interface ProvisioningJob {
  id: number;
  name: string;
  state: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  current_step: string;
  total_steps: number;
  completed_steps: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  store_url?: string;
  admin_url?: string;
  tenant_code: string;
}

interface JobStatusResponse {
  success: boolean;
  job?: ProvisioningJob;
  error?: string;
}

/**
 * Crée un tenant avec provisioning asynchrone
 */
export async function createTenantAsync(request: CreateTenantRequest): Promise<CreateTenantAsyncResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/onboarding/create-tenant-async`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: request.name,
        slug: request.slug,
        email: request.email,
        plan: request.plan,
        primary_color: request.primary_color,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error creating tenant async:', error);
    return {
      success: false,
      error: 'Erreur de connexion au serveur',
    };
  }
}

/**
 * Récupère le statut d'un job de provisioning
 */
export async function getJobStatus(jobId: number): Promise<JobStatusResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/onboarding/job-status/${jobId}`, {
      method: 'GET',
    });

    return await response.json();
  } catch (error) {
    console.error('Error getting job status:', error);
    return {
      success: false,
      error: 'Erreur de connexion',
    };
  }
}

/**
 * Poll le statut du job jusqu'à completion
 * @param jobId ID du job
 * @param onProgress Callback appelé à chaque mise à jour
 * @param intervalMs Intervalle de polling en ms (défaut: 1000)
 */
export async function pollJobStatus(
  jobId: number,
  onProgress: (job: ProvisioningJob) => void,
  intervalMs: number = 1000
): Promise<ProvisioningJob> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      const response = await getJobStatus(jobId);

      if (!response.success || !response.job) {
        reject(new Error(response.error || 'Erreur lors du suivi du provisioning'));
        return;
      }

      const job = response.job;
      onProgress(job);

      if (job.state === 'completed') {
        resolve(job);
      } else if (job.state === 'failed') {
        reject(new Error(job.error_message || 'Le provisioning a échoué'));
      } else {
        // Continuer à poll
        setTimeout(poll, intervalMs);
      }
    };

    poll();
  });
}

// Types exports
export type {
  CheckSlugResponse,
  CreateTenantRequest,
  CreateTenantResponse,
  SubscriptionPlan,
  GetPlansResponse,
  CreateTenantAsyncResponse,
  ProvisioningJob,
  JobStatusResponse,
};
