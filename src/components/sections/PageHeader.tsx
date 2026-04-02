export interface PageHeaderProps {
  /** Page title. Recommended max 60 characters. */
  title: string;
  /** Optional subtitle/description below the title. Max ~200 characters. */
  subtitle?: string;
  /** Optional breadcrumb or category label shown above the title in secondary color. Max ~30 characters. */
  eyebrow?: string;
}

export function PageHeader({ title, subtitle, eyebrow }: PageHeaderProps) {
  return (
    <section className="bg-muted px-6 py-20">
      <div className="mx-auto max-w-4xl text-center">
        {eyebrow && (
          <span className="text-secondary mb-4 inline-block text-xs tracking-[0.2em] uppercase">
            {eyebrow}
          </span>
        )}
        <h1 className="text-foreground mb-6 font-[family-name:var(--font-heading)] text-4xl sm:text-5xl xl:text-6xl">
          {title}
        </h1>
        <div className="bg-secondary mx-auto mb-6 h-px w-12" />
        {subtitle && (
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
