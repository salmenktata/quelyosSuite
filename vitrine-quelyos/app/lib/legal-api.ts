import { legalConfig } from './legal-config'
import { getBackendUrl } from '@quelyos/config';

export interface LegalConfig {
  company: {
    name: string
    legalName: string
    legalForm: string
    capital: string
    siret: string
    siren: string
    rcs: string
    tvaIntra: string
    address: string
    director: string
    directorTitle: string
  }
  contact: {
    email: string
    legal: string
    dpo: string
    support: string
  }
  hosting: {
    provider: string
    address: string
    country: string
  }
  jurisdiction: {
    country: string
    law: string
    courts: string
  }
  mediator: {
    name: string
    website: string
    info: string
  }
  lastUpdate: string
}

interface LegalApiResponse {
  success: boolean
  data?: {
    company_name: string
    legal_form: string
    capital: string
    siret: string
    siren: string
    rcs: string
    tva_intra: string
    address: string
    director: string
    director_title: string
    email: string
    email_legal: string
    email_dpo: string
    email_support: string
    hosting_provider: string
    hosting_address: string
    hosting_country: string
    jurisdiction_courts: string
    mediator_name: string
    mediator_website: string
  }
}

const BACKEND_URL = getBackendUrl(process.env.NODE_ENV as 'development' | 'production')

/**
 * Charge la config légale depuis le backend, avec fallback sur les valeurs statiques.
 * Cache de 5 minutes via next revalidate.
 */
export async function fetchLegalConfig(): Promise<LegalConfig> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/public/legal-config`, {
      next: { revalidate: 300 },
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const json: LegalApiResponse = await res.json()

    if (!json.success || !json.data) throw new Error('Invalid response')

    const d = json.data

    return {
      company: {
        name: d.company_name || legalConfig.company.name,
        legalName: d.company_name || legalConfig.company.legalName,
        legalForm: d.legal_form || legalConfig.company.legalForm,
        capital: d.capital || legalConfig.company.capital,
        siret: d.siret || legalConfig.company.siret,
        siren: d.siren || legalConfig.company.siren,
        rcs: d.rcs || legalConfig.company.rcs,
        tvaIntra: d.tva_intra || legalConfig.company.tvaIntra,
        address: d.address || legalConfig.company.address,
        director: d.director || legalConfig.company.director,
        directorTitle: d.director_title || legalConfig.company.directorTitle,
      },
      contact: {
        email: d.email || legalConfig.contact.email,
        legal: d.email_legal || legalConfig.contact.legal,
        dpo: d.email_dpo || legalConfig.contact.dpo,
        support: d.email_support || legalConfig.contact.support,
      },
      hosting: {
        provider: d.hosting_provider || legalConfig.hosting.provider,
        address: d.hosting_address || legalConfig.hosting.address,
        country: d.hosting_country || legalConfig.hosting.country,
      },
      jurisdiction: {
        country: legalConfig.jurisdiction.country,
        law: legalConfig.jurisdiction.law,
        courts: d.jurisdiction_courts || legalConfig.jurisdiction.courts,
      },
      mediator: {
        name: d.mediator_name || legalConfig.mediator.name,
        website: d.mediator_website || legalConfig.mediator.website,
        info: legalConfig.mediator.info,
      },
      lastUpdate: legalConfig.lastUpdate,
    }
  } catch (_err) {
    return { ...legalConfig }
  }
}
