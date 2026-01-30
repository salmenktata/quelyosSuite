export const branding = {
  name: 'Quelyos Copilote',
  shortName: 'Copilote',
  description: 'GMAO, gestion des stocks et maintenance',
  color: '#EA580C',
  port: 3012,
  logo: '/favicon.svg',
  modules: ['stock', 'hr'],
} as const

export type Branding = typeof branding
