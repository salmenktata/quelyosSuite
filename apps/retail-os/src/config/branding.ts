export const branding = {
  name: 'Quelyos Retail',
  shortName: 'Retail',
  description: 'Point de vente omnicanal',
  color: '#DC2626',
  port: 3014,
  logo: '/favicon.svg',
  modules: ['pos', 'store', 'stock'],
} as const

export type Branding = typeof branding
