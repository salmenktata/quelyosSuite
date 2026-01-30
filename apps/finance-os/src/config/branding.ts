export const branding = {
  name: 'Quelyos Finance',
  shortName: 'Finance',
  description: 'Gestion financi\u00E8re, tr\u00E9sorerie et budgets',
  color: '#059669',
  port: 3010,
  logo: '/favicon.svg',
  modules: ['finance'],
} as const

export type Branding = typeof branding
