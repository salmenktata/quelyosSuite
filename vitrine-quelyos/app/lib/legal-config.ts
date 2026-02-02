export const legalConfig = {
  company: {
    name: 'Quelyos',
    legalName: 'Quelyos SAS',
    legalForm: 'Société par Actions Simplifiée (SAS)',
    capital: '[À COMPLÉTER APRÈS IMMATRICULATION]',
    siret: '[À COMPLÉTER APRÈS IMMATRICULATION]',
    siren: '[À COMPLÉTER APRÈS IMMATRICULATION]',
    rcs: '[À COMPLÉTER APRÈS IMMATRICULATION — RCS de {ville}]',
    tvaIntra: '[À COMPLÉTER APRÈS IMMATRICULATION — FR XX XXXXXXXXX]',
    address: '[À COMPLÉTER APRÈS IMMATRICULATION]',
    director: '[À COMPLÉTER APRÈS IMMATRICULATION]',
    directorTitle: 'Président',
  },
  contact: {
    email: 'contact@quelyos.com',
    legal: 'legal@quelyos.com',
    dpo: 'dpo@quelyos.com',
    support: 'support@quelyos.com',
  },
  hosting: {
    provider: 'Contabo GmbH',
    address: 'Aschauer Straße 32a, 81549 Munich, Allemagne',
    country: 'Allemagne (Union Européenne)',
  },
  jurisdiction: {
    country: 'France',
    law: 'droit français',
    courts: '[À COMPLÉTER — Tribunaux compétents de {ville du siège social}]',
  },
  mediator: {
    name: '[À COMPLÉTER — Médiateur de la consommation désigné]',
    website: '[À COMPLÉTER]',
    info: 'Conformément à l\'article L612-1 du Code de la consommation, tout consommateur a le droit de recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable du litige.',
  },
  lastUpdate: 'Février 2026',
} as const;

export type LegalConfigStatic = typeof legalConfig;
