export const branding = {
  name: 'Quelyos Team',
  shortName: 'Team',
  description: 'Gestion des ressources humaines',
  color: '#0891B2',
  port: 3015,
  logo: '/favicon.svg',
  modules: ['hr'],
} as const

export type Branding = typeof branding
