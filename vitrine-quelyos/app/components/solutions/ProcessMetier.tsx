/**
 * Composant visualisation du processus métier
 * Affiche comment la solution s'intègre dans le quotidien
 */

interface ProcessStep {
  title: string;
  description: string;
  icon: string;
}

interface ProcessMetierProps {
  steps: ProcessStep[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function ProcessMetier({
  steps,
  title = "Comment ça fonctionne au quotidien",
  subtitle = "Un workflow simplifié qui s'intègre naturellement dans votre activité",
  className = ""
}: ProcessMetierProps) {
  return (
    <section className={`py-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg leading-8 text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Process steps */}
        <div className="mx-auto mt-16 max-w-4xl sm:mt-20">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-indigo-900/40 via-violet-900/40 to-indigo-900/40 lg:left-1/2" />

            {/* Steps */}
            <div className="space-y-12">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`relative flex items-start gap-6 lg:gap-8 ${
                    index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                >
                  {/* Icon badge */}
                  <div className="relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-4 border-slate-900 bg-gradient-to-br from-indigo-950/40 to-violet-950/40 text-2xl shadow-lg lg:mx-auto">
                    {step.icon}
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-indigo-400">
                      Étape {index + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6 shadow-sm lg:max-w-md ${
                      index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      {step.description}
                    </p>
                  </div>

                  {/* Spacer for centering on lg */}
                  <div className="hidden lg:block lg:flex-1 lg:max-w-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
