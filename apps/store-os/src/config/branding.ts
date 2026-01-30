export const branding = {
  name: 'Quelyos Store',
  shortName: 'Store',
  description: 'E-commerce et gestion boutique en ligne',
  color: '#7C3AED',
  port: 3011,
  logo: '/favicon.svg',
  modules: ['store', 'marketing'],
} as const

export type Branding = typeof branding
