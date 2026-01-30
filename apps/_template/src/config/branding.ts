export const branding = {
  name: 'Quelyos SaaS',
  shortName: 'SaaS',
  description: 'Application SaaS Quelyos',
  color: '#6366F1',
  port: 3010,
  logo: '/favicon.svg',
  modules: [] as string[],
} as const

export type Branding = typeof branding
