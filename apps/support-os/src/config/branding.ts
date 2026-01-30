export const branding = {
  name: 'Quelyos Support',
  shortName: 'Support',
  description: 'Helpdesk et support client',
  color: '#9333EA',
  port: 3016,
  logo: '/favicon.svg',
  modules: ['support', 'crm'],
} as const

export type Branding = typeof branding
