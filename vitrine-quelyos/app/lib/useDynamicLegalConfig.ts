"use client";

import { useState, useEffect } from "react";
import { legalConfig } from "./legal-config";
import type { LegalConfig } from "./legal-api";
import { getBackendUrl } from '@quelyos/config';

const BACKEND_URL = getBackendUrl(process.env.NODE_ENV as 'development' | 'production');

export function useDynamicLegalConfig(): LegalConfig {
  const [cfg, setCfg] = useState<LegalConfig>(legalConfig as unknown as LegalConfig);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/public/legal-config`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          const d = json.data;
          setCfg({
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
          });
        }
      })
      .catch(() => { /* Fallback sur valeurs statiques */ });
  }, []);

  return cfg;
}
