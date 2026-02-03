/**
 * Mock API pour tester le wizard sans backend
 * À utiliser uniquement en développement
 */

export const MOCK_ENABLED = import.meta.env.DEV && import.meta.env.VITE_MOCK_WIZARD === 'true'

interface MockProvisioningResponse {
  success: boolean
  data: {
    tenant_id: number
    provisioning_job_id: string
  }
}

interface MockProvisioningStatus {
  success: boolean
  data: {
    status: 'pending' | 'running' | 'completed' | 'failed'
    progress_percent: number
    current_step: string
    tenant_id?: number
    store_url?: string
    admin_url?: string
    temp_password?: string
    error_message?: string
  }
}

interface MockSeedResponse {
  success: boolean
  job_id: string
}

interface MockSeedStatus {
  success: boolean
  data: {
    status: 'pending' | 'running' | 'completed' | 'error'
    progress_percent: number
    current_module: string | null
    results: Record<string, { count: number; duration_seconds: number }>
    error_message?: string
  }
}

// Simulateur de provisioning avec progression
class MockProvisioning {
  private jobs = new Map<string, { startTime: number; completed: boolean }>()

  start(_tenantName: string): MockProvisioningResponse {
    const jobId = `prov-mock-${Date.now()}`
    this.jobs.set(jobId, { startTime: Date.now(), completed: false })

    return {
      success: true,
      data: {
        tenant_id: Math.floor(Math.random() * 1000) + 100,
        provisioning_job_id: jobId,
      },
    }
  }

  getStatus(jobId: string): MockProvisioningStatus {
    const job = this.jobs.get(jobId)
    if (!job) {
      return {
        success: false,
        data: {
          status: 'failed',
          progress_percent: 0,
          current_step: 'Job not found',
          error_message: 'Invalid job ID',
        },
      }
    }

    const elapsed = Date.now() - job.startTime
    const duration = 30000 // 30 secondes pour le provisioning

    if (elapsed >= duration) {
      job.completed = true
      return {
        success: true,
        data: {
          status: 'completed',
          progress_percent: 100,
          current_step: 'Provisioning completed',
          tenant_id: 123,
          store_url: 'https://demo-boutique.quelyos.com',
          admin_url: 'https://admin.demo-boutique.quelyos.com',
          temp_password: 'DemoPass123!',
        },
      }
    }

    const progress = Math.floor((elapsed / duration) * 100)
    const steps = [
      'Creating company...',
      'Setting up database schema...',
      'Creating admin user...',
      'Configuring warehouse...',
      'Setting up product categories...',
      'Initializing payment methods...',
      'Configuring email templates...',
      'Setting up tax configuration...',
      'Initializing reports...',
      'Finalizing setup...',
    ]

    const stepIndex = Math.floor((progress / 100) * steps.length)
    const currentStep = steps[Math.min(stepIndex, steps.length - 1)]

    return {
      success: true,
      data: {
        status: 'running',
        progress_percent: progress,
        current_step: currentStep,
      },
    }
  }
}

// Simulateur de seed data
class MockSeedData {
  private jobs = new Map<
    string,
    { startTime: number; modules: string[]; volumetry: string; completed: boolean }
  >()

  start(config: { modules: string[]; volumetry: string }): MockSeedResponse {
    const jobId = `seed-mock-${Date.now()}`
    this.jobs.set(jobId, {
      startTime: Date.now(),
      modules: config.modules,
      volumetry: config.volumetry,
      completed: false,
    })

    return {
      success: true,
      job_id: jobId,
    }
  }

  getStatus(jobId: string): MockSeedStatus {
    const job = this.jobs.get(jobId)
    if (!job) {
      return {
        success: false,
        data: {
          status: 'error',
          progress_percent: 0,
          current_module: null,
          results: {},
          error_message: 'Invalid job ID',
        },
      }
    }

    const elapsed = Date.now() - job.startTime

    // Durée basée sur volumétrie
    const durations: Record<string, number> = {
      minimal: 20000, // 20s
      standard: 45000, // 45s
      large: 90000, // 90s
    }
    const duration = durations[job.volumetry] || 45000

    if (elapsed >= duration) {
      job.completed = true

      // Générer résultats basés sur volumétrie
      const counts: Record<string, number> = {
        minimal: 25,
        standard: 250,
        large: 625,
      }
      const baseCount = counts[job.volumetry] || 250

      const results: Record<string, { count: number; duration_seconds: number }> = {}
      job.modules.forEach((module, _idx) => {
        results[module] = {
          count: baseCount + Math.floor(Math.random() * 50),
          duration_seconds: 3 + Math.random() * 5,
        }
      })

      return {
        success: true,
        data: {
          status: 'completed',
          progress_percent: 100,
          current_module: null,
          results,
        },
      }
    }

    const progress = Math.floor((elapsed / duration) * 100)
    const moduleIndex = Math.floor((progress / 100) * job.modules.length)
    const currentModule = job.modules[Math.min(moduleIndex, job.modules.length - 1)]

    return {
      success: true,
      data: {
        status: 'running',
        progress_percent: progress,
        current_module: currentModule,
        results: {},
      },
    }
  }
}

// Instances singleton
const mockProvisioning = new MockProvisioning()
const mockSeedData = new MockSeedData()

export const mockWizardApi = {
  provisioning: mockProvisioning,
  seedData: mockSeedData,
}
