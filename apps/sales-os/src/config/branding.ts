export const branding = {
  name: 'Quelyos Sales',
  shortName: 'Sales',
  description: 'CRM et gestion commerciale',
  color: '#2563EB',
  port: 3013,
  logo: '/favicon.svg',
  modules: ['crm', 'marketing'],
} as const

export type Branding = typeof branding
