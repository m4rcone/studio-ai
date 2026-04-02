export interface ProcessStep {
  /** Unique identifier. */
  id: string;
  /** Step number, e.g. "01". */
  number: string;
  /** Step name. Max ~50 characters. */
  title: string;
  /** Step description. Max ~150 characters. */
  description: string;
}

export interface ProcessStepsProps {
  /** Eyebrow label. Max ~30 characters. */
  eyebrow: string;
  /** Section heading. Max ~80 characters. */
  headline: string;
  /** Optional subtitle. Max ~200 characters. */
  subtitle?: string;
  /** Array of process steps (4-7 recommended). */
  steps: ProcessStep[];
}

export function ProcessSteps({
  eyebrow,
  headline,
  subtitle,
  steps,
}: ProcessStepsProps) {
  return (
    <section className="bg-primary px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <span className="text-secondary mb-4 block text-xs tracking-[0.2em] uppercase">
            {eyebrow}
          </span>
          <h2 className="text-primary-foreground mb-4 font-[family-name:var(--font-heading)] text-3xl sm:text-4xl">
            {headline}
          </h2>
          {subtitle && (
            <p className="text-primary-foreground/60 mx-auto max-w-xl">
              {subtitle}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className="border-primary-foreground/10 hover:border-secondary/40 border p-8 transition-colors duration-300"
            >
              <div className="text-secondary/30 mb-6 font-[family-name:var(--font-heading)] text-5xl leading-none">
                {step.number}
              </div>
              <h3 className="text-primary-foreground mb-3 font-[family-name:var(--font-heading)] text-lg">
                {step.title}
              </h3>
              <p className="text-primary-foreground/60 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
