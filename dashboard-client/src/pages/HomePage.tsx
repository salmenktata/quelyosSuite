import { Link } from 'react-router-dom'
import { getAppUrl } from '@quelyos/config'

const SITE_URL = import.meta.env.VITE_VITRINE_URL || getAppUrl('vitrine', import.meta.env.MODE as any)

// Icônes inline
const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
)

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
)

const BarChart = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const Users = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const Package = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const Zap = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

export default function HomePage() {
  const features = [
    {
      icon: BarChart,
      title: 'Finance',
      description: 'Gestion complète de trésorerie et prévisions',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Package,
      title: 'Stock',
      description: 'Inventaire multi-sites en temps réel',
      color: 'from-orange-500 to-amber-500',
    },
    {
      icon: Users,
      title: 'CRM',
      description: 'Clients et pipeline de vente',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: Zap,
      title: 'IA Intégrée',
      description: 'Intelligence artificielle native',
      color: 'from-indigo-500 to-blue-500',
    },
  ]

  const stats = [
    { value: '8', label: 'Modules intégrés' },
    { value: '2 500+', label: 'Entreprises' },
    { value: '99.9%', label: 'Disponibilité' },
    { value: '24/7', label: 'Support' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-violet-950">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-[600px] w-[600px] animate-pulse rounded-full bg-indigo-500/20 blur-[150px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] animate-pulse rounded-full bg-violet-500/20 blur-[120px] delay-1000" />
      </div>

      {/* Grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Quelyos</h1>
              <p className="text-xs text-indigo-200/80">Backoffice</p>
            </div>
          </Link>

          <Link
            to="/login"
            className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300 transition-all hover:bg-indigo-500/20"
          >
            <span>Connexion</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20 md:py-32">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span>Plateforme ERP tout-en-un</span>
            </div>

            {/* Titre principal */}
            <h2 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl">
              Pilotez votre entreprise
              <br />
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent">
                depuis une seule plateforme
              </span>
            </h2>

            {/* Sous-titre */}
            <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-300/90 md:text-xl">
              Finance, Stock, CRM, RH, Marketing, Point de Vente, Support — 9 modules intégrés pour simplifier votre gestion quotidienne.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/login"
                className="group flex h-14 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-8 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:from-indigo-600 hover:to-violet-700 hover:shadow-indigo-500/40"
              >
                <span>Accéder au backoffice</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href={`${SITE_URL}/register`}
                className="flex h-14 items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-900/30 px-8 font-medium text-white transition-all hover:border-slate-600/50 hover:bg-slate-800/50"
              >
                <span>Créer un compte</span>
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/10 bg-slate-900/30 p-6 text-center backdrop-blur-sm">
                <div className="mb-2 text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h3 className="mb-4 text-3xl font-bold text-white md:text-4xl">Modules intégrés</h3>
            <p className="text-lg text-slate-300/90">Tout ce dont vous avez besoin pour gérer votre activité</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-slate-900/70"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h4 className="mb-2 text-lg font-semibold text-white">{feature.title}</h4>
                <p className="text-sm text-slate-400">{feature.description}</p>

                {/* Hover effect */}
                <div className="absolute inset-0 -z-10 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-5`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="container mx-auto max-w-4xl">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur-sm md:p-12">
            <div className="mb-8 text-center">
              <h3 className="mb-4 text-2xl font-bold text-white md:text-3xl">Pourquoi choisir Quelyos ?</h3>
            </div>

            <div className="space-y-4">
              {[
                'Interface unifiée pour tous vos besoins',
                'Données synchronisées en temps réel',
                'IA intégrée pour automatiser vos tâches',
                'Hébergement sécurisé en France',
                'Support dédié 24/7',
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-indigo-400" />
                  <span className="text-slate-300">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-indigo-400 transition-colors hover:text-indigo-300"
              >
                <span className="font-medium">Commencer maintenant</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-900/50 px-6 py-8 backdrop-blur-xl">
        <div className="container mx-auto text-center">
          <p className="text-sm text-slate-400">© 2026 Quelyos. Backoffice ERP tout-en-un.</p>
        </div>
      </footer>
    </div>
  )
}
